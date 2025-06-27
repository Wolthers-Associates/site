<?php
/**
 * Wolthers & Associates - Microsoft Authentication Configuration
 * trips.wolthers.com/api/auth/microsoft-config.php
 * 
 * Provides Azure AD configuration for frontend authentication
 */

require_once '../config.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

try {
    // Debug: Check what constants are actually defined
    $debug_info = [
        'OFFICE365_CLIENT_ID_defined' => defined('OFFICE365_CLIENT_ID'),
        'OFFICE365_CLIENT_ID_value' => defined('OFFICE365_CLIENT_ID') ? OFFICE365_CLIENT_ID : 'NOT_DEFINED',
        'OFFICE365_TENANT_ID_defined' => defined('OFFICE365_TENANT_ID'),
        'OFFICE365_TENANT_ID_value' => defined('OFFICE365_TENANT_ID') ? OFFICE365_TENANT_ID : 'NOT_DEFINED',
        'secure_config_exists' => file_exists('../secure-config.php'),
        'config_file_path' => realpath('../config.php'),
        'secure_config_path' => file_exists('../secure-config.php') ? realpath('../secure-config.php') : 'NOT_FOUND'
    ];
    
    // Get Microsoft configuration from secure config
    $host = $_SERVER['HTTP_HOST'];
    
    // trips.wolthers.com subdomain setup
    $redirectUri = 'https://' . $host . '/auth-callback.html';
    
    $config = [
        'clientId' => OFFICE365_CLIENT_ID,
        'tenantId' => OFFICE365_TENANT_ID,
        'redirectUri' => $redirectUri,
        'scopes' => ['openid', 'profile', 'email', 'User.Read']
    ];
    
    // Don't expose empty configurations
    if (empty($config['clientId']) || $config['clientId'] === 'YOUR_AZURE_CLIENT_ID_HERE') {
        $config['clientId'] = null;
    }
    
    if (empty($config['tenantId']) || $config['tenantId'] === 'YOUR_AZURE_TENANT_ID_HERE') {
        $config['tenantId'] = 'common';
    }
    
    // Log configuration request
    logActivity(null, 'microsoft_config_requested', [
        'has_client_id' => !empty($config['clientId']),
        'tenant_id' => $config['tenantId']
    ]);
    
    sendResponse([
        'success' => true,
        'config' => $config,
        'configured' => !empty($config['clientId']),
        'debug' => $debug_info // Add debug info to response
    ]);
    
} catch (Exception $e) {
    if (DEBUG_MODE) {
        sendError('Configuration error: ' . $e->getMessage(), 500);
    } else {
        sendError('Configuration unavailable', 500);
    }
}
?> 