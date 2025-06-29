<?php
/**
 * Wolthers & Associates - Enhanced Authentication Login Endpoint
 * trips.wolthers.com/api/auth/login.php
 * 
 * Handles multiple authentication methods:
 * 1. Microsoft Office 365 login
 * 2. Regular user account login (email/password)
 * 3. Trip-specific passcode access (limited access)
 */

require_once '../config.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

/**
 * Update user login timestamp with timezone awareness
 */
function updateLoginTimestamp($pdo, $userId, $userTimezone) {
    try {
        // Get current UTC timestamp
        $utcDateTime = new DateTime('now', new DateTimeZone('UTC'));
        $utcTimestamp = $utcDateTime->format('Y-m-d H:i:s');
        
        // Calculate user's local time
        $localTimestamp = $utcTimestamp; // Default fallback
        try {
            $localDateTime = new DateTime('now', new DateTimeZone($userTimezone));
            $localTimestamp = $localDateTime->format('Y-m-d H:i:s');
        } catch (Exception $tzError) {
            // Invalid timezone, use UTC as fallback
            error_log("Invalid timezone '$userTimezone' for user $userId: " . $tzError->getMessage());
            $userTimezone = 'UTC'; // Reset to UTC if invalid
        }
        
        // Update with full timezone info
        $stmt = $pdo->prepare("
            UPDATE users 
            SET last_login_at = ?, 
                last_login_at_utc = ?, 
                last_login_timezone = ?, 
                login_attempts = 0,
                updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$localTimestamp, $utcTimestamp, $userTimezone, $userId]);
        
        // Log for debugging
        error_log("Login timestamp updated for user $userId: Local=$localTimestamp ($userTimezone), UTC=$utcTimestamp");
        
        return true;
    } catch (Exception $e) {
        // Fallback for databases without the new columns
        try {
            $fallbackStmt = $pdo->prepare("UPDATE users SET updated_at = NOW() WHERE id = ?");
            $fallbackStmt->execute([$userId]);
            error_log("Login timestamp fallback used for user $userId: " . $e->getMessage());
        } catch (Exception $fallbackError) {
            error_log("Login timestamp update completely failed for user $userId: " . $fallbackError->getMessage());
        }
        return false;
    }
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST; // Fallback to form data
}

$loginType = $input['login_type'] ?? 'regular'; // 'office365', 'regular', 'passcode'
$username = trim($input['username'] ?? '');
$password = trim($input['password'] ?? '');
$accessToken = $input['access_token'] ?? null; // For Office 365
$tripCode = trim($input['trip_code'] ?? ''); // For passcode access
$userTimezone = $input['timezone'] ?? 'UTC'; // User's timezone from frontend

// Validate input based on login type
if ($loginType === 'office365' && !$accessToken) {
    sendError('Office 365 access token is required');
} elseif ($loginType === 'passcode' && !$tripCode) {
    sendError('Trip passcode is required');
} elseif ($loginType === 'regular' && (empty($username) || empty($password))) {
    sendError('Username and password are required');
}

