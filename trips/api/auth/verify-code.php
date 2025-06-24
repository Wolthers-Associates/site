<?php
/**
 * Wolthers & Associates - Verify One-Time Code Endpoint
 * trips.wolthers.com/api/auth/verify-code.php
 * 
 * Validates 6-digit one-time access codes and handles authentication
 * Includes attempt limiting and security measures
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

$email = trim($input['email'] ?? '');
$code = trim($input['code'] ?? '');
$purpose = $input['purpose'] ?? 'login';

// Validation
if (empty($email)) {
    sendError('Email is required');
}

if (empty($code)) {
    sendError('Verification code is required');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendError('Invalid email format');
}

if (!preg_match('/^\d{6}$/', $code)) {
    sendError('Invalid code format. Code must be 6 digits.');
}

try {
    $pdo = getDBConnection();
    $ip_address = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    
    // Find the most recent active code for this email and purpose
    $stmt = $pdo->prepare("
        SELECT id, code, attempts, max_attempts, expires_at, used_at
        FROM one_time_codes 
        WHERE email = ? 
        AND purpose = ? 
        AND is_active = 1 
        ORDER BY created_at DESC 
        LIMIT 1
    ");
    $stmt->execute([$email, $purpose]);
    $code_record = $stmt->fetch();
    
    if (!$code_record) {
        logActivity(null, 'code_verify_failed', [
            'email' => $email,
            'reason' => 'no_active_code',
            'purpose' => $purpose,
            'ip' => $ip_address
        ]);
        sendError('No valid verification code found. Please request a new code.', 404);
    }
    
    // Check if code has expired
    if (new DateTime() > new DateTime($code_record['expires_at'])) {
        // Mark expired code as inactive
        $stmt = $pdo->prepare("UPDATE one_time_codes SET is_active = 0 WHERE id = ?");
        $stmt->execute([$code_record['id']]);
        
        logActivity(null, 'code_verify_failed', [
            'email' => $email,
            'reason' => 'expired',
            'purpose' => $purpose,
            'ip' => $ip_address
        ]);
        sendError('Verification code has expired. Please request a new code.', 410);
    }
    
    // Check if code has already been used
    if ($code_record['used_at']) {
        logActivity(null, 'code_verify_failed', [
            'email' => $email,
            'reason' => 'already_used',
            'purpose' => $purpose,
            'ip' => $ip_address
        ]);
        sendError('Verification code has already been used. Please request a new code.', 410);
    }
    
    // Check if maximum attempts reached
    if ($code_record['attempts'] >= $code_record['max_attempts']) {
        // Mark code as inactive
        $stmt = $pdo->prepare("UPDATE one_time_codes SET is_active = 0 WHERE id = ?");
        $stmt->execute([$code_record['id']]);
        
        logActivity(null, 'code_verify_failed', [
            'email' => $email,
            'reason' => 'max_attempts_reached',
            'purpose' => $purpose,
            'ip' => $ip_address
        ]);
        sendError('Maximum verification attempts reached. Please request a new code.', 429);
    }
    
    // Increment attempt counter
    $stmt = $pdo->prepare("UPDATE one_time_codes SET attempts = attempts + 1 WHERE id = ?");
    $stmt->execute([$code_record['id']]);
    
    // Verify the actual code
    if ($code !== $code_record['code']) {
        $remaining_attempts = $code_record['max_attempts'] - ($code_record['attempts'] + 1);
        
        logActivity(null, 'code_verify_failed', [
            'email' => $email,
            'reason' => 'incorrect_code',
            'purpose' => $purpose,
            'remaining_attempts' => $remaining_attempts,
            'ip' => $ip_address
        ]);
        
        sendError("Incorrect verification code. $remaining_attempts attempts remaining.", 401);
    }
    
    // Code is valid! Mark as used
    $stmt = $pdo->prepare("
        UPDATE one_time_codes 
        SET used_at = NOW(), is_active = 0 
        WHERE id = ?
    ");
    $stmt->execute([$code_record['id']]);
    
    // Handle different purposes
    $response = ['success' => true];
    
    switch ($purpose) {
        case 'login':
            // Log user in
            $stmt = $pdo->prepare("SELECT id, name, email, role FROM users WHERE email = ? AND status = 'active'");
            $stmt->execute([$email]);
            $user = $stmt->fetch();
            
            if (!$user) {
                sendError('User account not found or inactive', 404);
            }
            
            // Create session
            session_start();
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_email'] = $user['email'];
            $_SESSION['user_name'] = $user['name'];
            $_SESSION['user_role'] = $user['role'];
            $_SESSION['login_time'] = time();
            $_SESSION['auth_type'] = 'code_verification';
            
            $response['message'] = 'Login successful';
            $response['user'] = [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role']
            ];
            $response['auth_type'] = 'code_verification';
            $response['session_id'] = session_id();
            
            logActivity($user['id'], 'code_login_success', [
                'email' => $email,
                'ip' => $ip_address
            ]);
            break;
            
        case 'registration':
            // Code verified for registration - return success to proceed with account creation
            $response['message'] = 'Email verified successfully';
            $response['email_verified'] = true;
            $response['can_proceed_with_registration'] = true;
            
            logActivity(null, 'code_verification_success', [
                'email' => $email,
                'purpose' => 'registration',
                'ip' => $ip_address
            ]);
            break;
            
        case 'password_reset':
            // Code verified for password reset
            $response['message'] = 'Verification successful';
            $response['can_reset_password'] = true;
            $response['reset_token'] = generatePasswordResetToken($email);
            
            logActivity(null, 'code_verification_success', [
                'email' => $email,
                'purpose' => 'password_reset',
                'ip' => $ip_address
            ]);
            break;
            
        case 'email_verification':
            // Verify user's email address
            $stmt = $pdo->prepare("
                UPDATE users 
                SET email_verified = 1, email_verified_at = NOW() 
                WHERE email = ?
            ");
            $stmt->execute([$email]);
            
            $response['message'] = 'Email address verified successfully';
            $response['email_verified'] = true;
            
            logActivity(null, 'email_verification_success', [
                'email' => $email,
                'ip' => $ip_address
            ]);
            break;
    }
    
    sendResponse($response);
    
} catch (Exception $e) {
    if (DEBUG_MODE) {
        sendError('Code verification error: ' . $e->getMessage(), 500);
    } else {
        sendError('Unable to verify code', 500);
    }
}

// Generate secure password reset token
function generatePasswordResetToken($email) {
    $timestamp = time();
    $random = bin2hex(random_bytes(16));
    $token = hash('sha256', $email . $timestamp . $random);
    
    // Store token in session for verification
    session_start();
    $_SESSION['password_reset_token'] = $token;
    $_SESSION['password_reset_email'] = $email;
    $_SESSION['password_reset_expires'] = $timestamp + 1800; // 30 minutes
    
    return $token;
}
?> 