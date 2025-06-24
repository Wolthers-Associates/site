<?php
/**
 * Wolthers & Associates - Send One-Time Code Endpoint
 * trips.wolthers.com/api/auth/send-code.php
 * 
 * Generates and sends 6-digit one-time access codes via email
 * Includes rate limiting and security measures
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
$purpose = $input['purpose'] ?? 'login'; // 'login', 'registration', 'password_reset', 'email_verification'
$user_name = trim($input['user_name'] ?? '');

// Validation
if (empty($email)) {
    sendError('Email is required');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendError('Invalid email format');
}

$valid_purposes = ['login', 'registration', 'password_reset', 'email_verification'];
if (!in_array($purpose, $valid_purposes)) {
    sendError('Invalid purpose specified');
}

try {
    $pdo = getDBConnection();
    $current_time = new DateTime();
    $ip_address = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
    
    // Rate limiting: Check recent code requests (max 3 per 15 minutes)
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as recent_requests 
        FROM one_time_codes 
        WHERE email = ? 
        AND created_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)
    ");
    $stmt->execute([$email]);
    $rate_check = $stmt->fetch();
    
    if ($rate_check['recent_requests'] >= 3) {
        sendError('Too many code requests. Please wait 15 minutes before requesting again.', 429);
    }
    
    // For registration purpose, check if user already exists
    if ($purpose === 'registration') {
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            sendError('Email address already registered', 409);
        }
    }
    
    // For other purposes, user should exist
    if (in_array($purpose, ['login', 'password_reset', 'email_verification'])) {
        $stmt = $pdo->prepare("SELECT id, name FROM users WHERE email = ? AND status = 'active'");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if (!$user) {
            if ($purpose === 'login') {
                sendError('No account found with this email address', 404);
            } else {
                sendError('Invalid email address', 404);
            }
        }
        
        $user_name = $user['name'] ?? $user_name;
    }
    
    // Deactivate any existing active codes for this email and purpose
    $stmt = $pdo->prepare("
        UPDATE one_time_codes 
        SET is_active = 0 
        WHERE email = ? AND purpose = ? AND is_active = 1
    ");
    $stmt->execute([$email, $purpose]);
    
    // Generate 6-digit code
    $code = str_pad(random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
    
    // Set expiration time (15 minutes from now)
    $expires_at = $current_time->add(new DateInterval('PT15M'))->format('Y-m-d H:i:s');
    
    // Store the code in database
    $stmt = $pdo->prepare("
        INSERT INTO one_time_codes 
        (email, code, purpose, expires_at, ip_address, user_agent) 
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$email, $code, $purpose, $expires_at, $ip_address, $user_agent]);
    
    // Prepare email content based on purpose
    $email_subject = '';
    $email_body = '';
    
    switch ($purpose) {
        case 'login':
            $email_subject = 'Your Wolthers Trips Login Code';
            $email_body = generateLoginEmail($code, $user_name);
            break;
        case 'registration':
            $email_subject = 'Welcome to Wolthers Trips - Verify Your Email';
            $email_body = generateRegistrationEmail($code, $user_name);
            break;
        case 'password_reset':
            $email_subject = 'Reset Your Wolthers Trips Password';
            $email_body = generatePasswordResetEmail($code, $user_name);
            break;
        case 'email_verification':
            $email_subject = 'Verify Your Email - Wolthers Trips';
            $email_body = generateVerificationEmail($code, $user_name);
            break;
    }
    
    // For development: Just log the email content instead of sending
    if (ENVIRONMENT === 'development') {
        error_log("EMAIL SIMULATION - To: $email, Subject: $email_subject, Code: $code");
        
        // In development, return the code for easy testing
        $response = [
            'success' => true,
            'message' => 'Verification code sent successfully',
            'expires_in_minutes' => 15,
            'development_info' => [
                'code' => $code, // Only include in development
                'email_subject' => $email_subject,
                'note' => 'Code is shown for development testing only'
            ]
        ];
    } else {
        // In production: Actually send the email
        $email_sent = sendEmail($email, $email_subject, $email_body);
        
        if (!$email_sent) {
            // Mark code as inactive if email failed
            $stmt = $pdo->prepare("UPDATE one_time_codes SET is_active = 0 WHERE email = ? AND code = ?");
            $stmt->execute([$email, $code]);
            
            sendError('Failed to send verification code. Please try again.', 500);
        }
        
        $response = [
            'success' => true,
            'message' => 'Verification code sent successfully',
            'expires_in_minutes' => 15
        ];
    }
    
    // Log the activity
    logActivity(null, 'code_sent', [
        'email' => $email,
        'purpose' => $purpose,
        'ip' => $ip_address
    ]);
    
    sendResponse($response);
    
} catch (Exception $e) {
    if (DEBUG_MODE) {
        sendError('Send code error: ' . $e->getMessage(), 500);
    } else {
        sendError('Unable to send verification code', 500);
    }
}

// Email template functions
function generateLoginEmail($code, $name) {
    return "
    <html>
    <body style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
        <h2>Your Wolthers Trips Login Code</h2>
        <p>Hello" . ($name ? " $name" : "") . ",</p>
        <p>Use this code to log in to your Wolthers Trips account:</p>
        <div style='font-size: 32px; font-weight: bold; color: #2c5530; text-align: center; padding: 20px; background: #f5f5f5; border-radius: 8px; margin: 20px 0; letter-spacing: 8px;'>
            $code
        </div>
        <p><strong>This code will expire in 15 minutes.</strong></p>
        <p>If you didn't request this code, please ignore this email.</p>
        <hr>
        <p style='color: #666; font-size: 12px;'>Wolthers & Associates<br>Coffee Origin Specialists</p>
    </body>
    </html>
    ";
}

function generateRegistrationEmail($code, $name) {
    return "
    <html>
    <body style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
        <h2>Welcome to Wolthers Trips!</h2>
        <p>Hello" . ($name ? " $name" : "") . ",</p>
        <p>Thank you for joining Wolthers Trips. Please verify your email address with this code:</p>
        <div style='font-size: 32px; font-weight: bold; color: #2c5530; text-align: center; padding: 20px; background: #f5f5f5; border-radius: 8px; margin: 20px 0; letter-spacing: 8px;'>
            $code
        </div>
        <p><strong>This code will expire in 15 minutes.</strong></p>
        <p>Once verified, you'll have access to our exclusive coffee origin trips and partner resources.</p>
        <hr>
        <p style='color: #666; font-size: 12px;'>Wolthers & Associates<br>Coffee Origin Specialists</p>
    </body>
    </html>
    ";
}

function generatePasswordResetEmail($code, $name) {
    return "
    <html>
    <body style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
        <h2>Reset Your Password</h2>
        <p>Hello" . ($name ? " $name" : "") . ",</p>
        <p>You requested to reset your Wolthers Trips password. Use this code to continue:</p>
        <div style='font-size: 32px; font-weight: bold; color: #2c5530; text-align: center; padding: 20px; background: #f5f5f5; border-radius: 8px; margin: 20px 0; letter-spacing: 8px;'>
            $code
        </div>
        <p><strong>This code will expire in 15 minutes.</strong></p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <hr>
        <p style='color: #666; font-size: 12px;'>Wolthers & Associates<br>Coffee Origin Specialists</p>
    </body>
    </html>
    ";
}

function generateVerificationEmail($code, $name) {
    return "
    <html>
    <body style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
        <h2>Verify Your Email Address</h2>
        <p>Hello" . ($name ? " $name" : "") . ",</p>
        <p>Please verify your email address with this code:</p>
        <div style='font-size: 32px; font-weight: bold; color: #2c5530; text-align: center; padding: 20px; background: #f5f5f5; border-radius: 8px; margin: 20px 0; letter-spacing: 8px;'>
            $code
        </div>
        <p><strong>This code will expire in 15 minutes.</strong></p>
        <hr>
        <p style='color: #666; font-size: 12px;'>Wolthers & Associates<br>Coffee Origin Specialists</p>
    </body>
    </html>
    ";
}

// Email sending function with proper SMTP support
function sendEmail($to, $subject, $htmlBody) {
    if (ENVIRONMENT === 'development') {
        return true; // Always succeed in development
    }
    
    try {
        // Use PHP's mail function with proper headers
        $headers = [
            'MIME-Version: 1.0',
            'Content-type: text/html; charset=UTF-8',
            'From: Wolthers Trips <' . SMTP_USER . '>',
            'Reply-To: ' . SMTP_USER,
            'X-Mailer: PHP/' . phpversion(),
            'X-Priority: 1',
            'X-MSMail-Priority: High'
        ];
        
        // Additional parameters for better delivery
        $additional_params = '-f' . SMTP_USER;
        
        $result = mail($to, $subject, $htmlBody, implode("\r\n", $headers), $additional_params);
        
        if (!$result) {
            error_log("Mail function returned false for: $to");
        }
        
        return $result;
        
    } catch (Exception $e) {
        error_log("Email sending failed: " . $e->getMessage());
        return false;
    }
}
?> 