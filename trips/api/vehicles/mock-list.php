<?php
// Mock vehicles API endpoint for immediate testing
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Mock vehicle data in the exact format expected by the frontend
$mockVehicles = [
    [
        'id' => 1,
        'make' => 'Toyota',
        'model' => 'Hiace',
        'year' => 2020,
        'licensePlate' => 'ABC-123',
        'vehicleType' => 'van',
        'capacity' => 12,
        'status' => 'available',
        'location' => 'Bogotá Office',
        'notes' => 'Main passenger vehicle',
        'displayName' => '2020 Toyota Hiace',
        'currentAssignments' => 0,
        'upcomingTrips' => [],
        'isAvailable' => true,
        'createdAt' => '2024-01-01 10:00:00',
        'updatedAt' => '2024-01-15 14:30:00'
    ],
    [
        'id' => 2,
        'make' => 'Chevrolet',
        'model' => 'Captiva',
        'year' => 2019,
        'licensePlate' => 'DEF-456',
        'vehicleType' => 'suv',
        'capacity' => 7,
        'status' => 'available',
        'location' => 'Medellín Office',
        'notes' => 'Good for mountain roads',
        'displayName' => '2019 Chevrolet Captiva',
        'currentAssignments' => 0,
        'upcomingTrips' => [],
        'isAvailable' => true,
        'createdAt' => '2024-01-01 10:00:00',
        'updatedAt' => '2024-01-15 14:30:00'
    ],
    [
        'id' => 3,
        'make' => 'Nissan',
        'model' => 'Urvan',
        'year' => 2021,
        'licensePlate' => 'GHI-789',
        'vehicleType' => 'van',
        'capacity' => 15,
        'status' => 'maintenance',
        'location' => 'Service Center',
        'notes' => 'Scheduled maintenance until Feb 1st',
        'displayName' => '2021 Nissan Urvan',
        'currentAssignments' => 0,
        'upcomingTrips' => [],
        'isAvailable' => false,
        'createdAt' => '2024-01-01 10:00:00',
        'updatedAt' => '2024-01-15 14:30:00'
    ],
    [
        'id' => 4,
        'make' => 'Ford',
        'model' => 'Transit',
        'year' => 2022,
        'licensePlate' => 'JKL-012',
        'vehicleType' => 'van',
        'capacity' => 14,
        'status' => 'available',
        'location' => 'Cali Office',
        'notes' => 'Newest vehicle in fleet',
        'displayName' => '2022 Ford Transit',
        'currentAssignments' => 1,
        'upcomingTrips' => ['Colombia Coffee Discovery (2024-02-15 to 2024-02-22)'],
        'isAvailable' => false,
        'createdAt' => '2024-01-01 10:00:00',
        'updatedAt' => '2024-01-15 14:30:00'
    ]
];

$summary = [
    'total' => count($mockVehicles),
    'available' => count(array_filter($mockVehicles, fn($v) => $v['isAvailable'])),
    'assigned' => count(array_filter($mockVehicles, fn($v) => !$v['isAvailable'] && $v['status'] === 'available')),
    'maintenance' => count(array_filter($mockVehicles, fn($v) => $v['status'] === 'maintenance'))
];

echo json_encode([
    'success' => true,
    'vehicles' => $mockVehicles,
    'summary' => $summary
], JSON_PRETTY_PRINT);
?> 