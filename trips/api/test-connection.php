<?php
/**
 * Database Connection Test Script
 * trips.wolthers.com - Test database connectivity
 * 
 * Access this file via: https://your-domain/trips/api/test-connection.php
 * DELETE THIS FILE AFTER TESTING for security!
 */

// Load the configuration
require_once 'config.php';

echo "<h1>🧪 Database Connection Test</h1>";
echo "<p><strong>Testing connection to:</strong> " . DB_NAME . "</p>";

try {
    // Test database connection
    $pdo = getDBConnection();
    
    echo "<div style='color: green; background: #e8f5e8; padding: 10px; border-radius: 5px; margin: 10px 0;'>";
    echo "✅ <strong>SUCCESS!</strong> Database connection established!<br>";
    echo "📊 <strong>Host:</strong> " . DB_HOST . "<br>";
    echo "🗄️ <strong>Database:</strong> " . DB_NAME . "<br>";
    echo "👤 <strong>User:</strong> " . DB_USER . "<br>";
    echo "🌍 <strong>Environment:</strong> " . ENVIRONMENT . "<br>";
    echo "</div>";
    
    // Test basic query
    echo "<h2>📋 Testing Database Tables</h2>";
    
    $tables = [
        'users' => 'SELECT COUNT(*) as count FROM users',
        'trips' => 'SELECT COUNT(*) as count FROM trips',
        'trip_itinerary' => 'SELECT COUNT(*) as count FROM trip_itinerary',
        'trip_participants' => 'SELECT COUNT(*) as count FROM trip_participants',
        'partner_access' => 'SELECT COUNT(*) as count FROM partner_access',
        'trip_logistics' => 'SELECT COUNT(*) as count FROM trip_logistics'
    ];
    
    foreach ($tables as $table => $query) {
        try {
            $stmt = $pdo->query($query);
            $result = $stmt->fetch();
            echo "<div style='background: #f0f8ff; padding: 5px; margin: 5px 0; border-left: 3px solid #007cba;'>";
            echo "📊 <strong>{$table}</strong>: {$result['count']} records";
            echo "</div>";
        } catch (Exception $e) {
            echo "<div style='color: red; background: #ffe8e8; padding: 5px; margin: 5px 0; border-left: 3px solid #d32f2f;'>";
            echo "❌ <strong>{$table}</strong>: Error - " . $e->getMessage();
            echo "</div>";
        }
    }
    
    // Test sample data
    echo "<h2>👥 Sample Users</h2>";
    try {
        $stmt = $pdo->query("SELECT name, email, role FROM users LIMIT 5");
        $users = $stmt->fetchAll();
        
        if ($users) {
            echo "<table style='border-collapse: collapse; width: 100%; margin: 10px 0;'>";
            echo "<tr style='background: #f5f5f5;'><th style='border: 1px solid #ddd; padding: 8px;'>Name</th><th style='border: 1px solid #ddd; padding: 8px;'>Email</th><th style='border: 1px solid #ddd; padding: 8px;'>Role</th></tr>";
            foreach ($users as $user) {
                echo "<tr>";
                echo "<td style='border: 1px solid #ddd; padding: 8px;'>{$user['name']}</td>";
                echo "<td style='border: 1px solid #ddd; padding: 8px;'>{$user['email']}</td>";
                echo "<td style='border: 1px solid #ddd; padding: 8px;'>{$user['role']}</td>";
                echo "</tr>";
            }
            echo "</table>";
        } else {
            echo "<p>No users found. Sample data may not be inserted yet.</p>";
        }
    } catch (Exception $e) {
        echo "<p style='color: red;'>Error fetching users: " . $e->getMessage() . "</p>";
    }
    
    // Test sample trips
    echo "<h2>✈️ Sample Trips</h2>";
    try {
        $stmt = $pdo->query("SELECT title, start_date, end_date, status FROM trips LIMIT 3");
        $trips = $stmt->fetchAll();
        
        if ($trips) {
            echo "<table style='border-collapse: collapse; width: 100%; margin: 10px 0;'>";
            echo "<tr style='background: #f5f5f5;'><th style='border: 1px solid #ddd; padding: 8px;'>Title</th><th style='border: 1px solid #ddd; padding: 8px;'>Start Date</th><th style='border: 1px solid #ddd; padding: 8px;'>End Date</th><th style='border: 1px solid #ddd; padding: 8px;'>Status</th></tr>";
            foreach ($trips as $trip) {
                echo "<tr>";
                echo "<td style='border: 1px solid #ddd; padding: 8px;'>{$trip['title']}</td>";
                echo "<td style='border: 1px solid #ddd; padding: 8px;'>{$trip['start_date']}</td>";
                echo "<td style='border: 1px solid #ddd; padding: 8px;'>{$trip['end_date']}</td>";
                echo "<td style='border: 1px solid #ddd; padding: 8px;'>{$trip['status']}</td>";
                echo "</tr>";
            }
            echo "</table>";
        } else {
            echo "<p>No trips found. Sample data may not be inserted yet.</p>";
        }
    } catch (Exception $e) {
        echo "<p style='color: red;'>Error fetching trips: " . $e->getMessage() . "</p>";
    }
    
} catch (Exception $e) {
    echo "<div style='color: red; background: #ffe8e8; padding: 10px; border-radius: 5px; margin: 10px 0;'>";
    echo "❌ <strong>CONNECTION FAILED!</strong><br>";
    echo "Error: " . $e->getMessage() . "<br>";
    echo "Please check your database credentials in secure-config.php";
    echo "</div>";
}

echo "<hr>";
echo "<p><strong>⚠️ IMPORTANT:</strong> Delete this test file after verification for security!</p>";
echo "<p><em>File location: trips/api/test-connection.php</em></p>";
?> 