<?php
/**
 * Wolthers & Associates Contact Form Handler
 * Office 365 Optimized Version for wolthers.com
 * 
 * Optimized for Office 365 shared mailbox environment
 */

// Set content type to JSON for API responses
header('Content-Type: application/json');

// CORS headers for production
header('Access-Control-Allow-Origin: https://wolthers.com');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Rate limiting (simple file-based)
$rate_limit_file = __DIR__ . '/rate_limit.txt';
$current_time = time();
$rate_limit_window = 300; // 5 minutes
$max_requests = 10; // Max 10 requests per 5 minutes per IP

function checkRateLimit($ip, $file, $window, $max) {
    if (!file_exists($file)) {
        file_put_contents($file, '');
    }
    
    $requests = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $current_time = time();
    $valid_requests = [];
    
    // Clean old requests and count current IP requests
    $ip_count = 0;
    foreach ($requests as $request) {
        list($timestamp, $request_ip) = explode('|', $request);
        if ($current_time - $timestamp < $window) {
            $valid_requests[] = $request;
            if ($request_ip === $ip) {
                $ip_count++;
            }
        }
    }
    
    if ($ip_count >= $max) {
        return false;
    }
    
    // Add current request
    $valid_requests[] = $current_time . '|' . $ip;
    file_put_contents($file, implode("\n", $valid_requests));
    
    return true;
}

// Check rate limit
$client_ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
if (!checkRateLimit($client_ip, $rate_limit_file, $rate_limit_window, $max_requests)) {
    http_response_code(429);
    echo json_encode(['success' => false, 'message' => 'Too many requests. Please try again later.']);
    exit();
}

// Get and decode JSON input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Debug logging for troubleshooting
$debug_log = date('Y-m-d H:i:s') . " - DEBUG: Raw input received: " . $input . "\n";
$debug_log .= date('Y-m-d H:i:s') . " - DEBUG: JSON decode result: " . var_export($data, true) . "\n";
$debug_log .= date('Y-m-d H:i:s') . " - DEBUG: JSON last error: " . json_last_error_msg() . "\n";
file_put_contents(__DIR__ . '/debug_log.txt', $debug_log, FILE_APPEND | LOCK_EX);

// Validate JSON
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode([
        'success' => false, 
        'message' => 'Invalid JSON data: ' . json_last_error_msg(),
        'debug' => 'Raw input length: ' . strlen($input)
    ]);
    exit();
}

// Validate required fields
$required_fields = ['name', 'email', 'department', 'subject', 'message'];
foreach ($required_fields as $field) {
    if (empty($data[$field]) || !is_string($data[$field])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => "Missing or invalid field: $field"]);
        exit();
    }
}

// Sanitize input data
$name = trim(strip_tags($data['name']));
$email = trim(strtolower($data['email']));
$department = trim($data['department']);
$subject = trim(strip_tags($data['subject']));
$message = trim(strip_tags($data['message']));

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid email address']);
    exit();
}

// Validate field lengths
if (strlen($name) > 100 || strlen($subject) > 200 || strlen($message) > 2000) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Field length exceeds maximum allowed']);
    exit();
}

// Email routing configuration for Office 365
$email_routing = [
    'trading@wolthers.com' => [
        'to' => 'trading@wolthers.com',
        'name' => 'Trading Department',
        'from' => 'contact@wolthers.com' // Use existing distribution list
    ],
    'logistics@wolthers.com' => [
        'to' => 'wolthers@wolthers.com', // Your shared mailbox
        'name' => 'Logistics Department',
        'from' => 'contact@wolthers.com'
    ],
    'qualitycontrol@wolthers.com' => [
        'to' => 'qualitycontrol@wolthers.com',
        'name' => 'Quality Control Department',
        'from' => 'contact@wolthers.com'
    ]
];

// Validate department and get routing info
if (!isset($email_routing[$department])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid department selected']);
    exit();
}

$routing = $email_routing[$department];
$to_email = $routing['to'];
$department_name = $routing['name'];
$from_email = $routing['from'];

// Spam detection (basic keywords)
$spam_keywords = ['viagra', 'casino', 'loan', 'bitcoin', 'cryptocurrency', 'investment opportunity'];
$content_to_check = strtolower($subject . ' ' . $message . ' ' . $name);

