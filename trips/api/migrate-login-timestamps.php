<?php
/**
 * Database Migration: Add Login Timestamp & Timezone Columns
 * trips.wolthers.com/api/migrate-login-timestamps.php
 * 
 * Adds missing columns for proper login timestamp and timezone handling
 */

require_once 'config.php';

// Only allow in development/staging or with explicit confirmation
$confirmParam = $_GET['confirm'] ?? '';
if ($confirmParam !== 'YES_I_WANT_TO_MIGRATE_DATABASE') {
    die('This migration script requires confirmation. Add ?confirm=YES_I_WANT_TO_MIGRATE_DATABASE to the URL.');
}

try {
    $pdo = getDBConnection();
    
    echo "<h1>🔄 Database Migration: Login Timestamps & Timezone Support</h1>";
    echo "<style>body{font-family:monospace;} .success{color:green;} .error{color:red;} .warning{color:orange;} pre{background:#f0f0f0;padding:10px;}</style>";
    
    echo "<h2>📋 Migration Plan</h2>";
    echo "<p>This migration will add the following columns to the users table:</p>";
    echo "<ul>";
    echo "<li><code>last_login_at</code> - Timestamp in user's local timezone</li>";
    echo "<li><code>last_login_at_utc</code> - Timestamp in UTC for consistency</li>";
    echo "<li><code>last_login_timezone</code> - User's timezone identifier</li>";
    echo "<li><code>login_attempts</code> - Failed login attempt counter</li>";
    echo "<li><code>password_hash</code> - For regular user authentication</li>";
    echo "</ul>";
    
    $migrations = [];
    $errors = [];
    
    // Check existing columns
    $stmt = $pdo->query("DESCRIBE users");
    $existingColumns = array_column($stmt->fetchAll(), 'Field');
    
    echo "<h2>🔍 Checking Current Structure</h2>";
    echo "<p>Existing columns: " . implode(', ', $existingColumns) . "</p>";
    
    // Define migrations
    $columnsToAdd = [
        'password_hash' => "ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) DEFAULT NULL AFTER office365_id",
        'last_login_at' => "ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP NULL DEFAULT NULL AFTER status",
        'last_login_at_utc' => "ALTER TABLE users ADD COLUMN last_login_at_utc TIMESTAMP NULL DEFAULT NULL AFTER last_login_at",
        'last_login_timezone' => "ALTER TABLE users ADD COLUMN last_login_timezone VARCHAR(50) DEFAULT NULL AFTER last_login_at_utc",
        'login_attempts' => "ALTER TABLE users ADD COLUMN login_attempts INT DEFAULT 0 AFTER last_login_timezone"
    ];
    
    echo "<h2>⚙️  Executing Migrations</h2>";
    
    // Execute migrations
    foreach ($columnsToAdd as $columnName => $sql) {
        if (in_array($columnName, $existingColumns)) {
            echo "<p class='warning'>⚠️  Column '$columnName' already exists - skipping</p>";
            continue;
        }
        
        try {
            $pdo->exec($sql);
            echo "<p class='success'>✅ Added column '$columnName'</p>";
            $migrations[] = $columnName;
        } catch (Exception $e) {
            echo "<p class='error'>❌ Failed to add column '$columnName': " . $e->getMessage() . "</p>";
            $errors[] = $columnName . ': ' . $e->getMessage();
        }
    }
    
    // Add indexes
    echo "<h2>📇 Adding Indexes</h2>";
    $indexes = [
        'idx_users_last_login' => "CREATE INDEX idx_users_last_login ON users(last_login_at)",
        'idx_users_login_attempts' => "CREATE INDEX idx_users_login_attempts ON users(login_attempts)"
    ];
    
    foreach ($indexes as $indexName => $sql) {
        try {
            $pdo->exec($sql);
            echo "<p class='success'>✅ Created index '$indexName'</p>";
        } catch (Exception $e) {
            if (strpos($e->getMessage(), 'Duplicate key name') !== false) {
                echo "<p class='warning'>⚠️  Index '$indexName' already exists - skipping</p>";
            } else {
                echo "<p class='error'>❌ Failed to create index '$indexName': " . $e->getMessage() . "</p>";
                $errors[] = $indexName . ': ' . $e->getMessage();
            }
        }
    }
    
    // Verify final structure
    echo "<h2>🔍 Verifying Migration</h2>";
    $stmt = $pdo->query("DESCRIBE users");
    $finalColumns = array_column($stmt->fetchAll(), 'Field');
    
    $requiredColumns = ['last_login_at', 'last_login_at_utc', 'last_login_timezone', 'login_attempts', 'password_hash'];
    $missingColumns = array_diff($requiredColumns, $finalColumns);
    
    if (empty($missingColumns)) {
        echo "<p class='success'>✅ All required columns are now present!</p>";
    } else {
        echo "<p class='error'>❌ Still missing columns: " . implode(', ', $missingColumns) . "</p>";
    }
    
    // Show summary
    echo "<h2>📊 Migration Summary</h2>";
    echo "<p><strong>Columns added:</strong> " . (count($migrations) > 0 ? implode(', ', $migrations) : 'None') . "</p>";
    echo "<p><strong>Errors:</strong> " . (count($errors) > 0 ? count($errors) . ' errors occurred' : 'None') . "</p>";
    
    if (count($errors) > 0) {
        echo "<h3>Error Details:</h3>";
        echo "<ul>";
        foreach ($errors as $error) {
            echo "<li class='error'>$error</li>";
        }
        echo "</ul>";
    }
    
    echo "<h2>🎯 Next Steps</h2>";
    echo "<p>After this migration:</p>";
    echo "<ol>";
    echo "<li>Update login.php to use new timestamp columns</li>";
    echo "<li>Update frontend auth.js to send timezone information</li>";
    echo "<li>Test login functionality</li>";
    echo "<li>Monitor login timestamps for accuracy</li>";
    echo "</ol>";
    
    echo "<p><strong>Migration completed at:</strong> " . date('Y-m-d H:i:s T') . "</p>";
    
} catch (Exception $e) {
    echo "<h1 class='error'>❌ Migration Failed</h1>";
    echo "<p class='error'>Fatal error: " . $e->getMessage() . "</p>";
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
}
?> 