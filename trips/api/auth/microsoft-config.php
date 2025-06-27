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
    // Get Microsoft configuration from secure config
    $host = $_SERVER['HTTP_HOST'];
    
    // Handle subdomain vs subdirectory setup
    if (strpos($host, 'trips.') === 0) {
        // trips.wolthers.com subdomain
        $redirectUri = 'https://' . $host . '/auth-callback.html';
    } else {
        // wolthers.com/trips subdirectory  
        $redirectUri = 'https://' . $host . '/trips/auth-callback.html';
    }
    
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
        'configured' => !empty($config['clientId'])
    ]);
    
} catch (Exception $e) {
    if (DEBUG_MODE) {
        sendError('Configuration error: ' . $e->getMessage(), 500);
    } else {
        sendError('Configuration unavailable', 500);
    }
}
?> 