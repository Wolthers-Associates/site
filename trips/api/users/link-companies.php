<?php
/**
 * User-Company Linking Script
 * Links existing users with appropriate companies
 */

// Include database configuration
require_once '../database.php';

// Set content type to JSON
header('Content-Type: application/json');

// Enable CORS for development
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

try {
    $pdo = getDBConnection();
    
    // Get all companies for reference
    $companiesStmt = $pdo->query("SELECT id, full_name, fantasy_name FROM companies ORDER BY full_name");
    $companies = $companiesStmt->fetchAll();
    
    // Get all users without company assignments
    $usersStmt = $pdo->query("
        SELECT id, name, email, role, company_id, company_role, can_see_company_trips 
        FROM users 
        ORDER BY name
    ");
    $users = $usersStmt->fetchAll();
    
    $method = $_SERVER['REQUEST_METHOD'];
    
    if ($method === 'GET') {
        // Return current state for review
        sendResponse([
            'success' => true,
            'companies' => $companies,
            'users' => $users,
            'unlinked_users' => array_filter($users, function($user) {
                return empty($user['company_id']);
            }),
            'linked_users' => array_filter($users, function($user) {
                return !empty($user['company_id']);
            }),
            'statistics' => [
                'total_companies' => count($companies),
                'total_users' => count($users),
                'unlinked_users' => count(array_filter($users, function($user) {
                    return empty($user['company_id']);
                })),
                'linked_users' => count(array_filter($users, function($user) {
                    return !empty($user['company_id']);
                }))
            ]
        ]);
    }
    
    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $action = $input['action'] ?? '';
        
        switch ($action) {
            case 'auto_link':
                handleAutoLink($pdo, $companies);
                break;
                
            case 'manual_link':
                handleManualLink($pdo, $input);
                break;
                
            case 'bulk_assign':
                handleBulkAssign($pdo, $input);
                break;
                
            default:
                sendError('Invalid action specified');
        }
    }
    
} catch (Exception $e) {
    sendError('Database error: ' . $e->getMessage(), 500);
}

/**
 * Auto-link users based on email domains and patterns
 */
function handleAutoLink($pdo, $companies) {
    $linked = 0;
    $errors = [];
    
    // Get Wolthers & Associates company ID
    $wolthersId = null;
    foreach ($companies as $company) {
        if (stripos($company['full_name'], 'Wolthers') !== false) {
            $wolthersId = $company['id'];
            break;
        }
    }
    
    if (!$wolthersId) {
        sendError('Wolthers & Associates company not found');
    }
    
    try {
        $pdo->beginTransaction();
        
        // Auto-link Wolthers team members
        $wolthersUpdate = $pdo->prepare("
            UPDATE users SET 
                company_id = ?,
                company_role = CASE 
                    WHEN role = 'admin' THEN 'admin'
                    WHEN email LIKE '%@wolthers.com%' THEN 'senior'
                    ELSE 'senior'
                END,
                can_see_company_trips = CASE 
                    WHEN role = 'admin' THEN 1
                    ELSE 1
                END
            WHERE (email LIKE '%@wolthers.com%' OR role = 'admin' OR name LIKE '%Wolthers%' OR name LIKE '%Daniel%')
            AND company_id IS NULL
        ");
        
        $wolthersUpdate->execute([$wolthersId]);
        $linked += $wolthersUpdate->rowCount();
        
        // Auto-link users based on email domains to appropriate companies
        $domainMappings = [
            'mitsui.com' => 'Mitsui & Co. Ltd.',
            'cce.com.co' => 'Colombian Coffee Exports',
            'premiumroasters.com' => 'Premium Roasters'
        ];
        
        foreach ($domainMappings as $domain => $companyName) {
            $companyId = null;
            foreach ($companies as $company) {
                if (stripos($company['full_name'], $companyName) !== false) {
                    $companyId = $company['id'];
                    break;
                }
            }
            
            if ($companyId) {
                $domainUpdate = $pdo->prepare("
                    UPDATE users SET 
                        company_id = ?,
                        company_role = 'staff',
                        can_see_company_trips = 0
                    WHERE email LIKE ? AND company_id IS NULL
                ");
                
                $domainUpdate->execute([$companyId, "%@{$domain}%"]);
                $linked += $domainUpdate->rowCount();
            }
        }
        
        $pdo->commit();
        
        // Get updated statistics
        $statsStmt = $pdo->query("
            SELECT 
                COUNT(*) as total_users,
                COUNT(company_id) as linked_users,
                COUNT(*) - COUNT(company_id) as unlinked_users
            FROM users
        ");
        $stats = $statsStmt->fetch();
        
        sendResponse([
            'success' => true,
            'message' => "Successfully auto-linked {$linked} users to companies",
            'linked_count' => $linked,
            'statistics' => $stats,
            'errors' => $errors
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        sendError('Failed to auto-link users: ' . $e->getMessage());
    }
}

/**
 * Manually link a specific user to a company
 */
function handleManualLink($pdo, $input) {
    $userId = $input['user_id'] ?? null;
    $companyId = $input['company_id'] ?? null;
    $companyRole = $input['company_role'] ?? 'staff';
    $canSeeTrips = $input['can_see_company_trips'] ?? false;
    
    if (!$userId || !$companyId) {
        sendError('User ID and Company ID are required');
    }
    
    try {
        $stmt = $pdo->prepare("
            UPDATE users SET 
                company_id = ?,
                company_role = ?,
                can_see_company_trips = ?
            WHERE id = ?
        ");
        
        $stmt->execute([$companyId, $companyRole, $canSeeTrips ? 1 : 0, $userId]);
        
        if ($stmt->rowCount() > 0) {
            sendResponse([
                'success' => true,
                'message' => 'User successfully linked to company'
            ]);
        } else {
            sendError('User not found or no changes made');
        }
        
    } catch (Exception $e) {
        sendError('Failed to link user: ' . $e->getMessage());
    }
}

/**
 * Bulk assign multiple users to a company
 */
function handleBulkAssign($pdo, $input) {
    $userIds = $input['user_ids'] ?? [];
    $companyId = $input['company_id'] ?? null;
    $companyRole = $input['company_role'] ?? 'staff';
    $canSeeTrips = $input['can_see_company_trips'] ?? false;
    
    if (empty($userIds) || !$companyId) {
        sendError('User IDs and Company ID are required');
    }
    
    try {
        $pdo->beginTransaction();
        
        $placeholders = str_repeat('?,', count($userIds) - 1) . '?';
        $stmt = $pdo->prepare("
            UPDATE users SET 
                company_id = ?,
                company_role = ?,
                can_see_company_trips = ?
            WHERE id IN ($placeholders)
        ");
        
        $params = array_merge([$companyId, $companyRole, $canSeeTrips ? 1 : 0], $userIds);
        $stmt->execute($params);
        
        $updated = $stmt->rowCount();
        $pdo->commit();
        
        sendResponse([
            'success' => true,
            'message' => "Successfully assigned {$updated} users to company",
            'updated_count' => $updated
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        sendError('Failed to bulk assign users: ' . $e->getMessage());
    }
}
?> 