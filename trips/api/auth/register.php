<?php
/**
 * Wolthers & Associates - User Registration Endpoint
 * trips.wolthers.com/api/auth/register.php
 * 
 * Handles new user account creation
 */

require_once '../config.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST; // Fallback to form data
}

$name = trim($input['name'] ?? '');
$email = trim($input['email'] ?? '');
$password = trim($input['password'] ?? '');
$confirmPassword = trim($input['confirm_password'] ?? '');
$company = trim($input['company'] ?? '');

// Validation
if (empty($name) || empty($email) || empty($password)) {
    sendError('Name, email, and password are required');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendError('Invalid email format');
}

if (strlen($password) < 8) {
    sendError('Password must be at least 8 characters long');
}

if ($password !== $confirmPassword) {
    sendError('Passwords do not match');
}

try {
    $pdo = getDBConnection();
    
    // Check if email already exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        sendError('Email address already registered', 409);
    }
    
    // Hash password
    $passwordHash = hashPassword($password);
    
    // Create new user
    $stmt = $pdo->prepare("
        INSERT INTO users (name, email, password_hash, role, department, status, created_at) 
        VALUES (?, ?, ?, 'partner', ?, 'active', NOW())
    ");
    
    $stmt->execute([$name, $email, $passwordHash, $company]);
    $userId = $pdo->lastInsertId();
    
    // Log registration
    logActivity($userId, 'user_registration', ['email' => $email, 'company' => $company]);
    
    // Auto-login after registration
    session_start();
    $_SESSION['user_id'] = $userId;
    $_SESSION['user_email'] = $email;
    $_SESSION['user_name'] = $name;
    $_SESSION['user_role'] = 'partner';
    $_SESSION['login_time'] = time();
    $_SESSION['auth_type'] = 'regular';
    
    sendResponse([
        'success' => true,
        'message' => 'Account created successfully',
        'user' => [
            'id' => $userId,
            'name' => $name,
            'email' => $email,
            'role' => 'partner',
            'company' => $company
        ],
        'auth_type' => 'regular',
        'session_id' => session_id()
    ], 201);
    
} catch (Exception $e) {
    if (DEBUG_MODE) {
        sendError('Registration error: ' . $e->getMessage(), 500);
    } else {
        sendError('Failed to create account', 500);
    }
}
?> 