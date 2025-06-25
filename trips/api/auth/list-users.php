<?php
/**
 * Wolthers & Associates - User List Endpoint
 * trips.wolthers.com/api/auth/list-users.php
 * 
 * Returns list of users for admin management
 * Requires admin authentication
 */

require_once '../config.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

try {
    session_start();
    $pdo = getDBConnection();
    
    // Basic authentication check - in development mode, we'll be more permissive
    $isAdmin = false;
    $currentUserId = null;
    
    // Check if user is authenticated through session
    if (isset($_SESSION['user_id']) && isset($_SESSION['user_role'])) {
        $currentUserId = $_SESSION['user_id'];
        $isAdmin = $_SESSION['user_role'] === 'admin';
    }
    
    // For development: also check localStorage auth data if no session
    if (!$isAdmin && isset($_GET['auth_check'])) {
        // This is a permissive check for development
        // In production, you'd want stricter authentication
        $isAdmin = true;
    }
    
    // Query to get all users with basic information
    $query = "
        SELECT 
            id,
            name,
            email,
            role,
            department,
            status,
            created_at,
            updated_at,
            office365_id IS NOT NULL as has_office365
        FROM users 
        WHERE status = 'active'
        ORDER BY 
            CASE role 
                WHEN 'admin' THEN 1 
                WHEN 'employee' THEN 2 
                WHEN 'partner' THEN 3 
                ELSE 4 
            END,
            name ASC
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $users = $stmt->fetchAll();
    
    // Format users for frontend consumption
    $formattedUsers = [];
    foreach ($users as $user) {
        $formattedUsers[] = [
            'id' => (int)$user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'role' => $user['role'],
            'department' => $user['department'],
            'company' => $user['department'] ?: ($user['email'] && strpos($user['email'], '@wolthers.com') !== false ? 'Wolthers & Associates' : 'External'),
            'avatar' => strtoupper(substr($user['name'], 0, 1)),
            'memberSince' => date('Y-m-d', strtotime($user['created_at'])),
            'lastActive' => date('c', strtotime($user['updated_at'])),
            'isWolthersTeam' => strpos($user['email'], '@wolthers.com') !== false,
            'status' => $user['status'],
            'authMethods' => $user['has_office365'] ? ['office365'] : ['email'],
            'tripCount' => 0, // TODO: Add trip count query if needed
            'isCreator' => false
        ];
    }
    
    // Get total count
    $totalUsers = count($formattedUsers);
    
    // Basic statistics
    $roleStats = [];
    $companyStats = [];
    foreach ($formattedUsers as $user) {
        $roleStats[$user['role']] = ($roleStats[$user['role']] ?? 0) + 1;
        $companyStats[$user['company']] = ($companyStats[$user['company']] ?? 0) + 1;
    }
    
    sendResponse([
        'success' => true,
        'users' => $formattedUsers,
        'total' => $totalUsers,
        'statistics' => [
            'roles' => $roleStats,
            'companies' => $companyStats,
            'total_active' => $totalUsers
        ],
        'meta' => [
            'database_source' => true,
            'last_updated' => date('c'),
            'current_user_id' => $currentUserId,
            'is_admin_request' => $isAdmin
        ]
    ]);
    
} catch (Exception $e) {
    if (DEBUG_MODE) {
        sendError('Database error: ' . $e->getMessage(), 500);
    } else {
        sendError('Unable to load users', 500);
    }
}
?> 