<?php
/**
 * Users API for Hostinger Database
 * Direct connection to load real user data
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
            handleGetUsers();
            break;
        case 'POST':
            handlePostRequest();
            break;
        case 'PUT':
            handleUpdateUser();
            break;
        case 'DELETE':
            handleDeleteUser();
            break;
        default:
            sendError('Method not allowed', 405);
    }
} catch (Exception $e) {
    sendError('Server error: ' . $e->getMessage(), 500);
}

function handleGetUsers() {
    $pdo = getDBConnection();
    
    // Check if requesting a specific user
    $userId = $_GET['id'] ?? '';
    if (!empty($userId)) {
        handleGetSingleUser($userId);
        return;
    }
    
    $search = $_GET['search'] ?? '';
    $role = $_GET['role'] ?? '';
    $status = $_GET['status'] ?? 'active';
    $company_id = $_GET['company_id'] ?? '';
    $limit = min((int)($_GET['limit'] ?? 50), 100);
    $offset = (int)($_GET['offset'] ?? 0);
    $auth_check = $_GET['auth_check'] ?? '';
    
    $whereConditions = ['1=1'];
    $params = [];
    $whereConditionsForCount = ['1=1'];
    $paramsForCount = [];
    
    if (!empty($search)) {
        $whereConditions[] = "(u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)";
        $whereConditionsForCount[] = "(name LIKE ? OR email LIKE ? OR phone LIKE ?)";
        $searchTerm = "%{$search}%";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $paramsForCount[] = $searchTerm;
        $paramsForCount[] = $searchTerm;
        $paramsForCount[] = $searchTerm;
    }
    
    if (!empty($role)) {
        $whereConditions[] = "u.role = ?";
        $whereConditionsForCount[] = "role = ?";
        $params[] = $role;
        $paramsForCount[] = $role;
    }
    
    if (!empty($status)) {
        $whereConditions[] = "u.status = ?";
        $whereConditionsForCount[] = "status = ?";
        $params[] = $status;
        $paramsForCount[] = $status;
    }
    
    if (!empty($company_id)) {
        $whereConditions[] = "u.company_id = ?";
        $whereConditionsForCount[] = "company_id = ?";
        $params[] = $company_id;
        $paramsForCount[] = $company_id;
    }
    
    $whereClause = implode(' AND ', $whereConditions);
    $whereClauseForCount = implode(' AND ', $whereConditionsForCount);
    
    // Get total count
    $countSql = "SELECT COUNT(*) as total FROM users WHERE {$whereClauseForCount}";
    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute($paramsForCount);
    $total = $countStmt->fetch()['total'];
    
    // Get users with company information
    $sql = "SELECT 
        u.*,
        c.full_name as company_full_name,
        c.fantasy_name as company_fantasy_name,
        c.company_type as company_type
    FROM users u
    LEFT JOIN companies c ON u.company_id = c.id
    WHERE {$whereClause}
    ORDER BY u.name ASC
    LIMIT ? OFFSET ?";
    
    $params[] = $limit;
    $params[] = $offset;
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $users = $stmt->fetchAll();
    
    // Format users for frontend compatibility
    $formattedUsers = array_map(function($user) {
        return [
            'id' => $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'phone' => $user['phone'],
            'role' => $user['role'],
            'status' => $user['status'],
            'company_id' => $user['company_id'],
            'company_name' => $user['company_fantasy_name'] ?: $user['company_full_name'],
            'company_role' => $user['company_role'],
            'can_see_company_trips' => (bool)$user['can_see_company_trips'],
            'avatar' => $user['avatar'],
            'last_login' => $user['last_login_at'] ?? $user['last_login'],
            'last_active' => $user['last_active'],
            'created_at' => $user['created_at'],
            'updated_at' => $user['updated_at']
        ];
    }, $users);
    
    // Calculate statistics
    $statistics = [
        'total_users' => $total,
        'active_users' => 0,
        'admin_users' => 0,
        'company_linked' => 0
    ];
    
    foreach ($formattedUsers as $user) {
        if ($user['status'] === 'active') $statistics['active_users']++;
        if ($user['role'] === 'admin') $statistics['admin_users']++;
        if ($user['company_id']) $statistics['company_linked']++;
    }
    
    if ($auth_check) {
        // Special response format for auth check
        sendResponse([
            'success' => true,
            'users' => $formattedUsers,
            'statistics' => $statistics,
            'total' => (int)$total
        ]);
    } else {
        sendResponse([
            'users' => $formattedUsers,
            'total' => (int)$total,
            'limit' => $limit,
            'offset' => $offset,
            'statistics' => $statistics
        ]);
    }
}

function handleGetSingleUser($userId) {
    $pdo = getDBConnection();
    
    // Get user with company information
    $sql = "SELECT 
        u.*,
        c.full_name as company_full_name,
        c.fantasy_name as company_fantasy_name,
        c.company_type as company_type
    FROM users u
    LEFT JOIN companies c ON u.company_id = c.id
    WHERE u.id = ?";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    
    if (!$user) {
        sendError('User not found', 404);
    }
    
    // Format user for frontend
    $formattedUser = [
        'id' => $user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'phone' => $user['phone'],
        'role' => $user['role'],
        'status' => $user['status'],
        'company_id' => $user['company_id'],
        'company_name' => $user['company_fantasy_name'] ?: $user['company_full_name'],
        'company_role' => $user['company_role'],
        'can_see_company_trips' => (bool)$user['can_see_company_trips'],
        'avatar' => $user['avatar'],
        'last_login' => $user['last_login_at'] ?? $user['last_login'],
        'last_active' => $user['last_active'],
        'created_at' => $user['created_at'],
        'updated_at' => $user['updated_at']
    ];
    
    sendResponse([
        'success' => true,
        'user' => $formattedUser
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
            handleCreateUser($input);
            break;
        case 'update':
            handleUpdateUserAction($input);
            break;
        case 'delete':
            handleDeleteUserAction($input);
            break;
        case 'link_company':
            handleLinkUserToCompany($input);
            break;
        default:
            sendError('Invalid action');
    }
}

function handleCreateUser($input) {
    $required = ['name', 'email'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            sendError("Field '{$field}' is required");
        }
    }
    
    $pdo = getDBConnection();
    
    // Check for duplicate email
    $checkStmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $checkStmt->execute([$input['email']]);
    if ($checkStmt->fetch()) {
        sendError('User with this email already exists');
    }
    
    $sql = "INSERT INTO users (
        name, email, phone, role, status, company_id, company_role, 
        can_see_company_trips, avatar, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";
    
    $params = [
        $input['name'],
        $input['email'],
        $input['phone'] ?? null,
        $input['role'] ?? 'user',
        $input['status'] ?? 'active',
        $input['company_id'] ?? null,
        $input['company_role'] ?? 'staff',
        isset($input['can_see_company_trips']) ? (int)$input['can_see_company_trips'] : 0,
        $input['avatar'] ?? substr($input['name'], 0, 1)
    ];
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    // Get the auto-generated user ID
    $userId = $pdo->lastInsertId();
    
    // Get the created user with company info
    $getUserSql = "SELECT 
        u.*,
        c.full_name as company_full_name,
        c.fantasy_name as company_fantasy_name
    FROM users u
    LEFT JOIN companies c ON u.company_id = c.id
    WHERE u.id = ?";
    
    $getUserStmt = $pdo->prepare($getUserSql);
    $getUserStmt->execute([$userId]);
    $user = $getUserStmt->fetch();
    
    // Format for frontend
    $formattedUser = [
        'id' => $user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'phone' => $user['phone'],
        'role' => $user['role'],
        'status' => $user['status'],
        'company_id' => $user['company_id'],
        'company_name' => $user['company_fantasy_name'] ?: $user['company_full_name'],
        'company_role' => $user['company_role'],
        'can_see_company_trips' => (bool)$user['can_see_company_trips'],
        'avatar' => $user['avatar'],
        'last_login' => $user['last_login_at'] ?? $user['last_login'],
        'last_active' => $user['last_active'],
        'created_at' => $user['created_at'],
        'updated_at' => $user['updated_at']
    ];
    
    sendResponse([
        'success' => true,
        'message' => 'User created successfully',
        'user' => $formattedUser
    ]);
}

function handleUpdateUserAction($input) {
    if (empty($input['id'])) {
        sendError('User ID is required for update');
    }
    
    $pdo = getDBConnection();
    
    // Check if user exists
    $checkStmt = $pdo->prepare("SELECT id FROM users WHERE id = ?");
    $checkStmt->execute([$input['id']]);
    if (!$checkStmt->fetch()) {
        sendError('User not found');
    }
    
    $updateFields = [];
    $params = [];
    
    $allowedFields = [
        'name', 'email', 'phone', 'role', 'status', 'company_id', 
        'company_role', 'can_see_company_trips', 'avatar'
    ];
    
    foreach ($allowedFields as $field) {
        if (isset($input[$field])) {
            $updateFields[] = "$field = ?";
            if ($field === 'can_see_company_trips') {
                $params[] = (int)$input[$field];
            } else {
                $params[] = $input[$field];
            }
        }
    }
    
    if (empty($updateFields)) {
        sendError('No fields to update');
    }
    
    $updateFields[] = "updated_at = NOW()";
    $params[] = $input['id'];
    $sql = "UPDATE users SET " . implode(', ', $updateFields) . " WHERE id = ?";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    // Get the updated user with company info
    $getUserSql = "SELECT 
        u.*,
        c.full_name as company_full_name,
        c.fantasy_name as company_fantasy_name
    FROM users u
    LEFT JOIN companies c ON u.company_id = c.id
    WHERE u.id = ?";
    
    $getUserStmt = $pdo->prepare($getUserSql);
    $getUserStmt->execute([$input['id']]);
    $user = $getUserStmt->fetch();
    
    // Format for frontend
    $formattedUser = [
        'id' => $user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'phone' => $user['phone'],
        'role' => $user['role'],
        'status' => $user['status'],
        'company_id' => $user['company_id'],
        'company_name' => $user['company_fantasy_name'] ?: $user['company_full_name'],
        'company_role' => $user['company_role'],
        'can_see_company_trips' => (bool)$user['can_see_company_trips'],
        'avatar' => $user['avatar'],
        'last_login' => $user['last_login_at'] ?? $user['last_login'],
        'last_active' => $user['last_active'],
        'created_at' => $user['created_at'],
        'updated_at' => $user['updated_at']
    ];
    
    sendResponse([
        'success' => true,
        'message' => 'User updated successfully',
        'user' => $formattedUser
    ]);
}

function handleDeleteUserAction($input) {
    if (empty($input['id'])) {
        sendError('User ID is required for delete');
    }
    
    $pdo = getDBConnection();
    
    // Check if user exists
    $checkStmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $checkStmt->execute([$input['id']]);
    $user = $checkStmt->fetch();
    
    if (!$user) {
        sendError('User not found');
    }
    
    // Delete the user
    $deleteStmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
    $deleteStmt->execute([$input['id']]);
    
    sendResponse([
        'success' => true,
        'message' => 'User deleted successfully',
        'user' => $user
    ]);
}

function handleLinkUserToCompany($input) {
    if (empty($input['user_id']) || empty($input['company_id'])) {
        sendError('User ID and Company ID are required');
    }
    
    $pdo = getDBConnection();
    
    $sql = "UPDATE users SET 
        company_id = ?, 
        company_role = ?, 
        can_see_company_trips = ?,
        updated_at = NOW()
    WHERE id = ?";
    
    $params = [
        $input['company_id'],
        $input['company_role'] ?? 'staff',
        isset($input['can_see_company_trips']) ? (int)$input['can_see_company_trips'] : 0,
        $input['user_id']
    ];
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    sendResponse([
        'success' => true,
        'message' => 'User linked to company successfully'
    ]);
}

function handleUpdateUser() {
    // Handle PUT requests (alternative to POST with action=update)
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        sendError('Invalid JSON input');
    }
    
    handleUpdateUserAction($input);
}

function handleDeleteUser() {
    // Handle DELETE requests
    $id = $_GET['id'] ?? null;
    if (!$id) {
        sendError('User ID is required');
    }
    
    handleDeleteUserAction(['id' => $id]);
}

function generateUserId($name) {
    // Generate a user ID from name (similar to frontend logic)
    $cleanName = preg_replace('/[^a-zA-Z0-9\s]/', '', $name);
    $words = explode(' ', trim($cleanName));
    
    if (count($words) >= 2) {
        return strtolower($words[0] . '.' . $words[count($words) - 1]);
    } else {
        return strtolower($words[0] ?? 'user') . '.' . rand(100, 999);
    }
}
?> 