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
  `password_hash` varchar(255) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `last_login_at` timestamp NULL DEFAULT NULL,
  `last_login_at_utc` timestamp NULL DEFAULT NULL,
  `last_login_timezone` varchar(50) DEFAULT NULL,
  `login_attempts` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `office365_id` (`office365_id`),
  KEY `role` (`role`),
  KEY `status` (`status`),
  KEY `last_login_at` (`last_login_at`),
  KEY `login_attempts` (`login_attempts`)
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
-- Table structure for vehicles
-- --------------------------------------------------------

CREATE TABLE `vehicles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `make` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL,
  `year` int(4) DEFAULT NULL,
  `license_plate` varchar(20) DEFAULT NULL,
  `vehicle_type` enum('suv','pickup','van','car','bus') NOT NULL DEFAULT 'suv',
  `capacity` int(11) NOT NULL DEFAULT 4,
  `status` enum('available','maintenance','retired') NOT NULL DEFAULT 'available',
  `location` varchar(255) DEFAULT NULL,
  `color` varchar(50) DEFAULT NULL,
  `fuel_type` enum('gasoline','diesel','hybrid','electric') DEFAULT 'gasoline',
  `transmission` enum('manual','automatic','cvt') DEFAULT 'automatic',
  `engine_size` varchar(20) DEFAULT NULL,
  `vin` varchar(50) DEFAULT NULL,
  `purchase_date` date DEFAULT NULL,
  `purchase_price` decimal(10,2) DEFAULT NULL,
  `current_mileage` int(11) DEFAULT 0,
  `insurance_company` varchar(255) DEFAULT NULL,
  `insurance_policy_number` varchar(100) DEFAULT NULL,
  `insurance_start_date` date DEFAULT NULL,
  `insurance_end_date` date DEFAULT NULL,
  `insurance_amount` decimal(10,2) DEFAULT NULL,
  `last_revision_date` date DEFAULT NULL,
  `next_revision_due` date DEFAULT NULL,
  `revision_interval_months` int(11) DEFAULT 6,
  `maintenance_start_date` date DEFAULT NULL,
  `maintenance_end_date` date DEFAULT NULL,
  `maintenance_reason` varchar(255) DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `license_plate` (`license_plate`),
  UNIQUE KEY `vin` (`vin`),
  KEY `vehicle_type` (`vehicle_type`),
  KEY `status` (`status`),
  KEY `location` (`location`),
  KEY `insurance_end_date` (`insurance_end_date`),
  KEY `next_revision_due` (`next_revision_due`),
  KEY `maintenance_dates` (`maintenance_start_date`, `maintenance_end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for staff assignments
-- --------------------------------------------------------

CREATE TABLE `trip_staff_assignments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `trip_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role` enum('guide','driver','coordinator','translator','specialist') NOT NULL DEFAULT 'guide',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_staff_trip_role` (`trip_id`, `user_id`, `role`),
  KEY `trip_id` (`trip_id`),
  KEY `user_id` (`user_id`),
  KEY `start_date` (`start_date`),
  KEY `end_date` (`end_date`),
  CONSTRAINT `trip_staff_assignments_ibfk_1` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`) ON DELETE CASCADE,
  CONSTRAINT `trip_staff_assignments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for vehicle assignments
-- --------------------------------------------------------

