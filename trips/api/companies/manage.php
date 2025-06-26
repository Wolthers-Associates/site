<?php
/**
 * Wolthers & Associates - Company Management API
 * trips.wolthers.com/api/companies/manage.php
 * 
 * Handles CRUD operations for companies
 */

require_once '../config.php';

// Initialize companies table if it doesn't exist
function initializeCompaniesTable() {
    $pdo = getDBConnection();
    
    $sql = "CREATE TABLE IF NOT EXISTS companies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        fantasy_name VARCHAR(255),
        address TEXT,
        city VARCHAR(100),
        country VARCHAR(100),
        postal_code VARCHAR(20),
        phone VARCHAR(50),
        email VARCHAR(255),
        website VARCHAR(255),
        company_type ENUM('importer', 'exporter', 'roaster', 'distributor', 'retailer', 'consultant', 'other') NOT NULL DEFAULT 'other',
        registration_number VARCHAR(100),
        tax_id VARCHAR(100),
        logo_url VARCHAR(500),
        status ENUM('active', 'inactive', 'pending') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_full_name (full_name),
        INDEX idx_company_type (company_type),
        INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $pdo->exec($sql);
    
    // Update users table to include company relationship
    $alterUsersSql = "ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS company_id INT NULL,
        ADD COLUMN IF NOT EXISTS company_role ENUM('staff', 'senior', 'admin') DEFAULT 'staff',
        ADD COLUMN IF NOT EXISTS can_see_company_trips BOOLEAN DEFAULT FALSE,
        ADD INDEX IF NOT EXISTS idx_company_id (company_id),
        ADD FOREIGN KEY IF NOT EXISTS fk_users_company (company_id) REFERENCES companies(id) ON DELETE SET NULL";
    
    try {
        $pdo->exec($alterUsersSql);
    } catch (Exception $e) {
        // Table might already have these columns, that's okay
        error_log("Company columns might already exist: " . $e->getMessage());
    }
}

// Initialize table on first run
initializeCompaniesTable();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetCompanies();
        break;
    case 'POST':
        handleCreateCompany();
        break;
    case 'PUT':
        handleUpdateCompany();
        break;
    case 'DELETE':
        handleDeleteCompany();
        break;
    default:
        sendError('Method not allowed', 405);
}

function handleGetCompanies() {
    $pdo = getDBConnection();
    
    $search = $_GET['search'] ?? '';
    $type = $_GET['type'] ?? '';
    $status = $_GET['status'] ?? 'active';
    $limit = min((int)($_GET['limit'] ?? 50), 100);
    $offset = (int)($_GET['offset'] ?? 0);
    
    $whereConditions = ['1=1'];
    $params = [];
    
    if (!empty($search)) {
        $whereConditions[] = "(full_name LIKE ? OR fantasy_name LIKE ? OR city LIKE ?)";
        $searchTerm = "%{$search}%";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
    }
    
    if (!empty($type)) {
        $whereConditions[] = "company_type = ?";
        $params[] = $type;
    }
    
    if (!empty($status)) {
        $whereConditions[] = "status = ?";
        $params[] = $status;
    }
    
    $whereClause = implode(' AND ', $whereConditions);
    
    // Get total count
    $countSql = "SELECT COUNT(*) as total FROM companies WHERE {$whereClause}";
    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute($params);
    $total = $countStmt->fetch()['total'];
    
    // Get companies with user count
    $sql = "SELECT 
        c.*,
        COUNT(u.id) as user_count,
        COUNT(CASE WHEN u.company_role = 'admin' THEN 1 END) as admin_count
    FROM companies c
    LEFT JOIN users u ON c.id = u.company_id AND u.status = 'active'
    WHERE {$whereClause}
    GROUP BY c.id
    ORDER BY c.full_name ASC
    LIMIT ? OFFSET ?";
    
    $params[] = $limit;
    $params[] = $offset;
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $companies = $stmt->fetchAll();
    
    sendResponse([
        'companies' => $companies,
        'total' => (int)$total,
        'limit' => $limit,
        'offset' => $offset
    ]);
}

