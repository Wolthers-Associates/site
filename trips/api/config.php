<?php
/**
 * Wolthers & Associates - API Configuration
 * trips.wolthers.com backend configuration
 */

// Error reporting for development
if (getenv('ENVIRONMENT') === 'development') {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// CORS headers for frontend access
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Load secure configuration if available (production)
if (file_exists(__DIR__ . '/secure-config.php')) {
    require_once __DIR__ . '/secure-config.php';
}

// Database configuration - Use secure config if available, otherwise fallback to environment variables or defaults
if (!defined('DB_HOST')) {
    define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
}
if (!defined('DB_NAME')) {
    define('DB_NAME', getenv('DB_NAME') ?: 'u975408171_wolthers_trips');
}
if (!defined('DB_USER')) {
    define('DB_USER', getenv('DB_USER') ?: 'u975408171_wolthers_user');
}
if (!defined('DB_PASS')) {
    define('DB_PASS', getenv('DB_PASSWORD') ?: '');
}
define('DB_CHARSET', 'utf8mb4');

// Application configuration
define('APP_NAME', 'Wolthers & Associates - Trips');
define('APP_VERSION', '1.0.0');
define('API_VERSION', 'v1');

// Environment configuration
define('ENVIRONMENT', getenv('ENVIRONMENT') ?: 'development');
define('DEBUG_MODE', ENVIRONMENT === 'development');

// Security configuration
define('JWT_SECRET', getenv('JWT_SECRET') ?: 'your-jwt-secret-key-change-in-production');
define('SESSION_TIMEOUT', 3600); // 1 hour

// Authentication configuration - Only define if not already set by secure-config.php
if (!defined('OFFICE365_CLIENT_ID')) {
    define('OFFICE365_CLIENT_ID', getenv('OFFICE365_CLIENT_ID') ?: '');
}
if (!defined('OFFICE365_CLIENT_SECRET')) {
    define('OFFICE365_CLIENT_SECRET', getenv('OFFICE365_CLIENT_SECRET') ?: '');
}
if (!defined('OFFICE365_TENANT_ID')) {
    define('OFFICE365_TENANT_ID', getenv('OFFICE365_TENANT_ID') ?: '');
}

// Email configuration (for future notifications)
define('SMTP_HOST', getenv('SMTP_HOST') ?: 'smtp.gmail.com');
define('SMTP_PORT', getenv('SMTP_PORT') ?: 587);
define('SMTP_USER', getenv('SMTP_USER') ?: '');
define('SMTP_PASS', getenv('SMTP_PASSWORD') ?: '');

// File upload configuration
define('UPLOAD_MAX_SIZE', 10 * 1024 * 1024); // 10MB
define('UPLOAD_ALLOWED_TYPES', ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'xlsx', 'csv']);
define('UPLOAD_PATH', __DIR__ . '/../uploads/');

// Database connection function
function getDBConnection() {
    static $pdo = null;
    
    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            if (DEBUG_MODE) {
                error_log("Database connection failed: " . $e->getMessage());
            }
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed']);
            exit();
        }
    }
    
    return $pdo;
}

// Response helper functions
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

// Authentication helper (for future implementation)
function validateSession() {
    if (!isset($_SESSION['user_id']) || !isset($_SESSION['token'])) {
        return false;
    }
    
    try {
        $pdo = getDBConnection();
        $stmt = $pdo->prepare("
            SELECT u.*, s.expires_at 
            FROM users u 
            JOIN user_sessions s ON u.id = s.user_id 
            WHERE u.id = ? AND s.token = ? AND s.expires_at > NOW() AND s.is_active = 1
        ");
        $stmt->execute([$_SESSION['user_id'], $_SESSION['token']]);
        
        $user = $stmt->fetch();
        if ($user) {
            // Update last activity
            $updateStmt = $pdo->prepare("UPDATE user_sessions SET last_activity = NOW() WHERE token = ?");
            $updateStmt->execute([$_SESSION['token']]);
            
            return [
                'user_id' => $user['id'],
                'email' => $user['email'],
                'role' => $user['role'],
                'name' => $user['name']
            ];
        }
    } catch (Exception $e) {
        error_log("Session validation error: " . $e->getMessage());
    }
    
    return false;
}

// Logging function
function logActivity($user_id, $action, $details = null) {
    if (!DEBUG_MODE) return; // Only log in debug mode for now
    
    $log_entry = [
        'timestamp' => date('c'),
        'user_id' => $user_id,
        'action' => $action,
        'details' => $details,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
    ];
    
    error_log("TRIPS_API: " . json_encode($log_entry));
}

// Office 365 token validation function
function validateOffice365Token($accessToken) {
    if (!$accessToken) return false;
    
    try {
        // Call Microsoft Graph API to get user info
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'https://graph.microsoft.com/v1.0/me');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $accessToken,
            'Content-Type: application/json'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 200) {
            $userInfo = json_decode($response, true);
            return [
                'id' => $userInfo['id'],
                'email' => $userInfo['mail'] ?? $userInfo['userPrincipalName'],
                'name' => $userInfo['displayName'],
                'first_name' => $userInfo['givenName'] ?? '',
                'last_name' => $userInfo['surname'] ?? ''
            ];
        }
    } catch (Exception $e) {
        if (DEBUG_MODE) {
            error_log("Office 365 validation error: " . $e->getMessage());
        }
    }
    
    return false;
}

// Password hashing and verification functions
function hashPassword($password) {
    return password_hash($password, PASSWORD_DEFAULT);
}

function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

// Development mode indicators
if (DEBUG_MODE) {
    header('X-Environment: development');
    header('X-Debug-Mode: enabled');
}

?> 