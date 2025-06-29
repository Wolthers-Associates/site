<?php
/**
 * Debug Database Structure - Last Login Timestamp Investigation
 * trips.wolthers.com/api/debug-db-structure.php
 * 
 * Investigates database structure and timestamp issues
 */

require_once 'config.php';

// Only allow in development/staging - TEMPORARILY ENABLED FOR DEBUGGING
// if (!isset($_SERVER['HTTP_HOST']) || (!strpos($_SERVER['HTTP_HOST'], 'khaki-raccoon') && !strpos($_SERVER['HTTP_HOST'], 'localhost'))) {
//     die('This debug script is only available on development servers.');
// }

try {
    $pdo = getDBConnection();
    
    echo "<h1>🔍 Database Structure & Timestamp Debug</h1>";
    echo "<style>body{font-family:monospace;} table{border-collapse:collapse;width:100%;} th,td{border:1px solid #ddd;padding:8px;text-align:left;} th{background-color:#f2f2f2;} .error{color:red;} .success{color:green;} .warning{color:orange;}</style>";
    
    // 1. Check users table structure
    echo "<h2>📊 Users Table Structure</h2>";
    $stmt = $pdo->query("DESCRIBE users");
    $columns = $stmt->fetchAll();
    
    echo "<table>";
    echo "<tr><th>Column</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th><th>Extra</th></tr>";
    
    $hasLastLogin = false;
    $hasLoginAttempts = false;
    $hasTimezone = false;
    
    foreach ($columns as $column) {
        echo "<tr>";
        echo "<td>{$column['Field']}</td>";
        echo "<td>{$column['Type']}</td>";
        echo "<td>{$column['Null']}</td>";
        echo "<td>{$column['Key']}</td>";
        echo "<td>{$column['Default']}</td>";
        echo "<td>{$column['Extra']}</td>";
        echo "</tr>";
        
        if ($column['Field'] === 'last_login_at') $hasLastLogin = true;
        if ($column['Field'] === 'login_attempts') $hasLoginAttempts = true;
        if (strpos($column['Field'], 'timezone') !== false) $hasTimezone = true;
    }
    echo "</table>";
    
    // 2. Check missing columns
    echo "<h2>⚠️  Missing Columns Analysis</h2>";
    echo "<ul>";
    echo "<li>last_login_at: " . ($hasLastLogin ? "<span class='success'>✅ EXISTS</span>" : "<span class='error'>❌ MISSING</span>") . "</li>";
    echo "<li>login_attempts: " . ($hasLoginAttempts ? "<span class='success'>✅ EXISTS</span>" : "<span class='error'>❌ MISSING</span>") . "</li>";
    echo "<li>timezone columns: " . ($hasTimezone ? "<span class='success'>✅ EXISTS</span>" : "<span class='error'>❌ MISSING</span>") . "</li>";
    echo "</ul>";
    
    // 3. Check current user data
    echo "<h2>👥 Current Users & Login Data</h2>";
    $stmt = $pdo->query("SELECT id, name, email, role, created_at, updated_at" . 
                       ($hasLastLogin ? ", last_login_at" : "") .
                       ($hasLoginAttempts ? ", login_attempts" : "") .
                       " FROM users ORDER BY id");
    $users = $stmt->fetchAll();
    
    echo "<table>";
    echo "<tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Created</th><th>Updated</th>";
    if ($hasLastLogin) echo "<th>Last Login</th>";
    if ($hasLoginAttempts) echo "<th>Login Attempts</th>";
    echo "</tr>";
    
    foreach ($users as $user) {
        echo "<tr>";
        echo "<td>{$user['id']}</td>";
        echo "<td>{$user['name']}</td>";
        echo "<td>{$user['email']}</td>";
        echo "<td>{$user['role']}</td>";
        echo "<td>{$user['created_at']}</td>";
        echo "<td>{$user['updated_at']}</td>";
        if ($hasLastLogin) {
            $lastLogin = $user['last_login_at'] ?? 'NULL';
            if ($lastLogin === '2025-01-21 01:07:14') {
                echo "<td><span class='warning'>⚠️ {$lastLogin} (DUPLICATE)</span></td>";
            } else {
                echo "<td>{$lastLogin}</td>";
            }
        }
        if ($hasLoginAttempts) echo "<td>" . ($user['login_attempts'] ?? 'NULL') . "</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    // 4. Check MySQL timezone settings
    echo "<h2>🌍 MySQL Timezone Settings</h2>";
    $timezoneQueries = [
        "SELECT @@global.time_zone as global_timezone",
        "SELECT @@session.time_zone as session_timezone", 
        "SELECT NOW() as server_now",
        "SELECT UTC_TIMESTAMP() as utc_timestamp",
        "SELECT CONVERT_TZ(NOW(), @@session.time_zone, '+00:00') as now_utc"
    ];
    
    foreach ($timezoneQueries as $query) {
        try {
            $stmt = $pdo->query($query);
            $result = $stmt->fetch();
            echo "<p><strong>" . $query . ":</strong> " . json_encode($result) . "</p>";
        } catch (Exception $e) {
            echo "<p class='error'><strong>" . $query . ":</strong> ERROR - " . $e->getMessage() . "</p>";
        }
    }
    
    // 5. Check for duplicate timestamps
    if ($hasLastLogin) {
        echo "<h2>🔍 Duplicate Timestamp Analysis</h2>";
        $stmt = $pdo->query("
            SELECT last_login_at, COUNT(*) as count 
            FROM users 
            WHERE last_login_at IS NOT NULL 
            GROUP BY last_login_at 
            HAVING COUNT(*) > 1
        ");
        $duplicates = $stmt->fetchAll();
        
        if (count($duplicates) > 0) {
            echo "<p class='error'>❌ Found duplicate timestamps:</p>";
            echo "<table>";
            echo "<tr><th>Timestamp</th><th>Count</th></tr>";
            foreach ($duplicates as $dup) {
                echo "<tr><td>{$dup['last_login_at']}</td><td>{$dup['count']}</td></tr>";
            }
            echo "</table>";
        } else {
            echo "<p class='success'>✅ No duplicate timestamps found</p>";
        }
    }
    
    // 6. Recommended fixes
    echo "<h2>🔧 Recommended Database Fixes</h2>";
    echo "<div style='background:#f0f0f0;padding:15px;margin:10px 0;'>";
    echo "<h3>SQL Commands to Fix Issues:</h3>";
    echo "<pre>";
    
    if (!$hasLastLogin) {
        echo "-- Add last_login_at column\n";
        echo "ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP NULL AFTER updated_at;\n\n";
    }
    
    if (!$hasLoginAttempts) {
        echo "-- Add login_attempts column\n";
        echo "ALTER TABLE users ADD COLUMN login_attempts INT DEFAULT 0 AFTER last_login_at;\n\n";
    }
    
    if (!$hasTimezone) {
        echo "-- Add timezone columns\n";
        echo "ALTER TABLE users ADD COLUMN last_login_at_utc TIMESTAMP NULL AFTER last_login_at;\n";
        echo "ALTER TABLE users ADD COLUMN last_login_timezone VARCHAR(50) NULL AFTER last_login_at_utc;\n\n";
    }
    
    echo "-- Add indexes for performance\n";
    echo "CREATE INDEX idx_users_last_login ON users(last_login_at);\n";
    echo "CREATE INDEX idx_users_login_attempts ON users(login_attempts);\n";
    
    echo "</pre>";
    echo "</div>";
    
    echo "<h2>✅ Debug Complete</h2>";
    echo "<p>Timestamp: " . date('Y-m-d H:i:s T') . "</p>";
    
} catch (Exception $e) {
    echo "<h1 class='error'>❌ Database Error</h1>";
    echo "<p class='error'>Error: " . $e->getMessage() . "</p>";
}
?> 