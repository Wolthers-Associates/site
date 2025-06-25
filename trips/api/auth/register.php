<?php
/**
 * Wolthers & Associates - Enhanced User Registration Endpoint
 * trips.wolthers.com/api/auth/register.php
 * 
 * Handles new user account creation with email verification
 * Supports both direct registration and code-verified registration
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
$phone = trim($input['phone'] ?? '');
$verification_code = trim($input['verification_code'] ?? '');
$skip_email_verification = $input['skip_email_verification'] ?? false;

// Enhanced Validation
if (empty($name) || empty($email)) {
    sendError('Name and email are required');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendError('Invalid email format');
}

// Password validation (more strict)
if (!empty($password)) {
if (strlen($password) < 8) {
    sendError('Password must be at least 8 characters long');
}
    
    if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/', $password)) {
        sendError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
    }

if ($password !== $confirmPassword) {
    sendError('Passwords do not match');
    }
}

// Name validation
if (strlen($name) < 2) {
    sendError('Name must be at least 2 characters long');
}

if (!preg_match('/^[a-zA-ZÀ-ÿ\s\'-]+$/', $name)) {
    sendError('Name contains invalid characters');
}

try {
    $pdo = getDBConnection();
    $ip_address = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    
    // Check if email already exists
    $stmt = $pdo->prepare("SELECT id, status FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $existing_user = $stmt->fetch();
    
    if ($existing_user) {
        if ($existing_user['status'] === 'active') {
        sendError('Email address already registered', 409);
        } else {
            sendError('Email address is associated with an inactive account. Please contact support.', 409);
        }
    }
    
    // If verification code provided, validate it
    if (!empty($verification_code)) {
        $stmt = $pdo->prepare("
            SELECT id, used_at, expires_at 
            FROM one_time_codes 
            WHERE email = ? 
            AND code = ? 
            AND purpose = 'registration' 
            AND is_active = 1
            ORDER BY created_at DESC 
            LIMIT 1
        ");
        $stmt->execute([$email, $verification_code]);
        $code_record = $stmt->fetch();
        
        if (!$code_record) {
            sendError('Invalid verification code', 400);
        }
        
        if ($code_record['used_at']) {
            sendError('Verification code has already been used', 400);
        }
        
        if (new DateTime() > new DateTime($code_record['expires_at'])) {
            sendError('Verification code has expired', 400);
        }
        
        // Mark code as used
        $stmt = $pdo->prepare("UPDATE one_time_codes SET used_at = NOW(), is_active = 0 WHERE id = ?");
        $stmt->execute([$code_record['id']]);
        
        $email_verified = true;
    } else {
        $email_verified = $skip_email_verification || ENVIRONMENT === 'development';
    }
    
    // Determine initial account status
    $initial_status = $email_verified ? 'active' : 'pending_verification';
    
    // Hash password if provided
    $passwordHash = !empty($password) ? hashPassword($password) : null;
    
    // Determine user role based on email domain and registration context
    $user_role = 'partner'; // Default for external users
    if (strpos($email, '@wolthers.com') !== false) {
        $user_role = 'employee';
    }
    
    // Create new user
    $stmt = $pdo->prepare("
        INSERT INTO users (
            name, email, password_hash, role, department, phone,
            email_verified, email_verified_at, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    
    $email_verified_at = $email_verified ? date('Y-m-d H:i:s') : null;
    
    $stmt->execute([
        $name, 
        $email, 
        $passwordHash, 
        $user_role, 
        $company, 
        $phone,
        $email_verified ? 1 : 0,
        $email_verified_at,
        $initial_status
    ]);
    
    $userId = $pdo->lastInsertId();
    
    // Log registration
    logActivity($userId, 'user_registration', [
        'email' => $email, 
        'company' => $company,
        'role' => $user_role,
        'email_verified' => $email_verified,
        'ip' => $ip_address
    ]);
    
    $response = [
        'success' => true,
        'user' => [
            'id' => $userId,
            'name' => $name,
            'email' => $email,
            'role' => $user_role,
            'company' => $company,
            'phone' => $phone,
            'email_verified' => $email_verified,
            'status' => $initial_status
        ]
    ];
    
    if ($email_verified) {
        // Auto-login after successful registration with verified email
        session_start();
        $_SESSION['user_id'] = $userId;
        $_SESSION['user_email'] = $email;
        $_SESSION['user_name'] = $name;
        $_SESSION['user_role'] = $user_role;
        $_SESSION['login_time'] = time();
        $_SESSION['auth_type'] = 'registration';
        
        $response['message'] = 'Account created and verified successfully';
        $response['auth_type'] = 'registration';
        $response['session_id'] = session_id();
        $response['logged_in'] = true;
        
    } else {
        // Email verification required
        $response['message'] = 'Account created successfully. Please check your email to verify your account.';
        $response['logged_in'] = false;
        $response['email_verification_required'] = true;
        $response['next_step'] = 'Please check your email for a verification code';
        
        // Send verification email automatically
        try {
            // Call send-code endpoint internally
            $verification_response = sendVerificationEmail($email, $name);
            if ($verification_response) {
                $response['verification_email_sent'] = true;
            }
        } catch (Exception $e) {
            // Don't fail registration if email sending fails
            $response['verification_email_sent'] = false;
            $response['note'] = 'Account created but verification email could not be sent. You can request a new verification code.';
        }
    }
    
    sendResponse($response, 201);
    
} catch (Exception $e) {
    if (DEBUG_MODE) {
        sendError('Registration error: ' . $e->getMessage(), 500);
    } else {
        sendError('Failed to create account', 500);
    }
}

// Helper function to send verification email
function sendVerificationEmail($email, $name) {
    // Simulate calling the send-code endpoint
    $code = str_pad(random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
    
    // In a real implementation, this would call the send-code API
    // For now, just log it
    if (ENVIRONMENT === 'development') {
        error_log("VERIFICATION EMAIL - To: $email, Name: $name, Code: $code");
        return true;
    }
    
    return true; // Placeholder for actual email sending
}
?> 