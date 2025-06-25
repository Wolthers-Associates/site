<?php
/**
 * Vehicle Management API
 * Handles CRUD operations for vehicles with enhanced fields
 * 
 * Methods:
 * GET - List all vehicles with filters
 * POST - Create new vehicle
 * PUT - Update existing vehicle
 * DELETE - Delete vehicle (soft delete to retired status)
 */

require_once '../config.php';

// Set content type
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'GET':
            handleGetVehicles();
            break;
        case 'POST':
            handleCreateVehicle();
            break;
        case 'PUT':
            handleUpdateVehicle();
            break;
        case 'DELETE':
            handleDeleteVehicle();
            break;
        default:
            throw new Exception('Method not allowed');
    }
} catch (Exception $e) {
    http_response_code(500);
    error_log('Vehicle API Error: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'debug' => [
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => DEBUG_MODE ? $e->getTraceAsString() : 'Hidden in production'
        ]
    ]);
}

function handleGetVehicles() {
    $pdo = getDBConnection();
    
    // Get filters from query parameters
    $status = $_GET['status'] ?? null;
    $vehicle_type = $_GET['vehicle_type'] ?? null;
    $location = $_GET['location'] ?? null;
    $include_maintenance = $_GET['include_maintenance'] ?? 'true';
    $include_driver_logs = $_GET['include_driver_logs'] ?? 'false';
    
    // Build query with filters
    $conditions = [];
    $params = [];
    
    if ($status) {
        $conditions[] = "v.status = ?";
        $params[] = $status;
    }
    
    if ($vehicle_type) {
        $conditions[] = "v.vehicle_type = ?";
        $params[] = $vehicle_type;
    }
    
    if ($location) {
        $conditions[] = "v.location LIKE ?";
        $params[] = "%$location%";
    }
    
    $whereClause = $conditions ? "WHERE " . implode(" AND ", $conditions) : "";
    
    // Main vehicle query
    $sql = "SELECT v.*,
                   CASE 
                       WHEN v.status = 'maintenance' AND v.maintenance_end_date < CURDATE() THEN 'overdue_maintenance'
                       WHEN v.insurance_end_date < CURDATE() THEN 'insurance_expired'
                       WHEN v.next_revision_due < CURDATE() THEN 'revision_overdue'
                       ELSE v.status
                   END as computed_status,
                   DATEDIFF(v.insurance_end_date, CURDATE()) as insurance_days_remaining,
                   DATEDIFF(v.next_revision_due, CURDATE()) as revision_days_remaining
            FROM vehicles v 
            $whereClause
            ORDER BY v.make, v.model, v.year";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $vehicles = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Add maintenance logs if requested
    if ($include_maintenance === 'true') {
        foreach ($vehicles as &$vehicle) {
            $maintenance_sql = "SELECT * FROM vehicle_maintenance_logs 
                               WHERE vehicle_id = ? 
                               ORDER BY start_date DESC 
                               LIMIT 10";
            $maintenance_stmt = $pdo->prepare($maintenance_sql);
            $maintenance_stmt->execute([$vehicle['id']]);
            $vehicle['maintenance_logs'] = $maintenance_stmt->fetchAll(PDO::FETCH_ASSOC);
        }
    }
    
    // Add recent driver logs if requested
    if ($include_driver_logs === 'true') {
        foreach ($vehicles as &$vehicle) {
            $driver_sql = "SELECT vdl.*, u.name as driver_name_from_user, t.title as trip_title
                          FROM vehicle_driver_logs vdl 
                          LEFT JOIN users u ON vdl.driver_user_id = u.id
                          LEFT JOIN trips t ON vdl.trip_id = t.id
                          WHERE vdl.vehicle_id = ? 
                          ORDER BY vdl.start_date DESC 
                          LIMIT 5";
            $driver_stmt = $pdo->prepare($driver_sql);
            $driver_stmt->execute([$vehicle['id']]);
            $vehicle['recent_driver_logs'] = $driver_stmt->fetchAll(PDO::FETCH_ASSOC);
        }
    }
    
    // Calculate totals
    $total_vehicles = count($vehicles);
    $available_count = count(array_filter($vehicles, fn($v) => $v['status'] === 'available'));
    $maintenance_count = count(array_filter($vehicles, fn($v) => $v['status'] === 'maintenance'));
    $retired_count = count(array_filter($vehicles, fn($v) => $v['status'] === 'retired'));
    
    echo json_encode([
        'success' => true,
        'vehicles' => $vehicles,
        'summary' => [
            'total' => $total_vehicles,
            'available' => $available_count,
            'maintenance' => $maintenance_count,
            'retired' => $retired_count
        ]
    ]);
}

