<?php
// Mock staff API endpoint for immediate testing
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Mock staff data in the exact format expected by the frontend
$mockStaff = [
    [
        'id' => 1,
        'name' => 'Daniel Wolthers',
        'email' => 'daniel@wolthers.com',
        'department' => 'Management',
        'role' => 'admin',
        'status' => 'active',
        'isAvailable' => true,
        'conflictCount' => 0,
        'conflictingAssignments' => [],
        'displayName' => 'Daniel Wolthers (Management)',
        'statusIndicator' => 'available'
    ],
    [
        'id' => 2,
        'name' => 'Christian Wolthers',
        'email' => 'christian@wolthers.com',
        'department' => 'Operations',
        'role' => 'admin',
        'status' => 'active',
        'isAvailable' => true,
        'conflictCount' => 0,
        'conflictingAssignments' => [],
        'displayName' => 'Christian Wolthers (Operations)',
        'statusIndicator' => 'available'
    ],
    [
        'id' => 3,
        'name' => 'Svenn Wolthers',
        'email' => 'svenn@wolthers.com',
        'department' => 'Business Development',
        'role' => 'employee',
        'status' => 'active',
        'isAvailable' => true,
        'conflictCount' => 0,
        'conflictingAssignments' => [],
        'displayName' => 'Svenn Wolthers (Business Development)',
        'statusIndicator' => 'available'
    ],
    [
        'id' => 4,
        'name' => 'Patricia Arakaki',
        'email' => 'patricia@wolthers.com',
        'department' => 'Operations',
        'role' => 'employee',
        'status' => 'active',
        'isAvailable' => false,
        'conflictCount' => 1,
        'conflictingAssignments' => ['Brazil Coffee Origins Tour (2024-02-10 to 2024-02-17) as guide'],
        'displayName' => 'Patricia Arakaki (Operations)',
        'statusIndicator' => 'busy'
    ],
    [
        'id' => 5,
        'name' => 'Anderson Nunes',
        'email' => 'anderson@wolthers.com',
        'department' => 'Logistics',
        'role' => 'employee',
        'status' => 'active',
        'isAvailable' => true,
        'conflictCount' => 0,
        'conflictingAssignments' => [],
        'displayName' => 'Anderson Nunes (Logistics)',
        'statusIndicator' => 'available'
    ],
    [
        'id' => 6,
        'name' => 'Edgar Gomes',
        'email' => 'edgar@wolthers.com',
        'department' => 'Farm Relations',
        'role' => 'employee',
        'status' => 'active',
        'isAvailable' => true,
        'conflictCount' => 0,
        'conflictingAssignments' => [],
        'displayName' => 'Edgar Gomes (Farm Relations)',
        'statusIndicator' => 'available'
    ],
    [
        'id' => 7,
        'name' => 'Kauan Marcelino',
        'email' => 'kauan@wolthers.com',
        'department' => 'Processing',
        'role' => 'employee',
        'status' => 'active',
        'isAvailable' => true,
        'conflictCount' => 0,
        'conflictingAssignments' => [],
        'displayName' => 'Kauan Marcelino (Processing)',
        'statusIndicator' => 'available'
    ],
    [
        'id' => 8,
        'name' => 'Matheus Oliveira',
        'email' => 'matheus@wolthers.com',
        'department' => 'Quality Control',
        'role' => 'employee',
        'status' => 'active',
        'isAvailable' => true,
        'conflictCount' => 0,
        'conflictingAssignments' => [],
        'displayName' => 'Matheus Oliveira (Quality Control)',
        'statusIndicator' => 'available'
    ]
];

$summary = [
    'total' => count($mockStaff),
    'available' => count(array_filter($mockStaff, fn($s) => $s['isAvailable'])),
    'busy' => count(array_filter($mockStaff, fn($s) => !$s['isAvailable']))
];

echo json_encode([
    'success' => true,
    'staff' => $mockStaff,
    'dateRange' => [
        'startDate' => $_GET['start_date'] ?? null,
        'endDate' => $_GET['end_date'] ?? null
    ],
    'summary' => $summary
], JSON_PRETTY_PRINT);
?> 