try {
    $pdo = getDBConnection();
    
    // 1. Microsoft Office 365 Authentication
    if ($loginType === 'office365') {
        $userInfo = validateOffice365Token($accessToken);
        if ($userInfo) {
            // Check if user exists in our system (any role)
            $stmt = $pdo->prepare("SELECT id, name, email, role, office365_id FROM users WHERE email = ? AND status = 'active'");
            $stmt->execute([$userInfo['email']]);
            $user = $stmt->fetch();
            
            if (!$user) {
                // Check if this email has been invited or received a trip itinerary
                // 1. Check one_time_codes (login, registration, email_verification)
                $inviteStmt = $pdo->prepare("SELECT id FROM one_time_codes WHERE email = ? AND purpose IN ('login', 'registration', 'email_verification') LIMIT 1");
                $inviteStmt->execute([$userInfo['email']]);
                $invited = $inviteStmt->fetch();
                // 2. Check trip_participants
                $tripStmt = $pdo->prepare("SELECT id FROM trip_participants WHERE email = ? LIMIT 1");
                $tripStmt->execute([$userInfo['email']]);
                $isTripParticipant = $tripStmt->fetch();
                
                if ($invited || $isTripParticipant) {
                                    // Auto-create user as partner with timezone-aware timestamps
                $utcNow = date('Y-m-d H:i:s');
                try {
                    $stmt = $pdo->prepare("
                        INSERT INTO users (email, name, role, office365_id, status, last_login_at, last_login_at_utc, last_login_timezone) 
                        VALUES (?, ?, 'partner', ?, 'active', ?, ?, ?)
                    ");
                    $stmt->execute([$userInfo['email'], $userInfo['name'], $userInfo['id'], $utcNow, $utcNow, $userTimezone]);
                } catch (Exception $e) {
                    // Fallback for databases without new columns
                    $stmt = $pdo->prepare("
                        INSERT INTO users (email, name, role, office365_id, status) 
                        VALUES (?, ?, 'partner', ?, 'active')
                    ");
                    $stmt->execute([$userInfo['email'], $userInfo['name'], $userInfo['id']]);
                }
                    $userId = $pdo->lastInsertId();
                    $user = [
                        'id' => $userId,
                        'name' => $userInfo['name'],
                        'email' => $userInfo['email'],
                        'role' => 'partner'
                    ];
                } else {
                    sendError('No account found for this Microsoft account. Please register or contact support.', 404);
                }
            } else {
                // Update existing user with Office 365 ID and timezone-aware last login
                $updateStmt = $pdo->prepare("
                    UPDATE users 
                    SET office365_id = ?
                    WHERE id = ?
                ");
                $updateStmt->execute([$userInfo['id'], $user['id']]);
                
                // Update login timestamp with timezone awareness
                updateLoginTimestamp($pdo, $user['id'], $userTimezone);
            }
            
            logActivity($user['id'], 'office365_login', ['email' => $userInfo['email']]);
            
            // Create session
            session_start();
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_email'] = $user['email'];
            $_SESSION['user_name'] = $user['name'];
            $_SESSION['user_role'] = $user['role'];
            $_SESSION['login_time'] = time();
            $_SESSION['auth_type'] = 'office365';
            
            sendResponse([
                'success' => true,
                'user' => [
                    'id' => $user['id'],
                    'name' => $user['name'],
                    'email' => $user['email'],
                    'role' => $user['role']
                ],
                'auth_type' => 'office365',
                'session_id' => session_id()
            ]);
        } else {
            sendError('Invalid Office 365 token', 401);
        }
    }
    
    // 2. Regular User Login (email/password)
    elseif ($loginType === 'regular' && filter_var($username, FILTER_VALIDATE_EMAIL)) {
        $stmt = $pdo->prepare("SELECT id, name, email, role, password_hash FROM users WHERE email = ? AND status = 'active'");
        $stmt->execute([$username]);
        $user = $stmt->fetch();
        
        if ($user && ($user['password_hash'] === null || password_verify($password, $user['password_hash']))) {
            // Update login timestamp with timezone awareness
            updateLoginTimestamp($pdo, $user['id'], $userTimezone);
            
            // For development: if no password hash, any password works
            logActivity($user['id'], 'regular_login', ['email' => $username]);
            
            // Create session
            session_start();
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_email'] = $user['email'];
            $_SESSION['user_name'] = $user['name'];
            $_SESSION['user_role'] = $user['role'];
            $_SESSION['login_time'] = time();
            $_SESSION['auth_type'] = 'regular';
            
            sendResponse([
                'success' => true,
                'user' => [
                    'id' => $user['id'],
                    'name' => $user['name'],
                    'email' => $user['email'],
                    'role' => $user['role']
                ],
                'auth_type' => 'regular',
                'session_id' => session_id()
            ]);
        }
    }
    
    // 3. Trip-Specific Passcode Access (Limited to specific trip only)
    elseif ($loginType === 'passcode') {
        $stmt = $pdo->prepare("
            SELECT t.*, t.access_code as trip_access_code
            FROM trips t 
            WHERE t.access_code = ? AND t.is_public = 1 AND t.status IN ('planned', 'active')
        ");
        $stmt->execute([$tripCode]);
        $trip = $stmt->fetch();
        
        if ($trip) {
            logActivity(null, 'passcode_login', ['trip_code' => $tripCode, 'trip_id' => $trip['id']]);
            
            // Create limited session for this trip only
            session_start();
            $_SESSION['trip_id'] = $trip['id'];
            $_SESSION['trip_title'] = $trip['title'];
            $_SESSION['trip_access_code'] = $tripCode;
            $_SESSION['login_time'] = time();
            $_SESSION['auth_type'] = 'passcode';
            $_SESSION['access_level'] = 'trip_only'; // Limited access flag
            
            sendResponse([
                'success' => true,
                'user' => [
                    'name' => 'Trip Visitor',
                    'role' => 'visitor'
                ],
                'auth_type' => 'passcode',
                'access_level' => 'trip_only',
                'trip_access' => [
                    'trip_id' => $trip['id'],
                    'trip_title' => $trip['title'],
                    'trip_dates' => $trip['start_date'] . ' to ' . $trip['end_date']
                ],
                'restrictions' => [
                    'cannot_access_other_trips' => true,
                    'cannot_see_past_trips' => true,
                    'read_only_access' => true
                ],
                'session_id' => session_id()
            ]);
        }
    }
    
    // If we get here, authentication failed
    logActivity(null, 'login_failed', ['username' => $username]);
    sendError('Invalid credentials', 401);
    
} catch (Exception $e) {
    if (DEBUG_MODE) {
        sendError('Login error: ' . $e->getMessage(), 500);
    } else {
        sendError('Authentication failed', 500);
    }
}
?> 