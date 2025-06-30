<?php
/**
 * Wolthers & Associates - Expense Receipt Upload API
 * trips.wolthers.com/api/expenses/upload-receipt.php
 * 
 * Handles upload of expense receipts and fiscal notes to Azure Blob Storage
 */

require_once '../config.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

// Check if user is authenticated
session_start();
if (!isset($_SESSION['user_id'])) {
    sendError('Authentication required', 401);
}

$user_id = $_SESSION['user_id'];

try {
    // Validate file upload
    if (!isset($_FILES['receipt']) || $_FILES['receipt']['error'] !== UPLOAD_ERR_OK) {
        sendError('No file uploaded or upload error', 400);
    }

    $file = $_FILES['receipt'];
    $expense_id = $_POST['expense_id'] ?? null;
    $attachment_type = $_POST['attachment_type'] ?? 'fiscal_note';
    $is_primary = isset($_POST['is_primary']) ? (bool)$_POST['is_primary'] : false;
    $notes = $_POST['notes'] ?? null;

    // Validate expense_id if provided
    if ($expense_id) {
        $pdo = getDBConnection();
        $stmt = $pdo->prepare("
            SELECT te.id, te.user_id, te.title 
            FROM travel.travel_expenses te 
            WHERE te.id = ? AND te.user_id = ?
        ");
        $stmt->execute([$expense_id, $user_id]);
        $expense = $stmt->fetch();
        
        if (!$expense) {
            sendError('Expense not found or access denied', 404);
        }
    }

    // Validate file type
    $allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    $file_type = mime_content_type($file['tmp_name']);
    
    if (!in_array($file_type, $allowed_types)) {
        sendError('Invalid file type. Allowed: JPEG, PNG, GIF, PDF', 400);
    }

    // Validate file size (10MB max)
    if ($file['size'] > 10 * 1024 * 1024) {
        sendError('File too large. Maximum size: 10MB', 400);
    }

    // Generate unique filename
    $file_extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $unique_filename = uniqid() . '_' . time() . '.' . $file_extension;
    
    // Create folder structure: receipts/YYYY/MM/DD/
    $upload_date = date('Y/m/d');
    $folder_path = "receipts/{$upload_date}/";
    $full_filename = $folder_path . $unique_filename;

    // Azure Blob Storage configuration
    $connection_string = getenv('AZURE_STORAGE_CONNECTION_STRING') ?: '';
    $container_name = getenv('AZURE_STORAGE_CONTAINER') ?: 'wolthers-receipts';
    
    if (empty($connection_string)) {
        // Fallback to local storage for development
        $local_upload_path = __DIR__ . '/../../uploads/' . $folder_path;
        if (!is_dir($local_upload_path)) {
            mkdir($local_upload_path, 0755, true);
        }
        
        $local_file_path = $local_upload_path . $unique_filename;
        
        if (move_uploaded_file($file['tmp_name'], $local_file_path)) {
            $file_url = '/uploads/' . $full_filename;
        } else {
            sendError('Failed to save file locally', 500);
        }
    } else {
        // Upload to Azure Blob Storage
        require_once __DIR__ . '/../../vendor/autoload.php';
        
        try {
            $blobClient = new \MicrosoftAzure\Storage\Blob\BlobRestProxy::createBlobService($connection_string);
            
            // Upload file to Azure Blob Storage
            $content = fopen($file['tmp_name'], 'r');
            $blobClient->createBlockBlob($container_name, $full_filename, $content);
            
            // Get the public URL
            $file_url = "https://" . getenv('AZURE_STORAGE_ACCOUNT') . ".blob.core.windows.net/{$container_name}/{$full_filename}";
            
        } catch (Exception $e) {
            error_log("Azure Blob Storage error: " . $e->getMessage());
            sendError('Failed to upload to cloud storage', 500);
        }
    }

    // Save attachment record to database
    $pdo = getDBConnection();
    
    if ($expense_id) {
        // If this is primary attachment, unset other primary attachments of same type
        if ($is_primary) {
            $updateStmt = $pdo->prepare("
                UPDATE travel.expense_attachments 
                SET is_primary = 0 
                WHERE expense_id = ? AND attachment_type = ?
            ");
            $updateStmt->execute([$expense_id, $attachment_type]);
        }
        
        // Insert attachment record
        $stmt = $pdo->prepare("
            INSERT INTO travel.expense_attachments (
                expense_id, file_name, file_url, file_type, file_size,
                attachment_type, uploaded_by, is_primary, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $expense_id,
            $file['name'],
            $file_url,
            $file_type,
            $file['size'],
            $attachment_type,
            $user_id,
            $is_primary ? 1 : 0,
            $notes
        ]);
        
        $attachment_id = $pdo->lastInsertId();
        
        // Log activity
        logActivity($user_id, 'receipt_uploaded', [
            'expense_id' => $expense_id,
            'attachment_id' => $attachment_id,
            'file_name' => $file['name'],
            'file_size' => $file['size']
        ]);
        
        sendResponse([
            'success' => true,
            'message' => 'Receipt uploaded successfully',
            'attachment_id' => $attachment_id,
            'file_url' => $file_url,
            'file_name' => $file['name'],
            'file_size' => $file['size'],
            'expense_id' => $expense_id
        ]);
        
    } else {
        // Standalone upload (not linked to expense yet)
        sendResponse([
            'success' => true,
            'message' => 'File uploaded successfully',
            'file_url' => $file_url,
            'file_name' => $file['name'],
            'file_size' => $file['size'],
            'temp_filename' => $unique_filename
        ]);
    }

} catch (Exception $e) {
    error_log("Receipt upload error: " . $e->getMessage());
    sendError('Upload failed: ' . $e->getMessage(), 500);
}
?> 