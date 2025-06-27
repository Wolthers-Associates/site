<?php
/**
 * Wolthers & Associates - Debug Codes Endpoint (DEVELOPMENT ONLY)
 * trips.wolthers.com/api/auth/debug-codes.php
 * 
 * Shows recent verification codes for testing purposes
 * ⚠️ ONLY WORKS IN DEVELOPMENT MODE ⚠️
 */

require_once '../config.php';

// SECURITY: Only allow in development mode
if (ENVIRONMENT !== 'development') {
    sendError('This endpoint is only available in development mode', 403);
}

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

$email = $_GET['email'] ?? '';

try {
    $pdo = getDBConnection();
    
    if ($email) {
        // Show codes for specific email
        $stmt = $pdo->prepare("
            SELECT email, code, purpose, attempts, max_attempts, 
                   expires_at, used_at, is_active, created_at,
                   CASE WHEN expires_at > NOW() THEN 'valid' ELSE 'expired' END as status
            FROM one_time_codes 
            WHERE email = ? 
            ORDER BY created_at DESC 
            LIMIT 10
        ");
        $stmt->execute([$email]);
    } else {
        // Show recent codes for all emails
        $stmt = $pdo->prepare("
            SELECT email, code, purpose, attempts, max_attempts, 
                   expires_at, used_at, is_active, created_at,
                   CASE WHEN expires_at > NOW() THEN 'valid' ELSE 'expired' END as status
            FROM one_time_codes 
            ORDER BY created_at DESC 
            LIMIT 20
        ");
        $stmt->execute();
    }
    
    $codes = $stmt->fetchAll();
    
    $response = [
        'success' => true,
        'development_mode' => true,
        'warning' => 'This endpoint only works in development mode and shows sensitive data',
        'filter' => $email ? "Showing codes for: $email" : 'Showing recent codes for all users',
        'codes' => $codes,
        'current_time' => date('Y-m-d H:i:s'),
        'usage' => [
                    'view_all' => '/api/auth/debug-codes.php',
        'view_specific' => '/api/auth/debug-codes.php?email=user@example.com'
        ]
    ];
    
    sendResponse($response);
    
} catch (Exception $e) {
    if (DEBUG_MODE) {
        sendError('Debug codes error: ' . $e->getMessage(), 500);
    } else {
        sendError('Unable to retrieve debug information', 500);
    }
}
?> 