function handleCreateCompany() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $required = ['full_name', 'company_type'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            sendError("Field '{$field}' is required");
        }
    }
    
    $pdo = getDBConnection();
    
    // Check for duplicate company name
    $checkStmt = $pdo->prepare("SELECT id FROM companies WHERE full_name = ?");
    $checkStmt->execute([$input['full_name']]);
    if ($checkStmt->fetch()) {
        sendError('Company with this name already exists');
    }
    
    $sql = "INSERT INTO companies (
        full_name, fantasy_name, address, city, country, postal_code,
        phone, email, website, company_type, registration_number, tax_id, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    $params = [
        $input['full_name'],
        $input['fantasy_name'] ?? null,
        $input['address'] ?? null,
        $input['city'] ?? null,
        $input['country'] ?? null,
        $input['postal_code'] ?? null,
        $input['phone'] ?? null,
        $input['email'] ?? null,
        $input['website'] ?? null,
        $input['company_type'],
        $input['registration_number'] ?? null,
        $input['tax_id'] ?? null,
        $input['status'] ?? 'active'
    ];
    
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        $companyId = $pdo->lastInsertId();
        
        // Get the created company
        $getStmt = $pdo->prepare("SELECT * FROM companies WHERE id = ?");
        $getStmt->execute([$companyId]);
        $company = $getStmt->fetch();
        
        logActivity(null, 'company_created', [
            'company_id' => $companyId,
            'company_name' => $input['full_name'],
            'company_type' => $input['company_type']
        ]);
        
        sendResponse([
            'success' => true,
            'message' => 'Company created successfully',
            'company' => $company
        ], 201);
        
    } catch (Exception $e) {
        sendError('Failed to create company: ' . $e->getMessage(), 500);
    }
}

function handleUpdateCompany() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['id'])) {
        sendError('Company ID is required');
    }
    
    $pdo = getDBConnection();
    
    // Check if company exists
    $checkStmt = $pdo->prepare("SELECT * FROM companies WHERE id = ?");
    $checkStmt->execute([$input['id']]);
    $existingCompany = $checkStmt->fetch();
    
    if (!$existingCompany) {
        sendError('Company not found', 404);
    }
    
    $updateFields = [];
    $params = [];
    
    $allowedFields = [
        'full_name', 'fantasy_name', 'address', 'city', 'country', 'postal_code',
        'phone', 'email', 'website', 'company_type', 'registration_number', 'tax_id', 'status'
    ];
    
    foreach ($allowedFields as $field) {
        if (isset($input[$field])) {
            $updateFields[] = "{$field} = ?";
            $params[] = $input[$field];
        }
    }
    
    if (empty($updateFields)) {
        sendError('No valid fields to update');
    }
    
    $params[] = $input['id'];
    
    $sql = "UPDATE companies SET " . implode(', ', $updateFields) . " WHERE id = ?";
    
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        // Get updated company
        $getStmt = $pdo->prepare("SELECT * FROM companies WHERE id = ?");
        $getStmt->execute([$input['id']]);
        $company = $getStmt->fetch();
        
        logActivity(null, 'company_updated', [
            'company_id' => $input['id'],
            'updated_fields' => array_keys($input)
        ]);
        
        sendResponse([
            'success' => true,
            'message' => 'Company updated successfully',
            'company' => $company
        ]);
        
    } catch (Exception $e) {
        sendError('Failed to update company: ' . $e->getMessage(), 500);
    }
}

function handleDeleteCompany() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['id'])) {
        sendError('Company ID is required');
    }
    
    $pdo = getDBConnection();
    
    // Check if company has users
    $userCheckStmt = $pdo->prepare("SELECT COUNT(*) as user_count FROM users WHERE company_id = ?");
    $userCheckStmt->execute([$input['id']]);
    $userCount = $userCheckStmt->fetch()['user_count'];
    
    if ($userCount > 0) {
        sendError('Cannot delete company with active users. Please reassign or remove users first.');
    }
    
    try {
        $stmt = $pdo->prepare("DELETE FROM companies WHERE id = ?");
        $stmt->execute([$input['id']]);
        
        if ($stmt->rowCount() === 0) {
            sendError('Company not found', 404);
        }
        
        logActivity(null, 'company_deleted', [
            'company_id' => $input['id']
        ]);
        
        sendResponse([
            'success' => true,
            'message' => 'Company deleted successfully'
        ]);
        
    } catch (Exception $e) {
        sendError('Failed to delete company: ' . $e->getMessage(), 500);
    }
}
?> 