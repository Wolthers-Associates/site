<?php
/**
 * Debug Timezone Data Endpoint
 * trips.wolthers.com/api/debug-timezone.php
 * 
 * Test endpoint to debug timezone data being sent from frontend
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    // Get all input data
    $input = json_decode(file_get_contents('php://input'), true);
    $postData = $_POST;
    $getData = $_GET;
    
    // Get server timezone info
    $serverTime = date('Y-m-d H:i:s');
    $serverTimezone = date_default_timezone_get();
    
    // Test timezone conversion
    $testTimezone = $input['timezone'] ?? 'America/Sao_Paulo';
    
    try {
        $utcDateTime = new DateTime('now', new DateTimeZone('UTC'));
        $localDateTime = new DateTime('now', new DateTimeZone($testTimezone));
        
        $timezoneTest = [
            'utc_time' => $utcDateTime->format('Y-m-d H:i:s'),
            'local_time' => $localDateTime->format('Y-m-d H:i:s'),
            'timezone_used' => $testTimezone,
            'conversion_successful' => true
        ];
    } catch (Exception $e) {
        $timezoneTest = [
            'error' => $e->getMessage(),
            'timezone_used' => $testTimezone,
            'conversion_successful' => false
        ];
    }
    
    // Response
    echo json_encode([
        'success' => true,
        'debug_info' => [
            'method' => $_SERVER['REQUEST_METHOD'],
            'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'not set',
            'json_input' => $input,
            'post_data' => $postData,
            'get_data' => $getData,
            'server_time' => $serverTime,
            'server_timezone' => $serverTimezone,
            'timezone_test' => $timezoneTest,
            'headers' => getallheaders()
        ]
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?> 