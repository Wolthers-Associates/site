<?php
/**
 * Test Companies API Debug Script
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'database.php';

header('Content-Type: application/json');

try {
    echo "Testing database connection...\n";
    
    $pdo = getDBConnection();
    echo "✅ Database connection successful\n";
    
    // Check if companies table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'companies'");
    $tableExists = $stmt->rowCount() > 0;
    
    if ($tableExists) {
        echo "✅ Companies table exists\n";
        
        // Get table structure
        $stmt = $pdo->query("DESCRIBE companies");
        $columns = $stmt->fetchAll();
        echo "📋 Table structure:\n";
        foreach ($columns as $column) {
            echo "  - {$column['Field']} ({$column['Type']})\n";
        }
        
        // Count companies
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM companies");
        $count = $stmt->fetch()['count'];
        echo "📊 Total companies: {$count}\n";
        
        // Get all companies
        $stmt = $pdo->query("SELECT * FROM companies ORDER BY id");
        $companies = $stmt->fetchAll();
        echo "📄 Companies data:\n";
        foreach ($companies as $company) {
            echo "  ID: {$company['id']}\n";
            echo "  Full Name: {$company['full_name']}\n";
            echo "  Fantasy Name: {$company['fantasy_name']}\n";
            echo "  Address: {$company['address']}\n";
            echo "  Registration: {$company['registration_number']}\n";
            echo "  Status: {$company['status']}\n";
            echo "  ---\n";
        }
        
    } else {
        echo "❌ Companies table does not exist\n";
        
        // Try to create the table
        echo "🔧 Attempting to create companies table...\n";
        
        $sql = "CREATE TABLE companies (
            id INT AUTO_INCREMENT PRIMARY KEY,
            full_name VARCHAR(255) NOT NULL,
            fantasy_name VARCHAR(255),
            address TEXT,
            city VARCHAR(100),
            state VARCHAR(100),
            country VARCHAR(100),
            postal_code VARCHAR(20),
            phone VARCHAR(50),
            email VARCHAR(255),
            company_type ENUM('importer', 'exporter', 'roaster', 'distributor', 'retailer', 'consultant', 'other') NOT NULL DEFAULT 'other',
            registration_number VARCHAR(100),
            tax_id VARCHAR(100),
            logo_url VARCHAR(500),
            status ENUM('active', 'inactive', 'pending') DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_full_name (full_name),
            INDEX idx_company_type (company_type),
            INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        
        $pdo->exec($sql);
        echo "✅ Companies table created successfully\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
?> 