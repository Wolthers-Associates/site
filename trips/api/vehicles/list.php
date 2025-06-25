<?php
// API endpoint to list all vehicles with availability
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config.php';

try {
    $pdo = getDBConnection();
    
    // Get vehicles with availability information
    $stmt = $pdo->query("
        SELECT 
            v.id,
            v.make,
            v.model,
            v.year,
            v.license_plate,
            v.vehicle_type,
            v.capacity,
            v.status,
            v.location,
            v.notes,
            v.created_at,
            v.updated_at,
            COUNT(CASE WHEN tva.trip_id IS NOT NULL AND 
                       (tva.start_date <= CURDATE() AND tva.end_date >= CURDATE()) 
                  THEN 1 END) as current_assignments,
            GROUP_CONCAT(
                CASE WHEN tva.trip_id IS NOT NULL AND 
                          (tva.start_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) AND 
                           tva.end_date >= CURDATE())
                THEN CONCAT(t.title, ' (', tva.start_date, ' to ', tva.end_date, ')')
                END SEPARATOR '; '
            ) as upcoming_trips
        FROM vehicles v
        LEFT JOIN trip_vehicle_assignments tva ON v.id = tva.vehicle_id
        LEFT JOIN trips t ON tva.trip_id = t.id
        GROUP BY v.id
        ORDER BY v.make, v.model
    ");
    
    $vehicles = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format response
    $formattedVehicles = [];
    foreach ($vehicles as $vehicle) {
        $formattedVehicles[] = [
            'id' => (int)$vehicle['id'],
            'make' => $vehicle['make'],
            'model' => $vehicle['model'],
            'year' => $vehicle['year'] ? (int)$vehicle['year'] : null,
            'licensePlate' => $vehicle['license_plate'],
            'vehicleType' => $vehicle['vehicle_type'],
            'capacity' => (int)$vehicle['capacity'],
            'status' => $vehicle['status'],
            'location' => $vehicle['location'],
            'notes' => $vehicle['notes'],
            'displayName' => $vehicle['year'] ? 
                "{$vehicle['year']} {$vehicle['make']} {$vehicle['model']}" : 
                "{$vehicle['make']} {$vehicle['model']}",
            'currentAssignments' => (int)$vehicle['current_assignments'],
            'upcomingTrips' => $vehicle['upcoming_trips'] ? 
                explode('; ', $vehicle['upcoming_trips']) : [],
            'isAvailable' => $vehicle['status'] === 'available' && 
                           (int)$vehicle['current_assignments'] === 0,
            'createdAt' => $vehicle['created_at'],
            'updatedAt' => $vehicle['updated_at']
        ];
    }
    
    // Get summary statistics
    $totalVehicles = count($formattedVehicles);
    $availableVehicles = count(array_filter($formattedVehicles, function($v) {
        return $v['isAvailable'];
    }));
    $inMaintenanceVehicles = count(array_filter($formattedVehicles, function($v) {
        return $v['status'] === 'maintenance';
    }));
    
    echo json_encode([
        'success' => true,
        'vehicles' => $formattedVehicles,
        'summary' => [
            'total' => $totalVehicles,
            'available' => $availableVehicles,
            'assigned' => $totalVehicles - $availableVehicles - $inMaintenanceVehicles,
            'maintenance' => $inMaintenanceVehicles
        ]
    ]);

} catch (Exception $e) {
    error_log("Vehicle list error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to fetch vehicles'
    ]);
} 