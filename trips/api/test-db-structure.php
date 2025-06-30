<?php
/**
 * Temporary Database Structure Test
 * Check current users table structure and sample data
 */

require_once 'database.php';

try {
    $pdo = getDBConnection();
    
    echo "=== USERS TABLE STRUCTURE ===\n";
    $stmt = $pdo->prepare("SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users'");
    $stmt->execute();
    $columns = $stmt->fetchAll();
    foreach ($columns as $column) {
        echo sprintf("%-20s %-15s %-10s %-15s\n", 
            $column['COLUMN_NAME'], 
            $column['DATA_TYPE'], 
            $column['IS_NULLABLE'] === 'YES' ? 'NULL' : 'NOT NULL',
            $column['COLUMN_DEFAULT'] ?: 'none'
        );
    }
    
    echo "\n=== CHECKING FOR TIMESTAMP COLUMNS ===\n";
    $timestampColumns = ['last_login_at', 'last_login_at_utc', 'last_login_timezone', 'login_attempts'];
    foreach ($timestampColumns as $col) {
        $check = $pdo->prepare('SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ? AND COLUMN_NAME = ?');
        $check->execute(['users', $col]);
        $result = $check->fetch();
        echo "$col: " . ($result ? 'EXISTS' : 'MISSING') . "\n";
    }
    
    echo "\n=== SAMPLE USER DATA (LAST 5 USERS) ===\n";
    $stmt = $pdo->prepare('SELECT TOP 5 id, name, email, role, created_at, updated_at FROM users ORDER BY id DESC');
    $stmt->execute();
    $users = $stmt->fetchAll();
    
    foreach ($users as $user) {
        echo sprintf("ID: %d | %s | %s | %s | Created: %s | Updated: %s\n",
            $user['id'],
            $user['name'],
            $user['email'],
            $user['role'],
            $user['created_at'],
            $user['updated_at']
        );
    }
    
    echo "\n=== CHECKING MYSQL TIMEZONE SETTINGS ===\n";
    $tzStmt = $pdo->prepare('SELECT @@global.time_zone AS global_tz, @@session.time_zone AS session_tz, NOW() AS server_time, UTC_TIMESTAMP() AS utc_time');
    $tzStmt->execute();
    $tzData = $tzStmt->fetch();
    
    echo "Global Timezone: " . $tzData['global_tz'] . "\n";
    echo "Session Timezone: " . $tzData['session_tz'] . "\n";
    echo "Server Time (NOW()): " . $tzData['server_time'] . "\n";
    echo "UTC Time (UTC_TIMESTAMP()): " . $tzData['utc_time'] . "\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
?> 