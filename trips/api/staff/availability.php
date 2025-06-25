<?php
// API endpoint to check staff availability
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config.php';

try {
    $startDate = $_GET['start_date'] ?? null;
    $endDate = $_GET['end_date'] ?? null;
    $excludeTripId = $_GET['exclude_trip_id'] ?? null;
    
    // Base query to get all Wolthers staff
    $query = "
        SELECT 
            u.id,
            u.name,
            u.email,
            u.department,
            u.role,
            u.status,
            GROUP_CONCAT(
                CASE WHEN tsa.trip_id IS NOT NULL " .
                ($excludeTripId ? "AND tsa.trip_id != :exclude_trip_id " : "") . "
                AND (
                    (tsa.start_date <= :end_date AND tsa.end_date >= :start_date) OR
                    (tsa.start_date IS NULL AND tsa.end_date IS NULL)
                )
                THEN CONCAT(t.title, ' (', COALESCE(tsa.start_date, t.start_date), ' to ', COALESCE(tsa.end_date, t.end_date), ') as ', tsa.role)
                END SEPARATOR '; '
            ) as conflicting_assignments,
            COUNT(CASE WHEN tsa.trip_id IS NOT NULL " .
                ($excludeTripId ? "AND tsa.trip_id != :exclude_trip_id " : "") . "
                AND (
                    (tsa.start_date <= :end_date AND tsa.end_date >= :start_date) OR
                    (tsa.start_date IS NULL AND tsa.end_date IS NULL)
                )
                THEN 1 END) as conflict_count
        FROM users u
        LEFT JOIN trip_staff_assignments tsa ON u.id = tsa.user_id
        LEFT JOIN trips t ON tsa.trip_id = t.id AND t.status != 'cancelled'
        WHERE u.email LIKE '%@wolthers.com' 
        AND u.role IN ('admin', 'employee')
        AND u.status = 'active'
        GROUP BY u.id
        ORDER BY u.name
    ";
    
    $stmt = $pdo->prepare($query);
    $params = [];
    
    if ($startDate && $endDate) {
        $params['start_date'] = $startDate;
        $params['end_date'] = $endDate;
        
        if ($excludeTripId) {
            $params['exclude_trip_id'] = $excludeTripId;
        }
    } else {
        // If no dates provided, use far future dates to show all assignments
        $params['start_date'] = '9999-12-31';
        $params['end_date'] = '9999-12-31';
    }
    
    $stmt->execute($params);
    $staff = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format response
    $formattedStaff = [];
    foreach ($staff as $member) {
        $isAvailable = $startDate && $endDate ? (int)$member['conflict_count'] === 0 : true;
        
        $formattedStaff[] = [
            'id' => (int)$member['id'],
            'name' => $member['name'],
            'email' => $member['email'],
            'department' => $member['department'],
            'role' => $member['role'],
            'status' => $member['status'],
            'isAvailable' => $isAvailable,
            'conflictCount' => (int)$member['conflict_count'],
            'conflictingAssignments' => $member['conflicting_assignments'] ? 
                explode('; ', $member['conflicting_assignments']) : [],
            'displayName' => $member['name'] . ' (' . ucfirst($member['department'] ?? 'Staff') . ')',
            'statusIndicator' => $isAvailable ? 'available' : 'busy'
        ];
    }
    
    // Get summary
    $totalStaff = count($formattedStaff);
    $availableStaff = count(array_filter($formattedStaff, function($s) {
        return $s['isAvailable'];
    }));
    
    echo json_encode([
        'success' => true,
        'staff' => $formattedStaff,
        'dateRange' => [
            'startDate' => $startDate,
            'endDate' => $endDate
        ],
        'summary' => [
            'total' => $totalStaff,
            'available' => $availableStaff,
            'busy' => $totalStaff - $availableStaff
        ]
    ]);

} catch (Exception $e) {
    error_log("Staff availability error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to check staff availability'
    ]);
} 