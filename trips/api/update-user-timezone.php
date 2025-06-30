<?php
/**
 * Update User Timezone Endpoint
 * trips.wolthers.com/api/update-user-timezone.php
 * 
 * Automatically updates user timezone data during normal site usage
 * Called by frontend JavaScript periodically or on important actions
 */

require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

try {
    // Get input data
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        sendError('Invalid JSON input');
    }
    
    $userTimezone = $input['timezone'] ?? null;
    $userId = $input['user_id'] ?? null;
    
    if (!$userTimezone || !$userId) {
        sendError('Timezone and user_id are required');
    }
    
    // Validate timezone
    try {
        new DateTimeZone($userTimezone);
    } catch (Exception $e) {
        sendError('Invalid timezone: ' . $e->getMessage());
    }
    
    $pdo = getDBConnection();
    
    // Check if user exists and get current timezone
    $stmt = $pdo->prepare("SELECT last_login_timezone, last_login_at, last_login_at_utc FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    
    if (!$user) {
        sendError('User not found', 404);
    }
    
    // Only update if timezone has changed or is currently UTC/NULL
    $needsUpdate = false;
    $currentTz = $user['last_login_timezone'];
    
    if ($currentTz === null || $currentTz === 'UTC' || $currentTz !== $userTimezone) {
        $needsUpdate = true;
    }
    
    if ($needsUpdate) {
        // Update user's timezone and recalculate login timestamps if they exist
        if ($user['last_login_at_utc']) {
            // Recalculate local time from existing UTC timestamp
            try {
                $utcDateTime = new DateTime($user['last_login_at_utc'], new DateTimeZone('UTC'));
                $utcDateTime->setTimezone(new DateTimeZone($userTimezone));
                $localTimestamp = $utcDateTime->format('Y-m-d H:i:s');
                
                // Update both timezone and corrected local timestamp
                $updateStmt = $pdo->prepare("
                    UPDATE users 
                    SET last_login_timezone = ?, 
                        last_login_at = ?,
                        updated_at = NOW()
                    WHERE id = ?
                ");
                $updateStmt->execute([$userTimezone, $localTimestamp, $userId]);
                
                error_log("Timezone updated for user $userId: $currentTz -> $userTimezone, Local time corrected to: $localTimestamp");
                
                sendResponse([
                    'success' => true,
                    'message' => 'Timezone updated and login timestamps corrected',
                    'timezone_updated' => [
                        'from' => $currentTz,
                        'to' => $userTimezone,
                        'local_time_corrected' => $localTimestamp,
                        'utc_time_unchanged' => $user['last_login_at_utc']
                    ]
                ]);
                
            } catch (Exception $e) {
                error_log("Failed to recalculate timezone for user $userId: " . $e->getMessage());
                sendError('Failed to recalculate timestamps: ' . $e->getMessage());
            }
        } else {
            // Just update timezone (no existing login timestamps to correct)
            $updateStmt = $pdo->prepare("
                UPDATE users 
                SET last_login_timezone = ?,
                    updated_at = NOW()
                WHERE id = ?
            ");
            $updateStmt->execute([$userTimezone, $userId]);
            
            error_log("Timezone updated for user $userId: $currentTz -> $userTimezone (no existing timestamps to correct)");
            
            sendResponse([
                'success' => true,
                'message' => 'Timezone updated',
                'timezone_updated' => [
                    'from' => $currentTz,
                    'to' => $userTimezone
                ]
            ]);
        }
    } else {
        sendResponse([
            'success' => true,
            'message' => 'Timezone already correct',
            'current_timezone' => $currentTz
        ]);
    }
    
} catch (Exception $e) {
    error_log("Update timezone error: " . $e->getMessage());
    if (DEBUG_MODE) {
        sendError('Update error: ' . $e->getMessage(), 500);
    } else {
        sendError('Update failed', 500);
    }
}
?> 