foreach ($spam_keywords as $keyword) {
    if (strpos($content_to_check, $keyword) !== false) {
        // Log potential spam but don't notify user
        error_log("Potential spam detected from $email: $keyword");
        // Still send success response to avoid giving feedback to spammers
        echo json_encode(['success' => true, 'message' => 'Thank you! Your message has been sent successfully.']);
        exit();
    }
}

// Prepare email content with Office 365 optimized format
$email_subject = "[Website Contact] $subject";

$email_body = "New contact form submission from wolthers.com

CONTACT DETAILS
===============
Name: $name
Email: $email
Department: $department_name
Subject: $subject

MESSAGE
=======
$message

TRACKING INFO
=============
Submitted: " . date('Y-m-d H:i:s T') . "
IP Address: $client_ip
User Agent: " . ($_SERVER['HTTP_USER_AGENT'] ?? 'Unknown') . "
Referrer: " . ($_SERVER['HTTP_REFERER'] ?? 'Direct') . "

To reply to this inquiry, respond directly to: $email

---
Wolthers & Associates Website Contact Form
Automated message from contact@wolthers.com

";

// Office 365 optimized headers
$headers = [
    'From: Wolthers Contact Form <contact@wolthers.com>',
    'Reply-To: ' . $name . ' <' . $email . '>',
    'X-Mailer: Wolthers Contact Form v2.0',
    'X-Priority: 3 (Normal)',
    'Content-Type: text/plain; charset=UTF-8',
    'X-Original-Sender: ' . $email,
    'X-Sender-IP: ' . $client_ip,
    'X-Auto-Response-Suppress: All', // Prevents auto-replies in Office 365
    'X-MS-Exchange-Organization-SCL: -1', // Office 365 spam confidence level
    'Return-Path: contact@wolthers.com'
];

// Log the email attempt
$log_entry = date('Y-m-d H:i:s') . " - Contact form submission: $name ($email) to $department_name ($to_email)\n";
file_put_contents(__DIR__ . '/contact_log.txt', $log_entry, FILE_APPEND | LOCK_EX);

// Send email
try {
    $mail_sent = mail($to_email, $email_subject, $email_body, implode("\r\n", $headers));
    
    if ($mail_sent) {
        // Success response
        echo json_encode([
            'success' => true, 
            'message' => 'Thank you! Your message has been sent to our ' . $department_name . '. We will respond within 24-48 hours.'
        ]);
        
        // Log success
        $success_log = date('Y-m-d H:i:s') . " - SUCCESS: Email sent to $to_email from $email\n";
        file_put_contents(__DIR__ . '/contact_log.txt', $success_log, FILE_APPEND | LOCK_EX);
        
    } else {
        throw new Exception('Mail function returned false');
    }
    
} catch (Exception $e) {
    // Log error
    $error_log = date('Y-m-d H:i:s') . " - ERROR: Failed to send email to $to_email from $email - " . $e->getMessage() . "\n";
    file_put_contents(__DIR__ . '/contact_log.txt', $error_log, FILE_APPEND | LOCK_EX);
    
    // Error response
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'We apologize, but there was an issue sending your message. Please contact us directly at ' . $to_email
    ]);
}

// Auto-response email to user (Office 365 optimized)
$auto_response_subject = "Message received - Wolthers & Associates";
$auto_response_body = "Dear $name,

Thank you for contacting Wolthers & Associates. We have received your inquiry regarding \"$subject\" and it has been forwarded to our $department_name.

WHAT HAPPENS NEXT:
• Your message will be reviewed by our team
• You can expect a response within 24-48 hours during business days
• For urgent matters, please contact us directly

DIRECT CONTACT INFORMATION:
Trading Inquiries: trading@wolthers.com
Logistics Support: wolthers@wolthers.com  
Quality Control: qualitycontrol@wolthers.com

We appreciate your interest in Wolthers & Associates and look forward to assisting you.

Best regards,
The Wolthers & Associates Team

Building coffee relationships since 1949
www.wolthers.com

---
This is an automated confirmation from contact@wolthers.com
Your original message will be handled by our team at $to_email
";

$auto_headers = [
    'From: Wolthers & Associates <contact@wolthers.com>',
    'X-Mailer: Wolthers Auto-Response System',
    'Content-Type: text/plain; charset=UTF-8',
    'X-Auto-Response-Suppress: All',
    'Return-Path: contact@wolthers.com'
];

// Send auto-response (don't let this failure affect main response)
@mail($email, $auto_response_subject, $auto_response_body, implode("\r\n", $auto_headers));

?> 