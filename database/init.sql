-- Wolthers & Associates - Trips Database Schema
-- Created for trips.wolthers.com
-- Development and Production Ready

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";



-- --------------------------------------------------------
-- Table structure for users (employees and admins)
-- --------------------------------------------------------

CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `role` enum('admin','employee','partner') NOT NULL DEFAULT 'employee',
  `office365_id` varchar(255) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `office365_id` (`office365_id`),
  KEY `role` (`role`),
  KEY `status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for trips
-- --------------------------------------------------------

CREATE TABLE `trips` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `slug` varchar(255) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` enum('planned','active','completed','cancelled') NOT NULL DEFAULT 'planned',
  `destination_country` varchar(100) NOT NULL,
  `destination_region` varchar(255) DEFAULT NULL,
  `trip_type` enum('coffee_origin','quality_control','business_development','client_visit') NOT NULL DEFAULT 'coffee_origin',
  `max_participants` int(11) DEFAULT NULL,
  `current_participants` int(11) DEFAULT 0,
  `created_by` int(11) NOT NULL,
  `map_image_url` varchar(500) DEFAULT NULL,
  `featured_image_url` varchar(500) DEFAULT NULL,
  `is_public` tinyint(1) NOT NULL DEFAULT 1,
  `access_code` varchar(50) DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `start_date` (`start_date`),
  KEY `status` (`status`),
  KEY `destination_country` (`destination_country`),
  KEY `trip_type` (`trip_type`),
  KEY `created_by` (`created_by`),
  KEY `access_code` (`access_code`),
  CONSTRAINT `trips_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for trip itinerary items
-- --------------------------------------------------------

CREATE TABLE `trip_itinerary` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `trip_id` int(11) NOT NULL,
  `day_number` int(11) NOT NULL,
  `date` date NOT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `location` varchar(255) DEFAULT NULL,
  `activity_type` enum('travel','farm_visit','cupping','meeting','meal','accommodation','free_time','cultural') NOT NULL DEFAULT 'farm_visit',
  `host_name` varchar(255) DEFAULT NULL,
  `host_contact` varchar(255) DEFAULT NULL,
  `transportation` varchar(255) DEFAULT NULL,
  `notes` text,
  `order_index` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `trip_id` (`trip_id`),
  KEY `day_number` (`day_number`),
  KEY `date` (`date`),
  KEY `activity_type` (`activity_type`),
  KEY `order_index` (`order_index`),
  CONSTRAINT `trip_itinerary_ibfk_1` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for trip participants
-- --------------------------------------------------------

CREATE TABLE `trip_participants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `trip_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `company` varchar(255) DEFAULT NULL,
  `role` varchar(100) DEFAULT NULL,
  `participant_type` enum('wolthers_staff','client','partner','guest') NOT NULL DEFAULT 'client',
  `dietary_restrictions` text,
  `special_requirements` text,
  `confirmed` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `trip_id` (`trip_id`),
  KEY `participant_type` (`participant_type`),
  KEY `email` (`email`),
  CONSTRAINT `trip_participants_ibfk_1` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for partner access codes
-- --------------------------------------------------------

CREATE TABLE `partner_access` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) DEFAULT NULL,
  `access_code` varchar(50) DEFAULT NULL,
  `company` varchar(255) DEFAULT NULL,
  `contact_name` varchar(255) DEFAULT NULL,
  `trip_id` int(11) DEFAULT NULL,
  `access_type` enum('email','code','both') NOT NULL DEFAULT 'email',
  `expires_at` timestamp NULL DEFAULT NULL,
  `last_accessed` timestamp NULL DEFAULT NULL,
  `access_count` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `email` (`email`),
  KEY `access_code` (`access_code`),
  KEY `trip_id` (`trip_id`),
  KEY `expires_at` (`expires_at`),
  KEY `is_active` (`is_active`),
  CONSTRAINT `partner_access_ibfk_1` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for trip logistics
-- --------------------------------------------------------

CREATE TABLE `trip_logistics` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `trip_id` int(11) NOT NULL,
  `vehicle_type` varchar(255) DEFAULT NULL,
  `vehicle_details` text,
  `driver_name` varchar(255) DEFAULT NULL,
  `driver_contact` varchar(255) DEFAULT NULL,
  `accommodation_details` text,
  `emergency_contacts` text,
  `insurance_info` text,
  `budget_estimate` decimal(10,2) DEFAULT NULL,
  `currency` varchar(3) DEFAULT 'USD',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `trip_id` (`trip_id`),
  CONSTRAINT `trip_logistics_ibfk_1` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for audit logs
-- --------------------------------------------------------

CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `table_name` varchar(100) NOT NULL,
  `record_id` int(11) DEFAULT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `action` (`action`),
  KEY `table_name` (`table_name`),
  KEY `created_at` (`created_at`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Insert sample data for development
-- --------------------------------------------------------

-- Sample users
INSERT INTO `users` (`email`, `name`, `role`, `department`, `status`) VALUES
('daniel@wolthers.com', 'Daniel Wolthers', 'admin', 'Management', 'active'),
('svenn@wolthers.com', 'Svenn Wolthers', 'admin', 'Management', 'active'),
('maria@wolthers.com', 'Maria Santos', 'employee', 'Operations', 'active'),
('paulo@wolthers.com', 'Paulo Veloso Junior', 'employee', 'Quality Control', 'active'),
('isabella@wolthers.com', 'Isabella Vargas', 'employee', 'Logistics', 'active');

-- Sample trips
INSERT INTO `trips` (`title`, `description`, `slug`, `start_date`, `end_date`, `status`, `destination_country`, `destination_region`, `trip_type`, `max_participants`, `created_by`, `access_code`, `is_public`) VALUES
('Brazil Coffee Origins Tour', 'Comprehensive tour of Brazilian coffee regions including Santos, Cerrado, and Sul de Minas', 'brazil-coffee-origins-tour', '2025-07-15', '2025-07-22', 'planned', 'Brazil', 'Santos, Cerrado, Sul de Minas', 'coffee_origin', 12, 1, 'BRAZIL2025', 1),
('Colombian Highland Discovery', 'Exploration of Colombian highland coffee farms in Huila and Nariño regions', 'colombian-highland-discovery', '2025-08-10', '2025-08-17', 'planned', 'Colombia', 'Huila, Nariño', 'coffee_origin', 10, 1, 'COLOMBIA2025', 1),
('Ethiopia Coffee Birthplace', 'Journey to the birthplace of coffee in Ethiopian highlands', 'ethiopia-coffee-birthplace', '2025-09-05', '2025-09-12', 'planned', 'Ethiopia', 'Sidamo, Yirgacheffe', 'coffee_origin', 8, 2, 'ETHIOPIA2025', 1),
('Guatemala Antigua Experience', 'Completed tour of Antigua coffee region with sustainable farming focus', 'guatemala-antigua-experience', '2024-11-10', '2024-11-17', 'completed', 'Guatemala', 'Antigua', 'coffee_origin', 15, 1, 'GUATEMALA2024', 1);

-- Sample partner access
INSERT INTO `partner_access` (`email`, `access_code`, `company`, `contact_name`, `trip_id`, `access_type`, `is_active`) VALUES
('john@company.com', NULL, 'Coffee Roasters Inc', 'John Smith', 1, 'email', 1),
('sarah@business.org', NULL, 'Business Coffee Co', 'Sarah Johnson', 2, 'email', 1),
('team@roasters.com', 'COFFEE-VIP', 'Premium Roasters', 'Team Lead', NULL, 'both', 1),
(NULL, 'BRAZIL2025', NULL, NULL, 1, 'code', 1),
(NULL, 'COLOMBIA2025', NULL, NULL, 2, 'code', 1);

-- Sample trip participants
INSERT INTO `trip_participants` (`trip_id`, `name`, `email`, `company`, `participant_type`, `confirmed`) VALUES
(1, 'Daniel Wolthers', 'daniel@wolthers.com', 'Wolthers & Associates', 'wolthers_staff', 1),
(1, 'Maria Santos', 'maria@wolthers.com', 'Wolthers & Associates', 'wolthers_staff', 1),
(1, 'John Smith', 'john@company.com', 'Coffee Roasters Inc', 'client', 1),
(2, 'Svenn Wolthers', 'svenn@wolthers.com', 'Wolthers & Associates', 'wolthers_staff', 1),
(2, 'Sarah Johnson', 'sarah@business.org', 'Business Coffee Co', 'client', 1);

-- Sample itinerary for Brazil trip
INSERT INTO `trip_itinerary` (`trip_id`, `day_number`, `date`, `start_time`, `end_time`, `title`, `description`, `location`, `activity_type`, `host_name`, `order_index`) VALUES
(1, 1, '2025-07-15', '09:00:00', '12:00:00', 'Arrival and Welcome', 'Airport pickup and hotel check-in', 'São Paulo Airport', 'travel', 'Local Guide', 1),
(1, 1, '2025-07-15', '14:00:00', '17:00:00', 'Santos Port Tour', 'Historical tour of Santos coffee port', 'Santos Port', 'cultural', 'Port Authority', 2),
(1, 2, '2025-07-16', '08:00:00', '12:00:00', 'Fazenda Santa Rosa Visit', 'Farm tour and coffee tasting', 'Cerrado Region', 'farm_visit', 'Carlos Silva', 3),
(1, 2, '2025-07-16', '14:00:00', '17:00:00', 'Processing Facility Tour', 'Coffee processing and quality control', 'Cerrado Processing Plant', 'farm_visit', 'Ana Rodriguez', 4);

-- Sample logistics
INSERT INTO `trip_logistics` (`trip_id`, `vehicle_type`, `driver_name`, `driver_contact`, `budget_estimate`, `currency`) VALUES
(1, 'Toyota Land Cruiser', 'Carlos Silva', '+55 11 99999-9999', 15000.00, 'USD'),
(2, 'Jeep Wrangler', 'Miguel Santos', '+57 300 123-4567', 12000.00, 'USD');

COMMIT;

-- --------------------------------------------------------
-- Create indexes for better performance
-- --------------------------------------------------------

-- Additional indexes for common queries
CREATE INDEX idx_trips_date_status ON trips(start_date, status);
CREATE INDEX idx_itinerary_trip_day ON trip_itinerary(trip_id, day_number, order_index);
CREATE INDEX idx_participants_trip_type ON trip_participants(trip_id, participant_type);
CREATE INDEX idx_access_email_active ON partner_access(email, is_active);
CREATE INDEX idx_access_code_active ON partner_access(access_code, is_active);

-- --------------------------------------------------------
-- Create views for common queries
-- --------------------------------------------------------

-- View for upcoming trips
CREATE VIEW upcoming_trips AS
SELECT 
    t.*,
    u.name as created_by_name,
    COUNT(DISTINCT tp.id) as participant_count,
    tl.vehicle_type,
    tl.driver_name
FROM trips t
LEFT JOIN users u ON t.created_by = u.id
LEFT JOIN trip_participants tp ON t.id = tp.trip_id
LEFT JOIN trip_logistics tl ON t.id = tl.trip_id
WHERE t.status IN ('planned', 'active') 
    AND t.start_date >= CURDATE()
GROUP BY t.id
ORDER BY t.start_date ASC;

-- View for trip summary with itinerary count
CREATE VIEW trip_summary AS
SELECT 
    t.*,
    u.name as created_by_name,
    COUNT(DISTINCT tp.id) as participant_count,
    COUNT(DISTINCT ti.id) as itinerary_items,
    tl.vehicle_type,
    tl.driver_name,
    tl.budget_estimate
FROM trips t
LEFT JOIN users u ON t.created_by = u.id
LEFT JOIN trip_participants tp ON t.id = tp.trip_id AND tp.confirmed = 1
LEFT JOIN trip_itinerary ti ON t.id = ti.trip_id
LEFT JOIN trip_logistics tl ON t.id = tl.trip_id
GROUP BY t.id
ORDER BY t.start_date DESC; 