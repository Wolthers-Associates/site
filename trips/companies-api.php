<?php
/**
 * Companies API for Hostinger Database
 * Direct connection to load real company data
 */

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors in production

function sendResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit();
}

function sendError($message, $status = 400) {
    http_response_code($status);
    echo json_encode([
        'error' => $message,
        'status' => $status,
        'timestamp' => date('c')
    ], JSON_PRETTY_PRINT);
    exit();
}

// Database connection for Hostinger
require_once __DIR__ . '/api/secure-config.php';
function getDBConnection() {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $dsn = "sqlsrv:Server=" . DB_HOST . ";Database=" . DB_NAME . ";Encrypt=yes";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ];
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            sendError('Database connection failed: ' . $e->getMessage(), 500);
        }
    }
    return $pdo;
}

// Handle different HTTP methods
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            handleGetCompanies();
            break;
        case 'POST':
            handlePostRequest();
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
} catch (Exception $e) {
    sendError('Server error: ' . $e->getMessage(), 500);
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
        COALESCE(u.user_count, 0) as user_count,
        COALESCE(u.admin_count, 0) as admin_count
    FROM companies c
    LEFT JOIN (
        SELECT 
            company_id,
            COUNT(*) as user_count,
            COUNT(CASE WHEN company_role = 'admin' THEN 1 END) as admin_count
        FROM users 
        WHERE status = 'active'
        GROUP BY company_id
    ) u ON c.id = u.company_id
    WHERE {$whereClause}
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

function handlePostRequest() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        sendError('Invalid JSON input');
    }
    
    $action = $input['action'] ?? 'create';
    
    switch ($action) {
        case 'create':
            handleCreateCompany($input);
            break;
        case 'update':
            handleUpdateCompanyAction($input);
            break;
        case 'delete':
            handleDeleteCompanyAction($input);
            break;
        default:
            sendError('Invalid action');
    }
}

function handleCreateCompany($input) {
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
        full_name, fantasy_name, address, city, state, country, postal_code,
        phone, email, company_type, registration_number, tax_id, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    $params = [
        $input['full_name'],
        $input['fantasy_name'] ?? null,
        $input['address'] ?? null,
        $input['city'] ?? null,
        $input['state'] ?? null,
        $input['country'] ?? null,
        $input['postal_code'] ?? null,
        $input['phone'] ?? null,
        $input['email'] ?? null,
        $input['company_type'],
        $input['registration_number'] ?? null,
        $input['tax_id'] ?? null,
        $input['status'] ?? 'active'
    ];
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    $companyId = $pdo->lastInsertId();
    
    // Get the created company
    $getStmt = $pdo->prepare("SELECT * FROM companies WHERE id = ?");
    $getStmt->execute([$companyId]);
    $company = $getStmt->fetch();
    
    sendResponse([
        'success' => true,
        'message' => 'Company created successfully',
        'company' => $company
    ]);
}

function handleUpdateCompanyAction($input) {
    if (empty($input['id'])) {
        sendError('Company ID is required for update');
    }
    
    $pdo = getDBConnection();
    
    // Check if company exists
    $checkStmt = $pdo->prepare("SELECT id FROM companies WHERE id = ?");
    $checkStmt->execute([$input['id']]);
    if (!$checkStmt->fetch()) {
        sendError('Company not found');
    }
    
    $updateFields = [];
    $params = [];
    
    $allowedFields = [
        'full_name', 'fantasy_name', 'address', 'city', 'state', 'country', 
        'postal_code', 'phone', 'email', 'company_type', 'registration_number', 
        'tax_id', 'status'
    ];
    
    foreach ($allowedFields as $field) {
        if (isset($input[$field])) {
            $updateFields[] = "$field = ?";
            $params[] = $input[$field];
        }
    }
    
    if (empty($updateFields)) {
        sendError('No fields to update');
    }
    
    $params[] = $input['id'];
    $sql = "UPDATE companies SET " . implode(', ', $updateFields) . " WHERE id = ?";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    // Get the updated company
    $getStmt = $pdo->prepare("SELECT * FROM companies WHERE id = ?");
    $getStmt->execute([$input['id']]);
    $company = $getStmt->fetch();
    
    sendResponse([
        'success' => true,
        'message' => 'Company updated successfully',
        'company' => $company
    ]);
}

function handleDeleteCompanyAction($input) {
    if (empty($input['id'])) {
        sendError('Company ID is required for delete');
    }
    
    $pdo = getDBConnection();
    
    // Check if company exists
    $checkStmt = $pdo->prepare("SELECT * FROM companies WHERE id = ?");
    $checkStmt->execute([$input['id']]);
    $company = $checkStmt->fetch();
    
    if (!$company) {
        sendError('Company not found');
    }
    
    // Delete the company
    $deleteStmt = $pdo->prepare("DELETE FROM companies WHERE id = ?");
    $deleteStmt->execute([$input['id']]);
    
    sendResponse([
        'success' => true,
        'message' => 'Company deleted successfully',
        'company' => $company
    ]);
}

function handleUpdateCompany() {
    // Handle PUT requests (alternative to POST with action=update)
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        sendError('Invalid JSON input');
    }
    
    handleUpdateCompanyAction($input);
}

function handleDeleteCompany() {
    // Handle DELETE requests
    $id = $_GET['id'] ?? null;
    if (!$id) {
        sendError('Company ID is required');
    }
    
    handleDeleteCompanyAction(['id' => $id]);
}
?> 