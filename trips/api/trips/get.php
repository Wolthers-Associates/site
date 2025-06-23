<?php
/**
 * Wolthers & Associates - Single Trip Details Endpoint
 * trips.wolthers.com/api/trips/get.php
 * 
 * Returns complete trip details with access control
 */

require_once '../config.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

try {
    session_start();
    $pdo = getDBConnection();
    
    // Get trip ID or slug
    $tripId = $_GET['id'] ?? null;
    $tripSlug = $_GET['slug'] ?? null;
    
    if (!$tripId && !$tripSlug) {
        sendError('Trip ID or slug is required');
    }
    
    // Get trip basic info
    if ($tripId) {
        $tripStmt = $pdo->prepare("
            SELECT t.*, u.name as created_by_name 
            FROM trips t 
            LEFT JOIN users u ON t.created_by = u.id 
            WHERE t.id = ?
        ");
        $tripStmt->execute([$tripId]);
    } else {
        $tripStmt = $pdo->prepare("
            SELECT t.*, u.name as created_by_name 
            FROM trips t 
            LEFT JOIN users u ON t.created_by = u.id 
            WHERE t.slug = ?
        ");
        $tripStmt->execute([$tripSlug]);
    }
    
    $trip = $tripStmt->fetch();
    if (!$trip) {
        sendError('Trip not found', 404);
    }
    
    // Check access permissions
    $hasAccess = false;
    $userRole = 'guest';
    
    // Employee access
    if (isset($_SESSION['user_id']) && $_SESSION['auth_type'] === 'employee') {
        $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ? AND status = 'active'");
        $stmt->execute([$_SESSION['user_id']]);
        $user = $stmt->fetch();
        if ($user) {
            $userRole = $user['role'];
            $hasAccess = true; // Employees can see all trips
        }
    }
    
    // Partner access
    if (isset($_SESSION['partner_id']) && in_array($_SESSION['auth_type'], ['partner', 'code'])) {
        $stmt = $pdo->prepare("
            SELECT trip_id FROM partner_access 
            WHERE id = ? AND is_active = 1 AND (trip_id = ? OR trip_id IS NULL)
        ");
        $stmt->execute([$_SESSION['partner_id'], $trip['id']]);
        $access = $stmt->fetch();
        if ($access) {
            $hasAccess = true;
            $userRole = 'partner';
        }
    }
    
    // Public access
    if (!$hasAccess && $trip['is_public']) {
        $hasAccess = true;
    }
    
    if (!$hasAccess) {
        sendError('Access denied', 403);
    }
    
    // Get trip itinerary
    $itineraryStmt = $pdo->prepare("
        SELECT * FROM trip_itinerary 
        WHERE trip_id = ? 
        ORDER BY day_number ASC, order_index ASC
    ");
    $itineraryStmt->execute([$trip['id']]);
    $itinerary = $itineraryStmt->fetchAll();
    
    // Get trip participants
    $participantsStmt = $pdo->prepare("
        SELECT * FROM trip_participants 
        WHERE trip_id = ? 
        ORDER BY participant_type, name
    ");
    $participantsStmt->execute([$trip['id']]);
    $participants = $participantsStmt->fetchAll();
    
    // Get trip logistics
    $logisticsStmt = $pdo->prepare("
        SELECT * FROM trip_logistics 
        WHERE trip_id = ?
    ");
    $logisticsStmt->execute([$trip['id']]);
    $logistics = $logisticsStmt->fetch();
    
    // Format trip data
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
        'current_participants' => $trip['current_participants'],
        'created_by_name' => $trip['created_by_name'],
        'map_image_url' => $trip['map_image_url'],
        'featured_image_url' => $trip['featured_image_url'],
        'is_public' => $trip['is_public'],
        'created_at' => $trip['created_at'],
        'updated_at' => $trip['updated_at']
    ];
    
    // Add sensitive info for employees/admins only
    if (in_array($userRole, ['admin', 'employee'])) {
        $formattedTrip['access_code'] = $trip['access_code'];
        $formattedTrip['notes'] = $trip['notes'];
        $formattedTrip['created_by'] = $trip['created_by'];
    }
    
    // Format itinerary by days
    $formattedItinerary = [];
    foreach ($itinerary as $item) {
        $dayNumber = $item['day_number'];
        if (!isset($formattedItinerary[$dayNumber])) {
            $formattedItinerary[$dayNumber] = [
                'day' => $dayNumber,
                'date' => $item['date'],
                'activities' => []
            ];
        }
        
        $formattedItinerary[$dayNumber]['activities'][] = [
            'id' => $item['id'],
            'start_time' => $item['start_time'],
            'end_time' => $item['end_time'],
            'title' => $item['title'],
            'description' => $item['description'],
            'location' => $item['location'],
            'activity_type' => $item['activity_type'],
            'host_name' => $item['host_name'],
            'host_contact' => $item['host_contact'],
            'transportation' => $item['transportation'],
            'notes' => $item['notes'],
            'order_index' => $item['order_index']
        ];
    }
    
    // Convert to array and sort by day
    $formattedItinerary = array_values($formattedItinerary);
    usort($formattedItinerary, function($a, $b) {
        return $a['day'] - $b['day'];
    });
    
    // Format participants by type
    $formattedParticipants = [
        'wolthers_staff' => [],
        'clients' => [],
        'partners' => [],
        'guests' => []
    ];
    
    foreach ($participants as $participant) {
        $type = $participant['participant_type'];
        if ($type === 'client') $type = 'clients';
        elseif ($type === 'partner') $type = 'partners';
        elseif ($type === 'guest') $type = 'guests';
        
        $formattedParticipant = [
            'id' => $participant['id'],
            'name' => $participant['name'],
            'company' => $participant['company'],
            'role' => $participant['role'],
            'confirmed' => $participant['confirmed']
        ];
        
        // Add sensitive info for employees only
        if (in_array($userRole, ['admin', 'employee'])) {
            $formattedParticipant['email'] = $participant['email'];
            $formattedParticipant['dietary_restrictions'] = $participant['dietary_restrictions'];
            $formattedParticipant['special_requirements'] = $participant['special_requirements'];
        }
        
        $formattedParticipants[$type][] = $formattedParticipant;
    }
    
    // Format logistics (limited for non-employees)
    $formattedLogistics = null;
    if ($logistics) {
        $formattedLogistics = [
            'vehicle_type' => $logistics['vehicle_type'],
            'driver_name' => $logistics['driver_name']
        ];
        
        // Add full logistics for employees
        if (in_array($userRole, ['admin', 'employee'])) {
            $formattedLogistics = array_merge($formattedLogistics, [
                'vehicle_details' => $logistics['vehicle_details'],
                'driver_contact' => $logistics['driver_contact'],
                'accommodation_details' => $logistics['accommodation_details'],
                'emergency_contacts' => $logistics['emergency_contacts'],
                'insurance_info' => $logistics['insurance_info'],
                'budget_estimate' => $logistics['budget_estimate'],
                'currency' => $logistics['currency']
            ]);
        }
    }
    
    sendResponse([
        'success' => true,
        'trip' => $formattedTrip,
        'itinerary' => $formattedItinerary,
        'participants' => $formattedParticipants,
        'logistics' => $formattedLogistics,
        'user_access' => [
            'role' => $userRole,
            'can_edit' => in_array($userRole, ['admin', 'employee']),
            'can_add_notes' => $hasAccess
        ]
    ]);
    
} catch (Exception $e) {
    if (DEBUG_MODE) {
        sendError('Trip details error: ' . $e->getMessage(), 500);
    } else {
        sendError('Failed to fetch trip details', 500);
    }
}
?> 