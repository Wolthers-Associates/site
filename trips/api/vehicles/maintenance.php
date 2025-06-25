<?php
/**
 * Vehicle Maintenance Logs API
 * Handles CRUD operations for vehicle maintenance records
 * 
 * Methods:
 * GET - List maintenance logs with filters
 * POST - Create new maintenance log
 * PUT - Update existing maintenance log
 * DELETE - Delete maintenance log
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
            handleGetMaintenanceLogs();
            break;
        case 'POST':
            handleCreateMaintenanceLog();
            break;
        case 'PUT':
            handleUpdateMaintenanceLog();
            break;
        case 'DELETE':
            handleDeleteMaintenanceLog();
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

function handleGetMaintenanceLogs() {
    global $pdo;
    
    // Get filters from query parameters
    $vehicle_id = $_GET['vehicle_id'] ?? null;
    $maintenance_type = $_GET['maintenance_type'] ?? null;
    $status = $_GET['status'] ?? null;
    $start_date = $_GET['start_date'] ?? null;
    $end_date = $_GET['end_date'] ?? null;
    $limit = $_GET['limit'] ?? 50;
    
    // Build query with filters
    $conditions = [];
    $params = [];
    
    if ($vehicle_id) {
        $conditions[] = "vml.vehicle_id = ?";
        $params[] = $vehicle_id;
    }
    
    if ($maintenance_type) {
        $conditions[] = "vml.maintenance_type = ?";
        $params[] = $maintenance_type;
    }
    
    if ($status) {
        $conditions[] = "vml.status = ?";
        $params[] = $status;
    }
    
    if ($start_date) {
        $conditions[] = "vml.start_date >= ?";
        $params[] = $start_date;
    }
    
    if ($end_date) {
        $conditions[] = "vml.start_date <= ?";
        $params[] = $end_date;
    }
    
    $whereClause = $conditions ? "WHERE " . implode(" AND ", $conditions) : "";
    
    $sql = "SELECT vml.*,
                   v.make, v.model, v.year, v.license_plate,
                   u.name as created_by_name,
                   DATEDIFF(vml.end_date, vml.start_date) as duration_days,
                   CASE 
                       WHEN vml.status = 'scheduled' AND vml.start_date < CURDATE() THEN 'overdue'
                       WHEN vml.status = 'in_progress' AND vml.end_date < CURDATE() THEN 'overdue'
                       ELSE vml.status
                   END as computed_status
            FROM vehicle_maintenance_logs vml
            JOIN vehicles v ON vml.vehicle_id = v.id
            LEFT JOIN users u ON vml.created_by = u.id
            $whereClause
            ORDER BY vml.start_date DESC
            LIMIT ?";
    
    $params[] = intval($limit);
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get summary statistics
    $summary_sql = "SELECT 
                        COUNT(*) as total_logs,
                        SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled,
                        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
                        SUM(cost) as total_cost,
                        AVG(cost) as average_cost
                    FROM vehicle_maintenance_logs vml
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

function handleCreateMaintenanceLog() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    $required_fields = ['vehicle_id', 'maintenance_type', 'description', 'start_date'];
    foreach ($required_fields as $field) {
        if (empty($input[$field])) {
            throw new Exception("Missing required field: $field");
        }
    }
    
    // Verify vehicle exists
    $vehicle_check = "SELECT id FROM vehicles WHERE id = ?";
    $vehicle_stmt = $pdo->prepare($vehicle_check);
    $vehicle_stmt->execute([$input['vehicle_id']]);
    if (!$vehicle_stmt->fetch()) {
        throw new Exception('Vehicle not found');
    }
    
    // Set defaults
    $input['status'] = $input['status'] ?? 'scheduled';
    $input['created_by'] = $input['created_by'] ?? 1; // TODO: Get from session
    
    // Auto-calculate next service due based on maintenance type
    if (empty($input['next_service_due']) && !empty($input['end_date'])) {
        $interval_map = [
            'routine' => '+3 months',
            'revision' => '+6 months',
            'inspection' => '+12 months',
            'repair' => '+6 months',
            'emergency' => '+3 months'
        ];
        
        $interval = $interval_map[$input['maintenance_type']] ?? '+6 months';
        $input['next_service_due'] = date('Y-m-d', strtotime($input['end_date'] . ' ' . $interval));
    }
    
    $sql = "INSERT INTO vehicle_maintenance_logs (
                vehicle_id, maintenance_type, description, start_date, end_date, cost,
                mileage_at_service, service_provider, invoice_number, parts_replaced,
                next_service_due, status, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    $params = [
        $input['vehicle_id'], $input['maintenance_type'], $input['description'],
        $input['start_date'], $input['end_date'], $input['cost'],
        $input['mileage_at_service'], $input['service_provider'], $input['invoice_number'],
        $input['parts_replaced'], $input['next_service_due'], $input['status'],
        $input['created_by']
    ];
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    $log_id = $pdo->lastInsertId();
    
    // Update vehicle maintenance dates if this is current maintenance
    if ($input['status'] === 'in_progress' || $input['status'] === 'scheduled') {
        $update_vehicle_sql = "UPDATE vehicles SET 
                                  maintenance_start_date = ?,
                                  maintenance_end_date = ?,
                                  maintenance_reason = ?,
                                  status = CASE WHEN ? = 'in_progress' THEN 'maintenance' ELSE status END
                               WHERE id = ?";
        
        $vehicle_params = [
            $input['start_date'],
            $input['end_date'],
            $input['description'],
            $input['status'],
            $input['vehicle_id']
        ];
        
        $vehicle_stmt = $pdo->prepare($update_vehicle_sql);
        $vehicle_stmt->execute($vehicle_params);
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Maintenance log created successfully',
        'log_id' => $log_id
    ]);
}

function handleUpdateMaintenanceLog() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['id'])) {
        throw new Exception('Maintenance log ID is required');
    }
    
    $log_id = $input['id'];
    
    // Check if log exists and get current data
    $check_sql = "SELECT * FROM vehicle_maintenance_logs WHERE id = ?";
    $check_stmt = $pdo->prepare($check_sql);
    $check_stmt->execute([$log_id]);
    $current_log = $check_stmt->fetch();
    
    if (!$current_log) {
        throw new Exception('Maintenance log not found');
    }
    
    // Build update query dynamically
    $updateFields = [];
    $params = [];
    
    $updatable_fields = [
        'maintenance_type', 'description', 'start_date', 'end_date', 'cost',
        'mileage_at_service', 'service_provider', 'invoice_number', 'parts_replaced',
        'next_service_due', 'status'
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
    
    $sql = "UPDATE vehicle_maintenance_logs SET " . implode(', ', $updateFields) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    // Update vehicle status based on maintenance log status
    $new_status = $input['status'] ?? $current_log['status'];
    $vehicle_id = $current_log['vehicle_id'];
    
    if ($new_status === 'completed') {
        // Clear maintenance dates and set vehicle back to available
        $vehicle_sql = "UPDATE vehicles SET 
                           maintenance_start_date = NULL,
                           maintenance_end_date = NULL,
                           maintenance_reason = NULL,
                           status = 'available',
                           last_revision_date = CASE WHEN ? = 'revision' THEN CURDATE() ELSE last_revision_date END,
                           current_mileage = COALESCE(?, current_mileage)
                        WHERE id = ?";
        
        $vehicle_params = [
            $input['maintenance_type'] ?? $current_log['maintenance_type'],
            $input['mileage_at_service'] ?? null,
            $vehicle_id
        ];
        
        $vehicle_stmt = $pdo->prepare($vehicle_sql);
        $vehicle_stmt->execute($vehicle_params);
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Maintenance log updated successfully'
    ]);
}

function handleDeleteMaintenanceLog() {
    global $pdo;
    
    $log_id = $_GET['id'] ?? null;
    
    if (!$log_id) {
        throw new Exception('Maintenance log ID is required');
    }
    
    // Check if log exists
    $check_sql = "SELECT vehicle_id, status FROM vehicle_maintenance_logs WHERE id = ?";
    $check_stmt = $pdo->prepare($check_sql);
    $check_stmt->execute([$log_id]);
    $log = $check_stmt->fetch();
    
    if (!$log) {
        throw new Exception('Maintenance log not found');
    }
    
    // Don't allow deletion of completed logs (for audit trail)
    if ($log['status'] === 'completed') {
        throw new Exception('Cannot delete completed maintenance logs');
    }
    
    // Delete the log
    $sql = "DELETE FROM vehicle_maintenance_logs WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$log_id]);
    
    // If this was an active maintenance, clear vehicle maintenance status
    if ($log['status'] === 'in_progress') {
        $vehicle_sql = "UPDATE vehicles SET 
                           maintenance_start_date = NULL,
                           maintenance_end_date = NULL,
                           maintenance_reason = NULL,
                           status = 'available'
                        WHERE id = ?";
        
        $vehicle_stmt = $pdo->prepare($vehicle_sql);
        $vehicle_stmt->execute([$log['vehicle_id']]);
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Maintenance log deleted successfully'
    ]);
}
?> 