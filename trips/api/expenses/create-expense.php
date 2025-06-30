<?php
/**
 * Wolthers & Associates - Create Expense API
 * trips.wolthers.com/api/expenses/create-expense.php
 * 
 * Creates new travel expenses with fiscal notes and payment information
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
    $pdo = getDBConnection();
    
    // Get and validate input data
    $trip_id = $_POST['trip_id'] ?? null;
    $category_id = $_POST['category_id'] ?? null;
    $title = trim($_POST['title'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $amount = floatval($_POST['amount'] ?? 0);
    $currency = $_POST['currency'] ?? 'BRL';
    $expense_date = $_POST['expense_date'] ?? date('Y-m-d');
    $expense_time = $_POST['expense_time'] ?? null;
    $location = trim($_POST['location'] ?? '');
    $vendor_name = trim($_POST['vendor_name'] ?? '');
    $fiscal_note_number = trim($_POST['fiscal_note_number'] ?? '');
    $payment_method = $_POST['payment_method'] ?? '';
    $credit_card_last4 = trim($_POST['credit_card_last4'] ?? '');
    $credit_card_type = trim($_POST['credit_card_type'] ?? '');
    $is_company_expense = isset($_POST['is_company_expense']) ? (bool)$_POST['is_company_expense'] : true;
    $notes = trim($_POST['notes'] ?? '');
    $fiscal_note_url = $_POST['fiscal_note_url'] ?? null;
    $receipt_url = $_POST['receipt_url'] ?? null;
    
    // Validate required fields
    if (empty($category_id)) {
        sendError('Expense category is required', 400);
    }
    
    if (empty($title)) {
        sendError('Expense title is required', 400);
    }
    
    if ($amount <= 0) {
        sendError('Expense amount must be greater than zero', 400);
    }
    
    if (empty($payment_method)) {
        sendError('Payment method is required', 400);
    }
    
    // Validate payment method
    $valid_payment_methods = ['company_card', 'personal_card', 'cash', 'bank_transfer', 'other'];
    if (!in_array($payment_method, $valid_payment_methods)) {
        sendError('Invalid payment method', 400);
    }
    
    // Validate category exists
    $stmt = $pdo->prepare("SELECT id, name FROM travel.expense_categories WHERE id = ? AND is_active = 1");
    $stmt->execute([$category_id]);
    $category = $stmt->fetch();
    
    if (!$category) {
        sendError('Invalid expense category', 400);
    }
    
    // Validate trip_id if provided
    if ($trip_id) {
        $stmt = $pdo->prepare("SELECT id, title FROM travel.trips WHERE id = ?");
        $stmt->execute([$trip_id]);
        $trip = $stmt->fetch();
        
        if (!$trip) {
            sendError('Invalid trip ID', 400);
        }
    }
    
    // Validate credit card information if using card payment
    if (in_array($payment_method, ['company_card', 'personal_card'])) {
        if (empty($credit_card_last4) || strlen($credit_card_last4) !== 4 || !is_numeric($credit_card_last4)) {
            sendError('Valid credit card last 4 digits are required for card payments', 400);
        }
    }
    
    // Validate date format
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $expense_date)) {
        sendError('Invalid expense date format. Use YYYY-MM-DD', 400);
    }
    
    // Validate time format if provided
    if ($expense_time && !preg_match('/^\d{2}:\d{2}:\d{2}$/', $expense_time)) {
        sendError('Invalid expense time format. Use HH:MM:SS', 400);
    }
    
    // Check expense policy limits
    $stmt = $pdo->prepare("
        SELECT ep.max_amount, ep.requires_approval, ep.approval_level
        FROM travel.expense_policies ep
        WHERE ep.category_id = ? 
        AND ep.is_active = 1 
        AND ep.effective_date <= ?
        AND (ep.expiry_date IS NULL OR ep.expiry_date >= ?)
        ORDER BY ep.effective_date DESC
        LIMIT 1
    ");
    $stmt->execute([$category_id, $expense_date, $expense_date]);
    $policy = $stmt->fetch();
    
    $requires_approval = true; // Default to requiring approval
    $approval_level = 1; // Default approval level
    
    if ($policy) {
        if ($policy['max_amount'] && $amount > $policy['max_amount']) {
            sendError("Expense amount exceeds policy limit of {$policy['max_amount']} {$currency}", 400);
        }
        $requires_approval = (bool)$policy['requires_approval'];
        $approval_level = $policy['approval_level'];
    }
    
    // Start transaction
    $pdo->beginTransaction();
    
    try {
        // Insert expense record
        $stmt = $pdo->prepare("
            INSERT INTO travel.travel_expenses (
                user_id, trip_id, expense_category_id, title, description,
                amount, currency, expense_date, expense_time, location,
                vendor_name, fiscal_note_number, fiscal_note_url, receipt_url,
                payment_method, credit_card_last4, credit_card_type,
                is_company_expense, status, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $status = $requires_approval ? 'pending' : 'approved';
        
        $stmt->execute([
            $user_id, $trip_id, $category_id, $title, $description,
            $amount, $currency, $expense_date, $expense_time, $location,
            $vendor_name, $fiscal_note_number, $fiscal_note_url, $receipt_url,
            $payment_method, $credit_card_last4, $credit_card_type,
            $is_company_expense ? 1 : 0, $status, $notes
        ]);
        
        $expense_id = $pdo->lastInsertId();
        
        // Add fiscal note attachment if URL provided
        if ($fiscal_note_url) {
            $stmt = $pdo->prepare("
                INSERT INTO travel.expense_attachments (
                    expense_id, file_name, file_url, file_type, file_size,
                    attachment_type, uploaded_by, is_primary, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $file_name = basename($fiscal_note_url);
            $file_type = 'image/jpeg'; // Default, could be determined from URL
            $file_size = 0; // Could be determined if needed
            
            $stmt->execute([
                $expense_id, $file_name, $fiscal_note_url, $file_type, $file_size,
                'fiscal_note', $user_id, 1, 'Fiscal note for expense'
            ]);
        }
        
        // Add receipt attachment if URL provided
        if ($receipt_url) {
            $stmt = $pdo->prepare("
                INSERT INTO travel.expense_attachments (
                    expense_id, file_name, file_url, file_type, file_size,
                    attachment_type, uploaded_by, is_primary, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $file_name = basename($receipt_url);
            $file_type = 'image/jpeg'; // Default, could be determined from URL
            $file_size = 0; // Could be determined if needed
            
            $stmt->execute([
                $expense_id, $file_name, $receipt_url, $file_type, $file_size,
                'receipt', $user_id, 0, 'Receipt for expense'
            ]);
        }
        
        // Auto-approve if no approval required
        if (!$requires_approval) {
            $stmt = $pdo->prepare("
                INSERT INTO travel.expense_approvals (
                    expense_id, approver_id, action, comments
                ) VALUES (?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $expense_id, $user_id, 'approve', 'Auto-approved per policy'
            ]);
            
            // Update expense status
            $stmt = $pdo->prepare("
                UPDATE travel.travel_expenses 
                SET status = 'approved', approved_by = ?, approved_at = GETUTCDATE()
                WHERE id = ?
            ");
            $stmt->execute([$user_id, $expense_id]);
        }
        
        // Commit transaction
        $pdo->commit();
        
        // Log activity
        logActivity($user_id, 'expense_created', [
            'expense_id' => $expense_id,
            'amount' => $amount,
            'currency' => $currency,
            'category' => $category['name'],
            'payment_method' => $payment_method,
            'status' => $status
        ]);
        
        // Get created expense details
        $stmt = $pdo->prepare("
            SELECT 
                te.id, te.title, te.description, te.amount, te.currency,
                te.expense_date, te.expense_time, te.location, te.vendor_name,
                te.fiscal_note_number, te.payment_method, te.credit_card_last4,
                te.credit_card_type, te.is_company_expense, te.status,
                te.submitted_at, te.notes, te.created_at,
                ec.name as category_name, ec.category_type,
                t.title as trip_title, t.destination_country
            FROM travel.travel_expenses te
            LEFT JOIN travel.expense_categories ec ON te.expense_category_id = ec.id
            LEFT JOIN travel.trips t ON te.trip_id = t.id
            WHERE te.id = ?
        ");
        $stmt->execute([$expense_id]);
        $expense = $stmt->fetch();
        
        sendResponse([
            'success' => true,
            'message' => 'Expense created successfully',
            'expense_id' => $expense_id,
            'status' => $status,
            'requires_approval' => $requires_approval,
            'expense' => $expense
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
    
} catch (Exception $e) {
    error_log("Create expense error: " . $e->getMessage());
    sendError('Failed to create expense: ' . $e->getMessage(), 500);
}
?> 