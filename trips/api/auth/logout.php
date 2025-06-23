<?php
/**
 * Wolthers & Associates - Logout Endpoint
 * trips.wolthers.com/api/auth/logout.php
 * 
 * Destroys user session and logs logout activity
 */

require_once '../config.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

try {
    session_start();
    
    // Log the logout activity before destroying session
    if (isset($_SESSION['user_id'])) {
        logActivity($_SESSION['user_id'], 'employee_logout', ['email' => $_SESSION['user_email']]);
    } elseif (isset($_SESSION['partner_id'])) {
        logActivity(null, 'partner_logout', ['email' => $_SESSION['partner_email'], 'auth_type' => $_SESSION['auth_type']]);
    }
    
    // Destroy the session
    session_unset();
    session_destroy();
    
    // Clear session cookie
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    
    sendResponse([
        'success' => true,
        'message' => 'Logged out successfully'
    ]);
    
} catch (Exception $e) {
    if (DEBUG_MODE) {
        sendError('Logout error: ' . $e->getMessage(), 500);
    } else {
        sendError('Logout failed', 500);
    }
}
?> 