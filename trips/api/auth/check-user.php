<?php
/**
 * Wolthers & Associates - User Check Endpoint
 * trips.wolthers.com/api/auth/check-user.php
 * 
 * Validates if a user exists in the system and returns their basic information
 * Used for authentication flows and registration validation
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
$check_type = $input['check_type'] ?? 'existence'; // 'existence', 'registration', 'login_prep'

// Validation
if (empty($email)) {
    sendError('Email is required');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendError('Invalid email format');
}

try {
    $pdo = getDBConnection();
    
    // Basic user check query
    $stmt = $pdo->prepare("
        SELECT 
            id, 
            name, 
            email, 
            role, 
            department,
            status,
            office365_id,
            created_at,
            CASE WHEN password_hash IS NOT NULL THEN 1 ELSE 0 END as has_password
        FROM users 
        WHERE email = ?
    ");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if ($user) {
        // User exists - return appropriate data based on check type
        $response = [
            'exists' => true,
            'user' => [
                'id' => (int)$user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role'],
                'department' => $user['department'],
                'status' => $user['status']
            ],
            'account_status' => $user['status'],
            'registration_date' => $user['created_at']
        ];
        
        // Add authentication method information
        $auth_methods = [];
        if ($user['has_password']) {
            $auth_methods[] = 'password';
        }
        if ($user['office365_id']) {
            $auth_methods[] = 'office365';
        }
        $response['auth_methods'] = $auth_methods;
        
        // Check if user is active
        if ($user['status'] !== 'active') {
            $response['login_allowed'] = false;
            $response['status_message'] = 'Account is ' . $user['status'];
        } else {
            $response['login_allowed'] = true;
        }
        
        // Additional data based on check type
        if ($check_type === 'registration') {
            $response['can_register'] = false;
            $response['message'] = 'Email already registered';
        } elseif ($check_type === 'login_prep') {
            // Check recent login attempts for security
            $stmt = $pdo->prepare("
                SELECT COUNT(*) as attempt_count 
                FROM audit_logs 
                WHERE action = 'login_failed' 
                AND JSON_EXTRACT(new_values, '$.email') = ? 
                AND created_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)
            ");
            $stmt->execute([$email]);
            $attempts = $stmt->fetch();
            
            $response['recent_failed_attempts'] = (int)($attempts['attempt_count'] ?? 0);
            $response['account_locked'] = $response['recent_failed_attempts'] >= 5;
            
            if ($response['account_locked']) {
                $response['login_allowed'] = false;
                $response['status_message'] = 'Account temporarily locked due to failed login attempts';
            }
        }
        
        // Log the check activity
        logActivity($user['id'], 'user_check', [
            'email' => $email,
            'check_type' => $check_type,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
        ]);
        
        sendResponse($response);
        
    } else {
        // User doesn't exist
        $response = [
            'exists' => false,
            'user' => null,
            'login_allowed' => false
        ];
        
        if ($check_type === 'registration') {
            $response['can_register'] = true;
            $response['message'] = 'Email available for registration';
        } elseif ($check_type === 'login_prep') {
            $response['message'] = 'No account found with this email';
            $response['suggestions'] = [
                'Register a new account',
                'Check if you used a different email',
                'Contact support if you believe this is an error'
            ];
        }
        
        // Log the check attempt (no user ID since user doesn't exist)
        logActivity(null, 'user_check_not_found', [
            'email' => $email,
            'check_type' => $check_type,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
        ]);
        
        sendResponse($response);
    }
    
} catch (Exception $e) {
    if (DEBUG_MODE) {
        sendError('User check error: ' . $e->getMessage(), 500);
    } else {
        sendError('Unable to check user information', 500);
    }
}
?> 