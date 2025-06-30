<?php
// Simple test to check database connection
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'config.php';

try {
    $pdo = getDBConnection();
    // Test basic connection
    $stmt = $pdo->query("SELECT 1 as test");
    $result = $stmt->fetch();
    // Try to get table info (SQL Server)
    $tables = [];
    try {
        $tablesStmt = $pdo->query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'");
        while ($row = $tablesStmt->fetch(PDO::FETCH_ASSOC)) {
            $tables[] = $row['TABLE_NAME'];
        }
    } catch (Exception $e) {
        $tables = ['Error: ' . $e->getMessage()];
    }
    echo json_encode([
        'success' => true,
        'message' => 'Database connection successful',
        'test_query' => $result,
        'available_tables' => $tables,
        'db_config' => [
            'host' => DB_HOST,
            'database' => DB_NAME,
            'user' => DB_USER
        ]
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'db_config' => [
            'host' => DB_HOST,
            'database' => DB_NAME,
            'user' => DB_USER
        ]
    ], JSON_PRETTY_PRINT);
}
?> 