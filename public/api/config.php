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

// Database configuration
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'wolthers_trips');
define('DB_USER', getenv('DB_USER') ?: 'wolthers_user');
define('DB_PASS', getenv('DB_PASSWORD') ?: '');
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

// Authentication configuration (for future Office 365 integration)
define('OFFICE365_CLIENT_ID', getenv('OFFICE365_CLIENT_ID') ?: '');
define('OFFICE365_CLIENT_SECRET', getenv('OFFICE365_CLIENT_SECRET') ?: '');
define('OFFICE365_TENANT_ID', getenv('OFFICE365_TENANT_ID') ?: '');

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
    // Mock validation for development
    if (ENVIRONMENT === 'development') {
        return [
            'user_id' => 1,
            'email' => 'daniel@wolthers.com',
            'role' => 'admin',
            'name' => 'Daniel Wolthers'
        ];
    }
    
    // TODO: Implement real session validation
    // Check JWT token or session
    // Validate against database
    // Return user data or false
    
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

// Development mode indicators
if (DEBUG_MODE) {
    header('X-Environment: development');
    header('X-Debug-Mode: enabled');
}

?> 