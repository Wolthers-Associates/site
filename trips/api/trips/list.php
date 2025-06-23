<?php
/**
 * Wolthers & Associates - Trips List Endpoint
 * trips.wolthers.com/api/trips/list.php
 * 
 * Returns trips list with access control
 */

require_once '../config.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

try {
    session_start();
    $pdo = getDBConnection();
    
    // Get query parameters
    $status = $_GET['status'] ?? 'all';
    $limit = min(intval($_GET['limit'] ?? 50), 100); // Max 100 trips
    $offset = intval($_GET['offset'] ?? 0);
    
    // Build base query
    $baseQuery = "
        SELECT 
            t.*,
            u.name as created_by_name,
            COUNT(DISTINCT tp.id) as participant_count,
            tl.vehicle_type,
            tl.driver_name
        FROM trips t
        LEFT JOIN users u ON t.created_by = u.id
        LEFT JOIN trip_participants tp ON t.id = tp.trip_id AND tp.confirmed = 1
        LEFT JOIN trip_logistics tl ON t.id = tl.trip_id
    ";
    
    $whereConditions = [];
    $params = [];
    
    // Status filter
    if ($status !== 'all') {
        if ($status === 'upcoming') {
            $whereConditions[] = "t.status IN ('planned', 'active') AND t.start_date >= CURDATE()";
        } elseif ($status === 'past') {
            $whereConditions[] = "t.status = 'completed' OR t.start_date < CURDATE()";
        } else {
            $whereConditions[] = "t.status = ?";
            $params[] = $status;
        }
    }
    
    // Access control based on user type
    $userRole = 'guest';
    $tripAccess = null;
    
    // Check employee authentication
    if (isset($_SESSION['user_id']) && $_SESSION['auth_type'] === 'employee') {
        $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ? AND status = 'active'");
        $stmt->execute([$_SESSION['user_id']]);
        $user = $stmt->fetch();
        if ($user) {
            $userRole = $user['role'];
        }
    }
    
    // Check partner authentication
    if (isset($_SESSION['partner_id']) && in_array($_SESSION['auth_type'], ['partner', 'code'])) {
        $stmt = $pdo->prepare("SELECT trip_id FROM partner_access WHERE id = ? AND is_active = 1");
        $stmt->execute([$_SESSION['partner_id']]);
        $access = $stmt->fetch();
        if ($access && $access['trip_id']) {
            $tripAccess = $access['trip_id'];
            $whereConditions[] = "t.id = ?";
            $params[] = $tripAccess;
        }
    }
    
    // Apply public filter for non-authenticated users
    if ($userRole === 'guest' && !$tripAccess) {
        $whereConditions[] = "t.is_public = 1";
    }
    
    // Build final query
    $whereClause = $whereConditions ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
    $query = $baseQuery . $whereClause . " GROUP BY t.id ORDER BY t.start_date DESC LIMIT ? OFFSET ?";
    
    $params[] = $limit;
    $params[] = $offset;
    
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $trips = $stmt->fetchAll();
    
    // Format trips data
    $formattedTrips = [];
    foreach ($trips as $trip) {
        $formattedTrip = [
            'id' => $trip['id'],
            'title' => $trip['title'],
            'description' => $trip['description'],
            'slug' => $trip['slug'],
            'start_date' => $trip['start_date'],
            'end_date' => $trip['end_date'],
            'status' => $trip['status'],
            'destination_country' => $trip['destination_country'],
            'destination_region' => $trip['destination_region'],
            'trip_type' => $trip['trip_type'],
            'max_participants' => $trip['max_participants'],
            'current_participants' => $trip['participant_count'],
            'created_by_name' => $trip['created_by_name'],
            'map_image_url' => $trip['map_image_url'],
            'featured_image_url' => $trip['featured_image_url'],
            'vehicle_type' => $trip['vehicle_type'],
            'driver_name' => $trip['driver_name'],
            'created_at' => $trip['created_at'],
            'updated_at' => $trip['updated_at']
        ];
        
        // Add access code for employees/admins only
        if (in_array($userRole, ['admin', 'employee'])) {
            $formattedTrip['access_code'] = $trip['access_code'];
            $formattedTrip['notes'] = $trip['notes'];
        }
        
        $formattedTrips[] = $formattedTrip;
    }
    
    // Get total count for pagination
    $countQuery = "SELECT COUNT(*) as total FROM trips t " . $whereClause;
    $countParams = array_slice($params, 0, -2); // Remove limit and offset
    $countStmt = $pdo->prepare($countQuery);
    $countStmt->execute($countParams);
    $totalCount = $countStmt->fetch()['total'];
    
    sendResponse([
        'success' => true,
        'trips' => $formattedTrips,
        'pagination' => [
            'total' => intval($totalCount),
            'limit' => $limit,
            'offset' => $offset,
            'has_more' => ($offset + $limit) < $totalCount
        ],
        'user_access' => [
            'role' => $userRole,
            'trip_access' => $tripAccess,
            'can_create' => in_array($userRole, ['admin', 'employee'])
        ]
    ]);
    
} catch (Exception $e) {
    if (DEBUG_MODE) {
        sendError('Trips list error: ' . $e->getMessage(), 500);
    } else {
        sendError('Failed to fetch trips', 500);
    }
}
?> 