CREATE TABLE `trip_vehicle_assignments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `trip_id` int(11) NOT NULL,
  `vehicle_id` int(11) NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `driver_user_id` int(11) DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `trip_id` (`trip_id`),
  KEY `vehicle_id` (`vehicle_id`),
  KEY `driver_user_id` (`driver_user_id`),
  KEY `start_date` (`start_date`),
  KEY `end_date` (`end_date`),
  CONSTRAINT `trip_vehicle_assignments_ibfk_1` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`) ON DELETE CASCADE,
  CONSTRAINT `trip_vehicle_assignments_ibfk_2` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `trip_vehicle_assignments_ibfk_3` FOREIGN KEY (`driver_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for vehicle maintenance logs
-- --------------------------------------------------------

CREATE TABLE `vehicle_maintenance_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `vehicle_id` int(11) NOT NULL,
  `maintenance_type` enum('routine','repair','inspection','revision','emergency') NOT NULL DEFAULT 'routine',
  `description` text NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `cost` decimal(10,2) DEFAULT NULL,
  `mileage_at_service` int(11) DEFAULT NULL,
  `service_provider` varchar(255) DEFAULT NULL,
  `invoice_number` varchar(100) DEFAULT NULL,
  `parts_replaced` text,
  `next_service_due` date DEFAULT NULL,
  `status` enum('scheduled','in_progress','completed','cancelled') NOT NULL DEFAULT 'scheduled',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `vehicle_id` (`vehicle_id`),
  KEY `maintenance_type` (`maintenance_type`),
  KEY `start_date` (`start_date`),
  KEY `status` (`status`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `vehicle_maintenance_logs_ibfk_1` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `vehicle_maintenance_logs_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for vehicle driver logs
-- --------------------------------------------------------

CREATE TABLE `vehicle_driver_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `vehicle_id` int(11) NOT NULL,
  `driver_user_id` int(11) DEFAULT NULL,
  `driver_name` varchar(255) NOT NULL,
  `trip_id` int(11) DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `start_mileage` int(11) DEFAULT NULL,
  `end_mileage` int(11) DEFAULT NULL,
  `fuel_cost` decimal(8,2) DEFAULT NULL,
  `toll_cost` decimal(8,2) DEFAULT NULL,
  `other_expenses` decimal(8,2) DEFAULT NULL,
  `route_description` text,
  `notes` text,
  `damage_reported` tinyint(1) DEFAULT 0,
  `damage_description` text,
  `fuel_receipts` varchar(500) DEFAULT NULL,
  `expense_receipts` varchar(500) DEFAULT NULL,
  `status` enum('active','completed','pending_review') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `vehicle_id` (`vehicle_id`),
  KEY `driver_user_id` (`driver_user_id`),
  KEY `trip_id` (`trip_id`),
  KEY `start_date` (`start_date`),
  KEY `status` (`status`),
  CONSTRAINT `vehicle_driver_logs_ibfk_1` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `vehicle_driver_logs_ibfk_2` FOREIGN KEY (`driver_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `vehicle_driver_logs_ibfk_3` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`) ON DELETE SET NULL
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

-- Sample vehicles with enhanced fields
INSERT INTO `vehicles` (`make`, `model`, `year`, `license_plate`, `vehicle_type`, `capacity`, `status`, `location`, `color`, `fuel_type`, `transmission`, `engine_size`, `vin`, `purchase_date`, `current_mileage`, `insurance_company`, `insurance_policy_number`, `insurance_start_date`, `insurance_end_date`, `last_revision_date`, `next_revision_due`, `maintenance_start_date`, `maintenance_end_date`, `maintenance_reason`, `notes`) VALUES
('Toyota', 'Land Cruiser', 2022, 'ABC-1234', 'suv', 7, 'available', 'Santos Office', 'White', 'diesel', 'automatic', '3.0L', 'JT3HN86R1V0123456', '2022-03-15', 45000, 'Bradesco Seguros', 'BR-2024-001', '2024-01-01', '2024-12-31', '2024-10-15', '2025-04-15', NULL, NULL, NULL, 'Primary vehicle for coffee farm visits'),
('Toyota', 'Hilux', 2021, 'DEF-5678', 'pickup', 5, 'available', 'Santos Office', 'Silver', 'diesel', 'manual', '2.8L', 'MR0FB22G1L0234567', '2021-07-20', 78000, 'Porto Seguro', 'PS-2024-002', '2024-02-01', '2024-12-31', '2024-09-20', '2025-03-20', NULL, NULL, NULL, 'Good for rough terrain'),
('Chevrolet', 'Spin', 2020, 'GHI-9012', 'van', 8, 'available', 'São Paulo Office', 'Blue', 'gasoline', 'automatic', '1.8L', '9BWZZZ377LT345678', '2020-11-10', 92000, 'Allianz Seguros', 'AL-2024-003', '2024-03-01', '2024-12-31', '2024-08-10', '2025-02-10', NULL, NULL, NULL, 'Ideal for city tours and larger groups'),
('Honda', 'CR-V', 2019, 'JKL-3456', 'suv', 5, 'maintenance', 'Santos Office', 'Black', 'gasoline', 'cvt', '1.5L Turbo', '7FARW2H51KE456789', '2019-05-15', 115000, 'Mapfre Seguros', 'MP-2024-004', '2024-01-15', '2024-12-31', '2024-07-30', '2025-01-30', '2024-12-01', '2024-12-07', 'Brake system replacement', 'In maintenance - brake system'),
('Ford', 'Ranger', 2022, 'MNO-7890', 'pickup', 5, 'available', 'Campinas', 'Red', 'diesel', 'automatic', '2.2L', '8AFBR4LE1N6567890', '2022-01-08', 28000, 'SulAmérica', 'SA-2024-005', '2024-04-01', '2024-12-31', '2024-11-01', '2025-05-01', NULL, NULL, NULL, 'Available for inland trips');

-- Sample maintenance logs
INSERT INTO `vehicle_maintenance_logs` (`vehicle_id`, `maintenance_type`, `description`, `start_date`, `end_date`, `cost`, `mileage_at_service`, `service_provider`, `invoice_number`, `parts_replaced`, `next_service_due`, `status`, `created_by`) VALUES
(1, 'revision', 'Routine 6-month revision and oil change', '2024-10-15', '2024-10-15', 850.00, 44500, 'Toyota Authorized Service', 'TOY-2024-1001', 'Engine oil, oil filter, air filter', '2025-04-15', 'completed', 1),
(2, 'repair', 'Transmission fluid change and inspection', '2024-09-20', '2024-09-20', 650.00, 77500, 'Santos Auto Service', 'SAS-2024-0920', 'Transmission fluid, transmission filter', '2025-03-20', 'completed', 1),
(3, 'routine', 'General maintenance and tire rotation', '2024-08-10', '2024-08-10', 450.00, 91500, 'Chevrolet Service Center', 'CHV-2024-0810', 'Engine oil, brake fluid', '2025-02-10', 'completed', 3),
(4, 'repair', 'Brake system replacement', '2024-12-01', '2024-12-07', 1200.00, 115000, 'Honda Premium Service', 'HON-2024-1201', 'Brake pads, brake discs, brake fluid', '2025-06-01', 'in_progress', 1),
(5, 'revision', 'Annual inspection and service', '2024-11-01', '2024-11-01', 750.00, 27500, 'Ford Service Center', 'FOR-2024-1101', 'Engine oil, spark plugs, air filter', '2025-05-01', 'completed', 2);

-- Sample driver logs
INSERT INTO `vehicle_driver_logs` (`vehicle_id`, `driver_user_id`, `driver_name`, `trip_id`, `start_date`, `end_date`, `start_mileage`, `end_mileage`, `fuel_cost`, `toll_cost`, `other_expenses`, `route_description`, `notes`, `damage_reported`, `status`) VALUES
(1, 1, 'Daniel Wolthers', 1, '2024-11-15', '2024-11-22', 44000, 44500, 280.50, 45.00, 25.00, 'Santos - Fazenda Santa Rosa - São Paulo', 'Excellent performance during coffee farm visits', 0, 'completed'),
(2, 3, 'Maria Santos', NULL, '2024-11-10', '2024-11-12', 77000, 77300, 150.00, 20.00, 0.00, 'Santos Office - Campinas - Santos Office', 'Local supply run and equipment pickup', 0, 'completed'),
(3, 2, 'Svenn Wolthers', 2, '2024-10-20', '2024-10-27', 91000, 91500, 320.75, 35.00, 50.00, 'São Paulo - Colombian border region simulation', 'Vehicle preparation for upcoming Colombian tour', 0, 'completed'),
(5, 4, 'Paulo Veloso Junior', NULL, '2024-11-05', '2024-11-07', 27200, 27500, 180.00, 30.00, 15.00, 'Campinas - Ribeirão Preto - Campinas', 'Quality control visit to partner roasters', 0, 'completed'),
(1, 3, 'Maria Santos', NULL, '2024-12-01', NULL, 44500, NULL, NULL, NULL, NULL, 'Santos Office - Equipment maintenance facility', 'Active log for maintenance transport', 0, 'active');

-- Sample staff assignments for existing trips
INSERT INTO `trip_staff_assignments` (`trip_id`, `user_id`, `role`, `start_date`, `end_date`, `notes`) VALUES
(1, 1, 'guide', '2025-07-15', '2025-07-22', 'Lead guide for Brazil coffee origins tour'),
(1, 3, 'coordinator', '2025-07-15', '2025-07-22', 'Local coordination and logistics'),
(2, 2, 'guide', '2025-08-10', '2025-08-17', 'Guide for Colombian highland discovery'),
(3, 1, 'guide', '2025-09-05', '2025-09-12', 'Ethiopia coffee birthplace journey leader');

-- Sample vehicle assignments
INSERT INTO `trip_vehicle_assignments` (`trip_id`, `vehicle_id`, `start_date`, `end_date`, `driver_user_id`, `notes`) VALUES
(1, 1, '2025-07-15', '2025-07-22', 3, 'Toyota Land Cruiser for farm visits'),
(1, 2, '2025-07-15', '2025-07-22', NULL, 'Backup vehicle for luggage/equipment'),
(2, 3, '2025-08-10', '2025-08-17', 2, 'Chevrolet Spin for Colombian tour');

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

-- --------------------------------------------------------
-- Create views for availability checking
-- --------------------------------------------------------

CREATE VIEW staff_availability AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.department,
    tsa.trip_id,
    tsa.start_date,
    tsa.end_date,
    tsa.role,
    t.title as trip_title
FROM users u
LEFT JOIN trip_staff_assignments tsa ON u.id = tsa.user_id
LEFT JOIN trips t ON tsa.trip_id = t.id
WHERE u.role IN ('admin', 'employee');

CREATE VIEW vehicle_availability AS
SELECT 
    v.id,
    v.make,
    v.model,
    v.vehicle_type,
    v.capacity,
    v.status,
    v.location,
    tva.trip_id,
    tva.start_date,
    tva.end_date,
    t.title as trip_title,
    u.name as driver_name
FROM vehicles v
LEFT JOIN trip_vehicle_assignments tva ON v.id = tva.vehicle_id
LEFT JOIN trips t ON tva.trip_id = t.id
LEFT JOIN users u ON tva.driver_user_id = u.id; 