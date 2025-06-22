<?php
/**
 * Wolthers & Associates - Session Validation Endpoint
 * trips.wolthers.com/api/auth/validate.php
 * 
 * Validates current user session and returns user info
 */

require_once '../config.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

try {
    session_start();
    
    // Check if session exists and is not expired
    if (!isset($_SESSION['login_time']) || (time() - $_SESSION['login_time']) > SESSION_TIMEOUT) {
        session_destroy();
        sendError('Session expired', 401);
    }
    
    // Employee session
    if (isset($_SESSION['user_id']) && $_SESSION['auth_type'] === 'employee') {
        $pdo = getDBConnection();
        
        // Verify user still exists and is active
        $stmt = $pdo->prepare("SELECT id, name, email, role FROM users WHERE id = ? AND status = 'active'");
        $stmt->execute([$_SESSION['user_id']]);
        $user = $stmt->fetch();
        
        if (!$user) {
            session_destroy();
            sendError('User account not found or inactive', 401);
        }
        
        sendResponse([
            'success' => true,
            'authenticated' => true,
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role']
            ],
            'auth_type' => 'employee',
            'session_remaining' => SESSION_TIMEOUT - (time() - $_SESSION['login_time'])
        ]);
    }
    
    // Partner session
    if (isset($_SESSION['partner_id']) && in_array($_SESSION['auth_type'], ['partner', 'code'])) {
        $pdo = getDBConnection();
        
        // Verify partner access still valid
        $stmt = $pdo->prepare("
            SELECT pa.*, t.title as trip_title 
            FROM partner_access pa 
            LEFT JOIN trips t ON pa.trip_id = t.id
            WHERE pa.id = ? AND pa.is_active = 1 AND (pa.expires_at IS NULL OR pa.expires_at > NOW())
        ");
        $stmt->execute([$_SESSION['partner_id']]);
        $partnerAccess = $stmt->fetch();
        
        if (!$partnerAccess) {
            session_destroy();
            sendError('Partner access expired or revoked', 401);
        }
        
        sendResponse([
            'success' => true,
            'authenticated' => true,
            'user' => [
                'name' => $_SESSION['partner_name'] ?: 'Partner User',
                'email' => $_SESSION['partner_email'],
                'company' => $_SESSION['partner_company'],
                'role' => 'partner'
            ],
            'auth_type' => $_SESSION['auth_type'],
            'trip_access' => $_SESSION['trip_id'] ? [
                'trip_id' => $_SESSION['trip_id'],
                'trip_title' => $partnerAccess['trip_title']
            ] : null,
            'session_remaining' => SESSION_TIMEOUT - (time() - $_SESSION['login_time'])
        ]);
    }
    
    // No valid session found
    sendError('Not authenticated', 401);
    
} catch (Exception $e) {
    if (DEBUG_MODE) {
        sendError('Validation error: ' . $e->getMessage(), 500);
    } else {
        sendError('Authentication validation failed', 500);
    }
}
?> 