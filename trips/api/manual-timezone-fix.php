<?php
/**
 * Manual Timezone Fix for Daniel Wolthers
 * trips.wolthers.com/api/manual-timezone-fix.php
 * 
 * One-time fix to update Daniel's timezone data
 */

require_once 'config.php';

try {
    $pdo = getDBConnection();
    
    // Get Daniel's current data
    $stmt = $pdo->prepare("SELECT id, name, last_login_at, last_login_at_utc, last_login_timezone FROM users WHERE email = 'daniel@wolthers.com'");
    $stmt->execute();
    $user = $stmt->fetch();
    
    if (!$user) {
        die("User not found");
    }
    
    echo "<h2>🔧 Manual Timezone Fix for Daniel Wolthers</h2>";
    echo "<p><strong>Current Data:</strong></p>";
    echo "<ul>";
    echo "<li>User ID: {$user['id']}</li>";
    echo "<li>Name: {$user['name']}</li>";
    echo "<li>Current Timezone: {$user['last_login_timezone']}</li>";
    echo "<li>Last Login (Local): {$user['last_login_at']}</li>";
    echo "<li>Last Login (UTC): {$user['last_login_at_utc']}</li>";
    echo "</ul>";
    
    $timezone = 'America/Sao_Paulo';
    
    if ($user['last_login_at_utc']) {
        // Convert existing UTC timestamp to Brazilian time
        $utcDateTime = new DateTime($user['last_login_at_utc'], new DateTimeZone('UTC'));
        $utcDateTime->setTimezone(new DateTimeZone($timezone));
        $localTimestamp = $utcDateTime->format('Y-m-d H:i:s');
        
        // Update the database
        $updateStmt = $pdo->prepare("
            UPDATE users 
            SET last_login_timezone = ?, 
                last_login_at = ?,
                updated_at = NOW()
            WHERE id = ?
        ");
        $updateStmt->execute([$timezone, $localTimestamp, $user['id']]);
        
        echo "<p><strong>✅ FIXED!</strong></p>";
        echo "<ul>";
        echo "<li>Timezone: UTC → {$timezone}</li>";
        echo "<li>Local Time: {$user['last_login_at']} → {$localTimestamp}</li>";
        echo "<li>UTC Time: {$user['last_login_at_utc']} (unchanged)</li>";
        echo "</ul>";
        
        echo "<p>🎉 Your login timestamps now show in Brazilian time!</p>";
        echo "<p><a href='debug-db-structure.php'>Check Database Status</a></p>";
        
    } else {
        echo "<p>⚠️ No UTC timestamp to convert. Just updating timezone.</p>";
        
        $updateStmt = $pdo->prepare("
            UPDATE users 
            SET last_login_timezone = ?,
                updated_at = NOW()
            WHERE id = ?
        ");
        $updateStmt->execute([$timezone, $user['id']]);
        
        echo "<p>✅ Timezone updated to: {$timezone}</p>";
    }
    
} catch (Exception $e) {
    echo "<p>❌ Error: " . $e->getMessage() . "</p>";
}
?>

<style>
body { font-family: Arial, sans-serif; margin: 40px; }
h2 { color: #2C5530; }
ul { background: #f5f5f5; padding: 15px; border-radius: 4px; }
</style> 