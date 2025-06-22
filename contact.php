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