function handleCreateVehicle() {
    $pdo = getDBConnection();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    $required_fields = ['make', 'model', 'vehicle_type', 'capacity'];
    foreach ($required_fields as $field) {
        if (empty($input[$field])) {
            throw new Exception("Missing required field: $field");
        }
    }
    
    // Set defaults
    $input['status'] = $input['status'] ?? 'available';
    $input['fuel_type'] = $input['fuel_type'] ?? 'gasoline';
    $input['transmission'] = $input['transmission'] ?? 'automatic';
    $input['current_mileage'] = $input['current_mileage'] ?? 0;
    $input['revision_interval_months'] = $input['revision_interval_months'] ?? 6;
    
    // Calculate next revision due if last revision date is provided
    if (!empty($input['last_revision_date']) && empty($input['next_revision_due'])) {
        $interval = $input['revision_interval_months'];
        $input['next_revision_due'] = date('Y-m-d', strtotime($input['last_revision_date'] . " +$interval months"));
    }
    
    $sql = "INSERT INTO vehicles (
                make, model, year, license_plate, vehicle_type, capacity, status, location,
                color, fuel_type, transmission, engine_size, vin, purchase_date, purchase_price,
                current_mileage, insurance_company, insurance_policy_number, insurance_start_date,
                insurance_end_date, insurance_amount, last_revision_date, next_revision_due,
                revision_interval_months, maintenance_start_date, maintenance_end_date,
                maintenance_reason, notes
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            )";
    
    $params = [
        $input['make'], $input['model'], $input['year'], $input['license_plate'],
        $input['vehicle_type'], $input['capacity'], $input['status'], $input['location'],
        $input['color'], $input['fuel_type'], $input['transmission'], $input['engine_size'],
        $input['vin'], $input['purchase_date'], $input['purchase_price'], $input['current_mileage'],
        $input['insurance_company'], $input['insurance_policy_number'], $input['insurance_start_date'],
        $input['insurance_end_date'], $input['insurance_amount'], $input['last_revision_date'],
        $input['next_revision_due'], $input['revision_interval_months'], $input['maintenance_start_date'],
        $input['maintenance_end_date'], $input['maintenance_reason'], $input['notes']
    ];
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    $vehicle_id = $pdo->lastInsertId();
    
    echo json_encode([
        'success' => true,
        'message' => 'Vehicle created successfully',
        'vehicle_id' => $vehicle_id
    ]);
}

function handleUpdateVehicle() {
    $pdo = getDBConnection();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['id'])) {
        throw new Exception('Vehicle ID is required');
    }
    
    $vehicle_id = $input['id'];
    
    // Check if vehicle exists
    $check_sql = "SELECT id FROM vehicles WHERE id = ?";
    $check_stmt = $pdo->prepare($check_sql);
    $check_stmt->execute([$vehicle_id]);
    
    if (!$check_stmt->fetch()) {
        throw new Exception('Vehicle not found');
    }
    
    // Build update query dynamically
    $updateFields = [];
    $params = [];
    
    $updatable_fields = [
        'make', 'model', 'year', 'license_plate', 'vehicle_type', 'capacity', 'status',
        'location', 'color', 'fuel_type', 'transmission', 'engine_size', 'vin',
        'purchase_date', 'purchase_price', 'current_mileage', 'insurance_company',
        'insurance_policy_number', 'insurance_start_date', 'insurance_end_date',
        'insurance_amount', 'last_revision_date', 'next_revision_due',
        'revision_interval_months', 'maintenance_start_date', 'maintenance_end_date',
        'maintenance_reason', 'notes'
    ];
    
    foreach ($updatable_fields as $field) {
        if (array_key_exists($field, $input)) {
            $updateFields[] = "$field = ?";
            $params[] = $input[$field];
        }
    }
    
    if (empty($updateFields)) {
        throw new Exception('No fields to update');
    }
    
    // Calculate next revision due if last revision date is updated
    if (isset($input['last_revision_date']) && !isset($input['next_revision_due'])) {
        $interval = $input['revision_interval_months'] ?? 6;
        $updateFields[] = "next_revision_due = ?";
        $params[] = date('Y-m-d', strtotime($input['last_revision_date'] . " +$interval months"));
    }
    
    $params[] = $vehicle_id;
    
    $sql = "UPDATE vehicles SET " . implode(', ', $updateFields) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    echo json_encode([
        'success' => true,
        'message' => 'Vehicle updated successfully'
    ]);
}

function handleDeleteVehicle() {
    $pdo = getDBConnection();
    
    $vehicle_id = $_GET['id'] ?? null;
    
    if (!$vehicle_id) {
        throw new Exception('Vehicle ID is required');
    }
    
    // Check if vehicle exists
    $check_sql = "SELECT id, status FROM vehicles WHERE id = ?";
    $check_stmt = $pdo->prepare($check_sql);
    $check_stmt->execute([$vehicle_id]);
    $vehicle = $check_stmt->fetch();
    
    if (!$vehicle) {
        throw new Exception('Vehicle not found');
    }
    
    // Check if vehicle is assigned to any active trips
    $assignment_sql = "SELECT COUNT(*) as count FROM trip_vehicle_assignments tva
                       JOIN trips t ON tva.trip_id = t.id
                       WHERE tva.vehicle_id = ? AND t.status IN ('planned', 'active')";
    $assignment_stmt = $pdo->prepare($assignment_sql);
    $assignment_stmt->execute([$vehicle_id]);
    $assignment_count = $assignment_stmt->fetch()['count'];
    
    if ($assignment_count > 0) {
        throw new Exception('Cannot delete vehicle: it is assigned to active or planned trips');
    }
    
    // Soft delete by setting status to 'retired'
    $sql = "UPDATE vehicles SET status = 'retired' WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$vehicle_id]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Vehicle retired successfully'
    ]);
}
?> 