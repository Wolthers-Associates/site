<?php
/**
 * Vehicle Driver Logs API
 * Handles CRUD operations for vehicle driver usage logs
 * 
 * Methods:
 * GET - List driver logs with filters
 * POST - Create new driver log
 * PUT - Update existing driver log
 * DELETE - Delete driver log
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
            handleGetDriverLogs();
            break;
        case 'POST':
            handleCreateDriverLog();
            break;
        case 'PUT':
            handleUpdateDriverLog();
            break;
        case 'DELETE':
            handleDeleteDriverLog();
            break;
        default:
            throw new Exception('Method not allowed');
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

function handleGetDriverLogs() {
    global $pdo;
    
    // Get filters from query parameters
    $vehicle_id = $_GET['vehicle_id'] ?? null;
    $driver_user_id = $_GET['driver_user_id'] ?? null;
    $trip_id = $_GET['trip_id'] ?? null;
    $status = $_GET['status'] ?? null;
    $start_date = $_GET['start_date'] ?? null;
    $end_date = $_GET['end_date'] ?? null;
    $limit = $_GET['limit'] ?? 50;
    
    // Build query with filters
    $conditions = [];
    $params = [];
    
    if ($vehicle_id) {
        $conditions[] = "vdl.vehicle_id = ?";
        $params[] = $vehicle_id;
    }
    
    if ($driver_user_id) {
        $conditions[] = "vdl.driver_user_id = ?";
        $params[] = $driver_user_id;
    }
    
    if ($trip_id) {
        $conditions[] = "vdl.trip_id = ?";
        $params[] = $trip_id;
    }
    
    if ($status) {
        $conditions[] = "vdl.status = ?";
        $params[] = $status;
    }
    
    if ($start_date) {
        $conditions[] = "vdl.start_date >= ?";
        $params[] = $start_date;
    }
    
    if ($end_date) {
        $conditions[] = "vdl.start_date <= ?";
        $params[] = $end_date;
    }
    
    $whereClause = $conditions ? "WHERE " . implode(" AND ", $conditions) : "";
    
    $sql = "SELECT vdl.*,
                   v.make, v.model, v.year, v.license_plate,
                   u.name as driver_name_from_user, u.email as driver_email,
                   t.title as trip_title, t.destination_country,
                   DATEDIFF(vdl.end_date, vdl.start_date) as duration_days,
                   (vdl.end_mileage - vdl.start_mileage) as mileage_driven,
                   (vdl.fuel_cost + vdl.toll_cost + vdl.other_expenses) as total_expenses,
                   CASE 
                       WHEN vdl.status = 'active' AND vdl.end_date < CURDATE() THEN 'overdue'
                       ELSE vdl.status
                   END as computed_status
            FROM vehicle_driver_logs vdl
            JOIN vehicles v ON vdl.vehicle_id = v.id
            LEFT JOIN users u ON vdl.driver_user_id = u.id
            LEFT JOIN trips t ON vdl.trip_id = t.id
            $whereClause
            ORDER BY vdl.start_date DESC
            LIMIT ?";
    
    $params[] = intval($limit);
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get summary statistics
    $summary_sql = "SELECT 
                        COUNT(*) as total_logs,
                        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
                        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                        SUM(CASE WHEN status = 'pending_review' THEN 1 ELSE 0 END) as pending_review,
                        SUM(fuel_cost) as total_fuel_cost,
                        SUM(toll_cost) as total_toll_cost,
                        SUM(other_expenses) as total_other_expenses,
                        SUM(fuel_cost + toll_cost + other_expenses) as total_expenses,
                        SUM(end_mileage - start_mileage) as total_mileage,
                        AVG(end_mileage - start_mileage) as average_trip_mileage,
                        SUM(CASE WHEN damage_reported = 1 THEN 1 ELSE 0 END) as damage_reports
                    FROM vehicle_driver_logs vdl
                    $whereClause";
    
    // Remove limit parameter for summary
    $summary_params = array_slice($params, 0, -1);
    $summary_stmt = $pdo->prepare($summary_sql);
    $summary_stmt->execute($summary_params);
    $summary = $summary_stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'logs' => $logs,
        'summary' => $summary
    ]);
}

function handleCreateDriverLog() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    $required_fields = ['vehicle_id', 'driver_name', 'start_date'];
    foreach ($required_fields as $field) {
        if (empty($input[$field])) {
            throw new Exception("Missing required field: $field");
        }
    }
    
    // Verify vehicle exists and is available
    $vehicle_check = "SELECT id, status, current_mileage FROM vehicles WHERE id = ?";
    $vehicle_stmt = $pdo->prepare($vehicle_check);
    $vehicle_stmt->execute([$input['vehicle_id']]);
    $vehicle = $vehicle_stmt->fetch();
    
    if (!$vehicle) {
        throw new Exception('Vehicle not found');
    }
    
    if ($vehicle['status'] !== 'available') {
        throw new Exception('Vehicle is not available');
    }
    
    // Check for overlapping active logs for this vehicle
    $overlap_check = "SELECT id FROM vehicle_driver_logs 
                      WHERE vehicle_id = ? AND status = 'active'
                      AND (? BETWEEN start_date AND COALESCE(end_date, '2099-12-31'))";
    $overlap_stmt = $pdo->prepare($overlap_check);
    $overlap_stmt->execute([$input['vehicle_id'], $input['start_date']]);
    
    if ($overlap_stmt->fetch()) {
        throw new Exception('Vehicle already has an active driver log');
    }
    
    // Set defaults
    $input['status'] = $input['status'] ?? 'active';
    $input['damage_reported'] = $input['damage_reported'] ?? 0;
    $input['start_mileage'] = $input['start_mileage'] ?? $vehicle['current_mileage'];
    
    // Verify driver user if provided
    if (!empty($input['driver_user_id'])) {
        $driver_check = "SELECT id, name FROM users WHERE id = ?";
        $driver_stmt = $pdo->prepare($driver_check);
        $driver_stmt->execute([$input['driver_user_id']]);
        $driver = $driver_stmt->fetch();
        
        if (!$driver) {
            throw new Exception('Driver user not found');
        }
        
        // Use the user's name if driver_name not provided or empty
        if (empty($input['driver_name'])) {
            $input['driver_name'] = $driver['name'];
        }
    }
    
    $sql = "INSERT INTO vehicle_driver_logs (
                vehicle_id, driver_user_id, driver_name, trip_id, start_date, end_date,
                start_mileage, end_mileage, fuel_cost, toll_cost, other_expenses,
                route_description, notes, damage_reported, damage_description,
                fuel_receipts, expense_receipts, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    $params = [
        $input['vehicle_id'], $input['driver_user_id'], $input['driver_name'],
        $input['trip_id'], $input['start_date'], $input['end_date'],
        $input['start_mileage'], $input['end_mileage'], $input['fuel_cost'],
        $input['toll_cost'], $input['other_expenses'], $input['route_description'],
        $input['notes'], $input['damage_reported'], $input['damage_description'],
        $input['fuel_receipts'], $input['expense_receipts'], $input['status']
    ];
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    $log_id = $pdo->lastInsertId();
    
    echo json_encode([
        'success' => true,
        'message' => 'Driver log created successfully',
        'log_id' => $log_id
    ]);
}

function handleUpdateDriverLog() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['id'])) {
        throw new Exception('Driver log ID is required');
    }
    
    $log_id = $input['id'];
    
    // Check if log exists and get current data
    $check_sql = "SELECT * FROM vehicle_driver_logs WHERE id = ?";
    $check_stmt = $pdo->prepare($check_sql);
    $check_stmt->execute([$log_id]);
    $current_log = $check_stmt->fetch();
    
    if (!$current_log) {
        throw new Exception('Driver log not found');
    }
    
    // Build update query dynamically
    $updateFields = [];
    $params = [];
    
    $updatable_fields = [
        'driver_name', 'trip_id', 'start_date', 'end_date', 'start_mileage',
        'end_mileage', 'fuel_cost', 'toll_cost', 'other_expenses', 'route_description',
        'notes', 'damage_reported', 'damage_description', 'fuel_receipts',
        'expense_receipts', 'status'
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
    
    $params[] = $log_id;
    
    $sql = "UPDATE vehicle_driver_logs SET " . implode(', ', $updateFields) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    // Update vehicle mileage if end_mileage is provided and status is completed
    $new_status = $input['status'] ?? $current_log['status'];
    $end_mileage = $input['end_mileage'] ?? $current_log['end_mileage'];
    
    if ($new_status === 'completed' && $end_mileage && $end_mileage > 0) {
        $vehicle_sql = "UPDATE vehicles SET current_mileage = ? WHERE id = ?";
        $vehicle_stmt = $pdo->prepare($vehicle_sql);
        $vehicle_stmt->execute([$end_mileage, $current_log['vehicle_id']]);
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Driver log updated successfully'
    ]);
}

function handleDeleteDriverLog() {
    global $pdo;
    
    $log_id = $_GET['id'] ?? null;
    
    if (!$log_id) {
        throw new Exception('Driver log ID is required');
    }
    
    // Check if log exists
    $check_sql = "SELECT vehicle_id, status FROM vehicle_driver_logs WHERE id = ?";
    $check_stmt = $pdo->prepare($check_sql);
    $check_stmt->execute([$log_id]);
    $log = $check_stmt->fetch();
    
    if (!$log) {
        throw new Exception('Driver log not found');
    }
    
    // Don't allow deletion of completed logs (for audit trail)
    if ($log['status'] === 'completed') {
        throw new Exception('Cannot delete completed driver logs');
    }
    
    // Delete the log
    $sql = "DELETE FROM vehicle_driver_logs WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$log_id]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Driver log deleted successfully'
    ]);
}
?> 