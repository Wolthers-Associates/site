<?php
/**
 * Wolthers & Associates Contact Form Handler
 * With honeypot and time-based spam protection
 */

// Set headers for JSON response
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Get JSON input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// If JSON decode failed, try form data
if (!$data) {
    $data = $_POST;
}

// ============================================
// SPAM PROTECTION
// ============================================

// 1. Honeypot check - if 'website' field is filled, it's a bot
if (!empty($data['website'])) {
    // Log spam attempt (optional)
    error_log('SPAM BLOCKED (honeypot): ' . json_encode([
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'time' => date('Y-m-d H:i:s'),
        'data' => $data
    ]));

    // Return success to fool the bot (don't let them know they were blocked)
    echo json_encode(['success' => true, 'message' => 'Thank you for your message!']);
    exit();
}

// 2. Time-based check - form submitted too fast (< 3 seconds) is likely a bot
$form_token = $data['form_token'] ?? '';
if (!empty($form_token) && is_numeric($form_token)) {
    $form_load_time = intval($form_token);
    $current_time = round(microtime(true) * 1000); // Current time in milliseconds
    $time_diff = ($current_time - $form_load_time) / 1000; // Difference in seconds

    if ($time_diff < 3) {
        // Form submitted in less than 3 seconds - likely a bot
        error_log('SPAM BLOCKED (too fast): ' . json_encode([
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'time' => date('Y-m-d H:i:s'),
            'submission_time' => $time_diff . 's',
            'data' => $data
        ]));

        // Return success to fool the bot
        echo json_encode(['success' => true, 'message' => 'Thank you for your message!']);
        exit();
    }
}

// 3. Basic content validation - check for gibberish patterns common in spam
$name = trim($data['name'] ?? '');
$subject = trim($data['subject'] ?? '');
$message = trim($data['message'] ?? '');

// Check if name/subject looks like random characters (high consonant ratio, no spaces)
function looksLikeGibberish($text) {
    if (strlen($text) < 3) return false;

    // Remove spaces and check if it's mostly consonants
    $noSpaces = str_replace(' ', '', strtolower($text));
    $vowels = preg_match_all('/[aeiou]/i', $noSpaces);
    $total = strlen($noSpaces);

    // If less than 15% vowels and longer than 8 chars, likely gibberish
    if ($total > 8 && ($vowels / $total) < 0.15) {
        return true;
    }

    // Check for random character patterns (no dictionary words)
    if ($total > 12 && strpos($noSpaces, ' ') === false && preg_match('/^[a-z]+$/i', $noSpaces)) {
        // Long string with no spaces, check for repeated patterns
        if (preg_match('/(.)\1{3,}/', $noSpaces)) {
            return true; // 4+ repeated characters
        }
    }

    return false;
}

if (looksLikeGibberish($name) || looksLikeGibberish($subject)) {
    error_log('SPAM BLOCKED (gibberish): ' . json_encode([
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'time' => date('Y-m-d H:i:s'),
        'name' => $name,
        'subject' => $subject
    ]));

    echo json_encode(['success' => true, 'message' => 'Thank you for your message!']);
    exit();
}

// ============================================
// VALIDATION
// ============================================

$email = trim($data['email'] ?? '');
$department = trim($data['department'] ?? '');

// Validate required fields
if (empty($name) || empty($email) || empty($department) || empty($subject) || empty($message)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'All fields are required']);
    exit();
}

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid email address']);
    exit();
}

// Validate department email
$valid_departments = [
    'trading@wolthers.com',
    'logistics@wolthers.com',
    'qualitycontrol@wolthers.com'
];

if (!in_array($department, $valid_departments)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid department selected']);
    exit();
}

// ============================================
// SEND EMAIL
// ============================================

// Department display names
$department_names = [
    'trading@wolthers.com' => 'Trading Department',
    'logistics@wolthers.com' => 'Logistics Department',
    'qualitycontrol@wolthers.com' => 'Quality Control Department'
];

$department_name = $department_names[$department] ?? 'General';

// Build email
$to = $department;
$email_subject = "[Website Contact] " . $subject;

$email_body = "New contact form submission from wolthers.com\n\n";
$email_body .= "CONTACT DETAILS\n";
$email_body .= "===============\n";
$email_body .= "Name: " . $name . "\n";
$email_body .= "Email: " . $email . "\n";
$email_body .= "Department: " . $department_name . "\n";
$email_body .= "Subject: " . $subject . "\n\n";
$email_body .= "MESSAGE\n";
$email_body .= "=======\n";
$email_body .= $message . "\n\n";
$email_body .= "TRACKING INFO\n";
$email_body .= "=============\n";
$email_body .= "Submitted: " . date('Y-m-d H:i:s') . " UTC\n";
$email_body .= "IP Address: " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . "\n";
$email_body .= "User Agent: " . ($_SERVER['HTTP_USER_AGENT'] ?? 'unknown') . "\n";
$email_body .= "Referrer: " . ($_SERVER['HTTP_REFERER'] ?? 'direct') . "\n\n";
$email_body .= "To reply to this inquiry, respond directly to: " . $email . "\n\n";
$email_body .= "---\n";
$email_body .= "Wolthers & Associates Website Contact Form\n";
$email_body .= "Automated message from contact@wolthers.com\n";

// Email headers
$headers = [
    'From: Wolthers Contact Form <contact@wolthers.com>',
    'Reply-To: ' . $name . ' <' . $email . '>',
    'X-Mailer: PHP/' . phpversion(),
    'Content-Type: text/plain; charset=UTF-8'
];

// Send email
$mail_sent = mail($to, $email_subject, $email_body, implode("\r\n", $headers));

if ($mail_sent) {
    echo json_encode([
        'success' => true,
        'message' => 'Thank you for your message! We will get back to you soon.'
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to send message. Please try again or contact us directly.'
    ]);
}
?>
