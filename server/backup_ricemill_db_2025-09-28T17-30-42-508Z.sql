-- Database backup for ricemill_db
-- Created at: 2025-09-28T17:30:42.731Z

-- Table: admin_users
DROP TABLE IF EXISTS `admin_users`;
CREATE TABLE `admin_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `role` enum('super_admin','admin') DEFAULT 'admin',
  `is_active` tinyint(1) DEFAULT '1',
  `last_login` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data for table: admin_users
INSERT INTO `admin_users` (`id`, `username`, `email`, `password`, `full_name`, `role`, `is_active`, `last_login`, `created_at`, `updated_at`) VALUES ('1', 'superadmin', 'admin@ricemill.com', '$2b$12$taAIWli6Sk9tPiT4EUicIeA8t8qQVVlAFAOTbZtC/1B40Z2P2DCte', 'Super Administrator', 'super_admin', '1', 'Sun Sep 28 2025 16:55:22 GMT+0530 (India Standard Time)', 'Tue Aug 12 2025 19:29:50 GMT+0530 (India Standard Time)', 'Sun Sep 28 2025 16:55:22 GMT+0530 (India Standard Time)');
INSERT INTO `admin_users` (`id`, `username`, `email`, `password`, `full_name`, `role`, `is_active`, `last_login`, `created_at`, `updated_at`) VALUES ('2', 'sathira123', 'sathiradissanayaka45@gmail.com', '$2b$12$bzeulKQW3Mz.LgwX9h1SduUtizRkJB.6kc6R1JIpugyMOSz27wpuu', 'Sathira Dissanayaka', 'admin', '1', NULL, 'Tue Aug 12 2025 20:05:52 GMT+0530 (India Standard Time)', 'Tue Aug 12 2025 20:05:52 GMT+0530 (India Standard Time)');
INSERT INTO `admin_users` (`id`, `username`, `email`, `password`, `full_name`, `role`, `is_active`, `last_login`, `created_at`, `updated_at`) VALUES ('3', 'Ravitha', 'ravitha.wathsala@gmail.com', '$2b$12$f/Ijt5Muj/RgV3vcawaoTuN.RqPUSDnWFIh0t.EPGdiXO608oDnly', 'Ravitha Wathsala', 'super_admin', '1', NULL, 'Mon Aug 18 2025 17:53:10 GMT+0530 (India Standard Time)', 'Mon Aug 18 2025 17:53:10 GMT+0530 (India Standard Time)');
INSERT INTO `admin_users` (`id`, `username`, `email`, `password`, `full_name`, `role`, `is_active`, `last_login`, `created_at`, `updated_at`) VALUES ('4', 'sathira', 'sathiradissanayaka@gmail.com', '$2b$12$nr4u7Q66vsTDvZnkmz/mtuMmd3Nc2cq2YOy0sjR691k5Tor2dD0bG', 'Sathira Dissanayaka', 'super_admin', '1', NULL, 'Sun Sep 28 2025 16:56:42 GMT+0530 (India Standard Time)', 'Sun Sep 28 2025 16:56:42 GMT+0530 (India Standard Time)');

-- Table: boiling_completions
DROP TABLE IF EXISTS `boiling_completions`;
CREATE TABLE `boiling_completions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `boiling_record_id` int NOT NULL,
  `returned_quantity_kg` decimal(10,2) NOT NULL,
  `missing_quantity_kg` decimal(10,2) NOT NULL,
  `cost_amount` decimal(10,2) DEFAULT NULL,
  `completion_date` datetime NOT NULL,
  `notes` text,
  `created_by` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data for table: boiling_completions
INSERT INTO `boiling_completions` (`id`, `boiling_record_id`, `returned_quantity_kg`, `missing_quantity_kg`, `cost_amount`, `completion_date`, `notes`, `created_by`, `created_at`) VALUES ('1', '2', '45.00', '5.00', NULL, 'Sun Aug 17 2025 02:13:27 GMT+0530 (India Standard Time)', 'Some water evaporation occurred during boiling', '1', 'Sat Aug 16 2025 20:43:27 GMT+0530 (India Standard Time)');
INSERT INTO `boiling_completions` (`id`, `boiling_record_id`, `returned_quantity_kg`, `missing_quantity_kg`, `cost_amount`, `completion_date`, `notes`, `created_by`, `created_at`) VALUES ('2', '6', '90.00', '10.00', NULL, 'Sun Aug 17 2025 02:32:24 GMT+0530 (India Standard Time)', 'sa', '1', 'Sat Aug 16 2025 21:02:24 GMT+0530 (India Standard Time)');
INSERT INTO `boiling_completions` (`id`, `boiling_record_id`, `returned_quantity_kg`, `missing_quantity_kg`, `cost_amount`, `completion_date`, `notes`, `created_by`, `created_at`) VALUES ('3', '5', '45.00', '5.00', NULL, 'Sun Aug 17 2025 16:40:44 GMT+0530 (India Standard Time)', 'saaa', '1', 'Sun Aug 17 2025 11:10:44 GMT+0530 (India Standard Time)');
INSERT INTO `boiling_completions` (`id`, `boiling_record_id`, `returned_quantity_kg`, `missing_quantity_kg`, `cost_amount`, `completion_date`, `notes`, `created_by`, `created_at`) VALUES ('4', '4', '95.00', '5.00', '10000.00', 'Mon Aug 18 2025 00:55:29 GMT+0530 (India Standard Time)', '', '1', 'Sun Aug 17 2025 19:25:29 GMT+0530 (India Standard Time)');
INSERT INTO `boiling_completions` (`id`, `boiling_record_id`, `returned_quantity_kg`, `missing_quantity_kg`, `cost_amount`, `completion_date`, `notes`, `created_by`, `created_at`) VALUES ('5', '7', '1300.00', '200.00', '100000.00', 'Mon Aug 18 2025 23:29:24 GMT+0530 (India Standard Time)', '', '1', 'Mon Aug 18 2025 17:59:24 GMT+0530 (India Standard Time)');

-- Table: boiling_missing_quantities
DROP TABLE IF EXISTS `boiling_missing_quantities`;
CREATE TABLE `boiling_missing_quantities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `boiling_completion_id` int NOT NULL,
  `quantity_kg` decimal(10,2) NOT NULL,
  `reason` enum('evaporation','spillage','quality_rejection','other') NOT NULL,
  `description` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data for table: boiling_missing_quantities
INSERT INTO `boiling_missing_quantities` (`id`, `boiling_completion_id`, `quantity_kg`, `reason`, `description`, `created_at`) VALUES ('1', '2', '10.00', 'spillage', '', 'Sat Aug 16 2025 21:02:24 GMT+0530 (India Standard Time)');
INSERT INTO `boiling_missing_quantities` (`id`, `boiling_completion_id`, `quantity_kg`, `reason`, `description`, `created_at`) VALUES ('2', '3', '5.00', 'evaporation', '', 'Sun Aug 17 2025 11:10:44 GMT+0530 (India Standard Time)');
INSERT INTO `boiling_missing_quantities` (`id`, `boiling_completion_id`, `quantity_kg`, `reason`, `description`, `created_at`) VALUES ('3', '4', '5.00', 'evaporation', '', 'Sun Aug 17 2025 19:25:29 GMT+0530 (India Standard Time)');
INSERT INTO `boiling_missing_quantities` (`id`, `boiling_completion_id`, `quantity_kg`, `reason`, `description`, `created_at`) VALUES ('4', '5', '200.00', 'other', '', 'Mon Aug 18 2025 17:59:24 GMT+0530 (India Standard Time)');

-- Table: boiling_records
DROP TABLE IF EXISTS `boiling_records`;
CREATE TABLE `boiling_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `rice_variety_id` int NOT NULL,
  `quantity_kg` decimal(10,2) NOT NULL,
  `boiling_date` datetime NOT NULL,
  `created_by` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `bdeleted` tinyint(1) DEFAULT '0',
  `deleted_by` int DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `status` enum('pending','completed','cancelled') DEFAULT 'pending',
  `completed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data for table: boiling_records
INSERT INTO `boiling_records` (`id`, `rice_variety_id`, `quantity_kg`, `boiling_date`, `created_by`, `created_at`, `bdeleted`, `deleted_by`, `deleted_at`, `status`, `completed_at`) VALUES ('1', '1', '50.00', 'Sun Aug 17 2025 01:14:21 GMT+0530 (India Standard Time)', '1', 'Sat Aug 16 2025 19:44:21 GMT+0530 (India Standard Time)', '1', '1', 'Sat Aug 16 2025 19:45:54 GMT+0530 (India Standard Time)', 'pending', NULL);
INSERT INTO `boiling_records` (`id`, `rice_variety_id`, `quantity_kg`, `boiling_date`, `created_by`, `created_at`, `bdeleted`, `deleted_by`, `deleted_at`, `status`, `completed_at`) VALUES ('2', '1', '50.00', 'Sun Aug 17 2025 01:15:19 GMT+0530 (India Standard Time)', '1', 'Sat Aug 16 2025 19:45:19 GMT+0530 (India Standard Time)', '0', NULL, NULL, 'completed', 'Sun Aug 17 2025 02:13:27 GMT+0530 (India Standard Time)');
INSERT INTO `boiling_records` (`id`, `rice_variety_id`, `quantity_kg`, `boiling_date`, `created_by`, `created_at`, `bdeleted`, `deleted_by`, `deleted_at`, `status`, `completed_at`) VALUES ('3', '1', '50.00', 'Sun Aug 17 2025 01:22:59 GMT+0530 (India Standard Time)', '1', 'Sat Aug 16 2025 19:52:59 GMT+0530 (India Standard Time)', '0', NULL, NULL, 'pending', NULL);
INSERT INTO `boiling_records` (`id`, `rice_variety_id`, `quantity_kg`, `boiling_date`, `created_by`, `created_at`, `bdeleted`, `deleted_by`, `deleted_at`, `status`, `completed_at`) VALUES ('4', '1', '100.00', 'Sun Aug 17 2025 02:11:56 GMT+0530 (India Standard Time)', '1', 'Sat Aug 16 2025 20:41:56 GMT+0530 (India Standard Time)', '0', NULL, NULL, 'completed', 'Mon Aug 18 2025 00:55:29 GMT+0530 (India Standard Time)');
INSERT INTO `boiling_records` (`id`, `rice_variety_id`, `quantity_kg`, `boiling_date`, `created_by`, `created_at`, `bdeleted`, `deleted_by`, `deleted_at`, `status`, `completed_at`) VALUES ('5', '1', '50.00', 'Sun Aug 17 2025 02:21:12 GMT+0530 (India Standard Time)', '1', 'Sat Aug 16 2025 20:51:12 GMT+0530 (India Standard Time)', '0', NULL, NULL, 'completed', 'Sun Aug 17 2025 16:40:44 GMT+0530 (India Standard Time)');
INSERT INTO `boiling_records` (`id`, `rice_variety_id`, `quantity_kg`, `boiling_date`, `created_by`, `created_at`, `bdeleted`, `deleted_by`, `deleted_at`, `status`, `completed_at`) VALUES ('6', '1', '100.00', 'Sun Aug 17 2025 02:32:05 GMT+0530 (India Standard Time)', '1', 'Sat Aug 16 2025 21:02:05 GMT+0530 (India Standard Time)', '0', NULL, NULL, 'completed', 'Sun Aug 17 2025 02:32:24 GMT+0530 (India Standard Time)');
INSERT INTO `boiling_records` (`id`, `rice_variety_id`, `quantity_kg`, `boiling_date`, `created_by`, `created_at`, `bdeleted`, `deleted_by`, `deleted_at`, `status`, `completed_at`) VALUES ('7', '4', '1500.00', 'Mon Aug 18 2025 23:27:17 GMT+0530 (India Standard Time)', '1', 'Mon Aug 18 2025 17:57:17 GMT+0530 (India Standard Time)', '0', NULL, NULL, 'completed', 'Mon Aug 18 2025 23:29:24 GMT+0530 (India Standard Time)');

-- Table: customer_payments
DROP TABLE IF EXISTS `customer_payments`;
CREATE TABLE `customer_payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `payment_method` enum('cash','bank_transfer','cheque','other') DEFAULT 'cash',
  `reference_number` varchar(100) DEFAULT NULL,
  `notes` text,
  `created_by` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data for table: customer_payments
INSERT INTO `customer_payments` (`id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('1', '1', '2000.00', 'Thu Aug 14 2025 18:03:52 GMT+0530 (India Standard Time)', 'cash', '', '', '1');
INSERT INTO `customer_payments` (`id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('2', '1', '2000.00', 'Thu Aug 14 2025 18:06:55 GMT+0530 (India Standard Time)', 'cash', '', '', '1');
INSERT INTO `customer_payments` (`id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('3', '1', '1000.00', 'Thu Aug 14 2025 18:11:25 GMT+0530 (India Standard Time)', 'cash', '', 'Partial payment', '1');
INSERT INTO `customer_payments` (`id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('4', '1', '1000.00', 'Thu Aug 14 2025 18:22:59 GMT+0530 (India Standard Time)', 'cash', NULL, 'Payment recorded', '1');
INSERT INTO `customer_payments` (`id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('5', '1', '1000.00', 'Thu Aug 14 2025 18:23:13 GMT+0530 (India Standard Time)', 'cash', NULL, 'Payment recorded', '1');
INSERT INTO `customer_payments` (`id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('6', '1', '1000.00', 'Thu Aug 14 2025 18:23:29 GMT+0530 (India Standard Time)', 'cash', NULL, 'Payment recorded', '1');
INSERT INTO `customer_payments` (`id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('7', '1', '500.00', 'Thu Aug 14 2025 18:24:47 GMT+0530 (India Standard Time)', 'cash', NULL, 'Payment recorded', '1');
INSERT INTO `customer_payments` (`id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('8', '1', '100.00', 'Thu Aug 14 2025 18:38:56 GMT+0530 (India Standard Time)', 'cash', NULL, 'Payment for order #2', '1');
INSERT INTO `customer_payments` (`id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('9', '1', '100.00', 'Thu Aug 14 2025 18:39:51 GMT+0530 (India Standard Time)', 'cash', NULL, 'Payment for order #2', '1');
INSERT INTO `customer_payments` (`id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('10', '1', '100.00', 'Thu Aug 14 2025 18:40:04 GMT+0530 (India Standard Time)', 'cash', NULL, 'Payment for order #2', '1');
INSERT INTO `customer_payments` (`id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('11', '1', '100.00', 'Thu Aug 14 2025 18:40:14 GMT+0530 (India Standard Time)', 'cash', NULL, 'Payment for order #2', '1');
INSERT INTO `customer_payments` (`id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('12', '1', '100.00', 'Thu Aug 14 2025 18:43:25 GMT+0530 (India Standard Time)', 'cash', NULL, 'General payment for customer John Doe', '1');
INSERT INTO `customer_payments` (`id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('13', '1', '100.00', 'Thu Aug 14 2025 18:43:32 GMT+0530 (India Standard Time)', 'cash', NULL, 'Payment for order #2', '1');
INSERT INTO `customer_payments` (`id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('14', '1', '100.00', 'Thu Aug 14 2025 18:44:35 GMT+0530 (India Standard Time)', 'cash', NULL, 'General payment for customer John Doe', '1');
INSERT INTO `customer_payments` (`id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('15', '1', '100.00', 'Thu Aug 14 2025 19:07:37 GMT+0530 (India Standard Time)', 'cash', NULL, '', '1');
INSERT INTO `customer_payments` (`id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('16', '2', '1000.00', 'Thu Aug 14 2025 19:07:59 GMT+0530 (India Standard Time)', 'cash', NULL, '', '1');
INSERT INTO `customer_payments` (`id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('17', '2', '1000.00', 'Thu Aug 14 2025 19:08:21 GMT+0530 (India Standard Time)', 'cash', NULL, 'Payment for order #4', '1');
INSERT INTO `customer_payments` (`id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('18', '1', '2100.00', 'Thu Aug 14 2025 19:13:48 GMT+0530 (India Standard Time)', 'cash', NULL, 'General payment for customer John Doe', '1');
INSERT INTO `customer_payments` (`id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('19', '1', '400.00', 'Sat Aug 16 2025 13:45:12 GMT+0530 (India Standard Time)', 'cash', NULL, 'Walk-in customer', '1');
INSERT INTO `customer_payments` (`id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('20', '2', '999.00', 'Sat Aug 16 2025 13:59:09 GMT+0530 (India Standard Time)', 'cash', NULL, '', '1');
INSERT INTO `customer_payments` (`id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('21', '2', '100.00', 'Sat Aug 16 2025 14:01:08 GMT+0530 (India Standard Time)', 'cash', NULL, '', '1');
INSERT INTO `customer_payments` (`id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('22', '2', '1000.00', 'Sat Aug 16 2025 14:17:49 GMT+0530 (India Standard Time)', 'cash', NULL, '', '1');
INSERT INTO `customer_payments` (`id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('23', '1', '1000.00', 'Sat Aug 16 2025 14:24:32 GMT+0530 (India Standard Time)', 'cash', NULL, 'new', '1');
INSERT INTO `customer_payments` (`id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('24', '1', '1000.00', 'Sat Aug 16 2025 14:24:53 GMT+0530 (India Standard Time)', 'cash', NULL, 'Payment for order #9', '1');
INSERT INTO `customer_payments` (`id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('25', '2', '10000.00', 'Sat Aug 16 2025 14:33:41 GMT+0530 (India Standard Time)', 'cash', NULL, 'new', '1');
INSERT INTO `customer_payments` (`id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('26', '1', '10000.00', 'Sat Aug 16 2025 14:35:21 GMT+0530 (India Standard Time)', 'cash', NULL, '', '1');
INSERT INTO `customer_payments` (`id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('27', '3', '150000.00', 'Mon Aug 18 2025 17:55:57 GMT+0530 (India Standard Time)', 'cash', NULL, '', '1');

-- Table: customers
DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `total_purchases` decimal(12,2) DEFAULT '0.00',
  `total_paid` decimal(12,2) DEFAULT '0.00',
  `total_pending` decimal(12,2) DEFAULT '0.00',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `phone` (`phone`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data for table: customers
INSERT INTO `customers` (`id`, `name`, `phone`, `total_purchases`, `total_paid`, `total_pending`, `created_at`, `updated_at`) VALUES ('1', 'John Doe', '1234567890', '76650.00', '23800.00', '52850.00', 'Thu Aug 14 2025 18:03:52 GMT+0530 (India Standard Time)', 'Sat Aug 16 2025 14:35:21 GMT+0530 (India Standard Time)');
INSERT INTO `customers` (`id`, `name`, `phone`, `total_purchases`, `total_paid`, `total_pending`, `created_at`, `updated_at`) VALUES ('2', 'sathira', '0774487666', '226000.00', '14099.00', '211901.00', 'Thu Aug 14 2025 19:07:59 GMT+0530 (India Standard Time)', 'Thu Aug 28 2025 20:33:36 GMT+0530 (India Standard Time)');
INSERT INTO `customers` (`id`, `name`, `phone`, `total_purchases`, `total_paid`, `total_pending`, `created_at`, `updated_at`) VALUES ('3', 'Gunasiri', '0767765612', '172500.00', '150000.00', '22500.00', 'Mon Aug 18 2025 17:55:57 GMT+0530 (India Standard Time)', 'Mon Aug 18 2025 17:55:57 GMT+0530 (India Standard Time)');

-- Table: expense_types
DROP TABLE IF EXISTS `expense_types`;
CREATE TABLE `expense_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data for table: expense_types
INSERT INTO `expense_types` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES ('1', 'Equipment Maintenance', 'Costs for maintaining milling equipment', 'Mon Aug 18 2025 16:25:11 GMT+0530 (India Standard Time)', 'Mon Aug 18 2025 16:25:11 GMT+0530 (India Standard Time)');
INSERT INTO `expense_types` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES ('2', 'aaaa', 'aaaa', 'Mon Aug 18 2025 17:12:16 GMT+0530 (India Standard Time)', 'Mon Aug 18 2025 17:12:16 GMT+0530 (India Standard Time)');
INSERT INTO `expense_types` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES ('3', 'Salary', NULL, 'Fri Sep 05 2025 15:46:59 GMT+0530 (India Standard Time)', 'Fri Sep 05 2025 15:46:59 GMT+0530 (India Standard Time)');

-- Table: extra_expenses
DROP TABLE IF EXISTS `extra_expenses`;
CREATE TABLE `extra_expenses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `expense_type_id` int NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `description` text,
  `expense_date` date NOT NULL,
  `recorded_by` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_by` int DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data for table: extra_expenses
INSERT INTO `extra_expenses` (`id`, `expense_type_id`, `amount`, `description`, `expense_date`, `recorded_by`, `created_at`, `updated_at`, `is_deleted`, `deleted_by`, `deleted_at`) VALUES ('1', '1', '800.00', 'Updated cost for bearing replacement', 'Sun Jun 18 2023 00:00:00 GMT+0530 (India Standard Time)', '1', 'Mon Aug 18 2025 16:25:35 GMT+0530 (India Standard Time)', 'Mon Aug 18 2025 16:26:32 GMT+0530 (India Standard Time)', '1', '1', 'Mon Aug 18 2025 16:26:32 GMT+0530 (India Standard Time)');
INSERT INTO `extra_expenses` (`id`, `expense_type_id`, `amount`, `description`, `expense_date`, `recorded_by`, `created_at`, `updated_at`, `is_deleted`, `deleted_by`, `deleted_at`) VALUES ('2', '1', '750.00', 'Replaced bearing in milling machine', 'Sun Jun 18 2023 00:00:00 GMT+0530 (India Standard Time)', '1', 'Mon Aug 18 2025 16:25:38 GMT+0530 (India Standard Time)', 'Mon Aug 18 2025 16:25:38 GMT+0530 (India Standard Time)', '0', NULL, NULL);

-- Table: extra_income
DROP TABLE IF EXISTS `extra_income`;
CREATE TABLE `extra_income` (
  `id` int NOT NULL AUTO_INCREMENT,
  `income_type_id` int NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `description` text,
  `income_date` date NOT NULL,
  `recorded_by` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_by` int DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data for table: extra_income
INSERT INTO `extra_income` (`id`, `income_type_id`, `amount`, `description`, `income_date`, `recorded_by`, `created_at`, `updated_at`, `is_deleted`, `deleted_by`, `deleted_at`) VALUES ('1', '1', '2000.00', 'Updated rental amount for milling machine', 'Thu Jun 15 2023 00:00:00 GMT+0530 (India Standard Time)', '1', 'Mon Aug 18 2025 16:23:24 GMT+0530 (India Standard Time)', 'Mon Aug 18 2025 16:24:57 GMT+0530 (India Standard Time)', '1', '1', 'Mon Aug 18 2025 16:24:57 GMT+0530 (India Standard Time)');
INSERT INTO `extra_income` (`id`, `income_type_id`, `amount`, `description`, `income_date`, `recorded_by`, `created_at`, `updated_at`, `is_deleted`, `deleted_by`, `deleted_at`) VALUES ('2', '1', '2000.00', 'Rented out milling machine for 3 days', 'Wed Jun 14 2023 00:00:00 GMT+0530 (India Standard Time)', '1', 'Mon Aug 18 2025 16:23:43 GMT+0530 (India Standard Time)', 'Fri Sep 05 2025 15:44:44 GMT+0530 (India Standard Time)', '1', '1', 'Fri Sep 05 2025 15:44:44 GMT+0530 (India Standard Time)');
INSERT INTO `extra_income` (`id`, `income_type_id`, `amount`, `description`, `income_date`, `recorded_by`, `created_at`, `updated_at`, `is_deleted`, `deleted_by`, `deleted_at`) VALUES ('3', '1', '1000.00', NULL, 'Mon Aug 18 2025 00:00:00 GMT+0530 (India Standard Time)', '1', 'Mon Aug 18 2025 16:56:44 GMT+0530 (India Standard Time)', 'Mon Aug 18 2025 16:57:02 GMT+0530 (India Standard Time)', '1', '1', 'Mon Aug 18 2025 16:57:02 GMT+0530 (India Standard Time)');

-- Table: income_types
DROP TABLE IF EXISTS `income_types`;
CREATE TABLE `income_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data for table: income_types
INSERT INTO `income_types` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES ('1', 'Equipment Rental', 'Income from renting out mill equipment', 'Mon Aug 18 2025 16:22:37 GMT+0530 (India Standard Time)', 'Mon Aug 18 2025 16:22:37 GMT+0530 (India Standard Time)');
INSERT INTO `income_types` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES ('2', 'sasa', 'sas', 'Mon Aug 18 2025 17:09:57 GMT+0530 (India Standard Time)', 'Mon Aug 18 2025 17:09:57 GMT+0530 (India Standard Time)');
INSERT INTO `income_types` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES ('3', 'Rice Bran', NULL, 'Fri Sep 05 2025 15:45:20 GMT+0530 (India Standard Time)', 'Fri Sep 05 2025 15:45:20 GMT+0530 (India Standard Time)');

-- Table: inventory_adjustments
DROP TABLE IF EXISTS `inventory_adjustments`;
CREATE TABLE `inventory_adjustments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `rice_variety_id` int NOT NULL,
  `adjustment_amount` decimal(10,2) NOT NULL,
  `previous_stock` decimal(10,2) NOT NULL,
  `new_stock` decimal(10,2) NOT NULL,
  `notes` text,
  `adjusted_by` int NOT NULL,
  `adjustment_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data for table: inventory_adjustments
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('1', '1', '50.25', '0.00', '0.01', 'Received new stock from supplier', '1', 'Sat Aug 16 2025 13:40:05 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('2', '1', '50.25', '0.01', '0.02', 'Received new stock from supplier', '1', 'Sat Aug 16 2025 13:43:05 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('3', '1', '50.25', '0.02', '50.27', 'Received new stock from supplier', '1', 'Sat Aug 16 2025 13:44:49 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('4', '1', '50.25', '50.27', '100.52', 'Received new stock from supplier', '1', 'Sat Aug 16 2025 13:44:56 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('5', '1', '50.25', '100.52', '150.77', 'Received new stock from supplier', '1', 'Sat Aug 16 2025 13:44:59 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('6', '1', '-10.50', '150.77', '140.27', 'Sold 10.5kg to customer 1', '1', 'Sat Aug 16 2025 13:45:12 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('7', '1', '-100.00', '140.27', '40.27', 'Sold 100kg to customer 2', '1', 'Sat Aug 16 2025 13:59:09 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('8', '1', '-10.00', '40.27', '30.27', 'Sold 10kg to customer 2', '1', 'Sat Aug 16 2025 14:01:08 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('9', '1', '-50.00', '50.27', '0.27', 'Sold 50kg to customer 2', '1', 'Sat Aug 16 2025 14:17:49 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('10', '1', '1000.00', '100.27', '1100.27', '', '1', 'Sat Aug 16 2025 14:18:05 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('11', '1', '-100.00', '1100.27', '1000.27', 'Sold 100kg to customer 1', '1', 'Sat Aug 16 2025 14:24:32 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('12', '1', '-1000.00', '1200.27', '200.27', 'Sold 1000kg to customer 2', '1', 'Sat Aug 16 2025 14:33:41 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('13', '1', '-100.00', '2200.27', '2100.27', 'Sold 100kg to customer 1', '1', 'Sat Aug 16 2025 14:35:21 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('14', '2', '50.00', '0.00', '50.00', '', '1', 'Sat Aug 16 2025 14:39:36 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('15', '1', '-50.00', '2300.27', '2250.27', 'Sent 50kg for boiling', '1', 'Sat Aug 16 2025 19:44:21 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('16', '1', '-50.00', '2250.27', '2200.27', 'Sent 50kg for boiling', '1', 'Sat Aug 16 2025 19:45:19 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('17', '1', '50.00', '2250.27', '2250.28', 'Reversed boiling of 50.00kg (record ID: 1)', '1', 'Sat Aug 16 2025 19:45:54 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('18', '1', '-50.00', '2250.27', '2200.27', 'Sent 50kg for boiling', '1', 'Sat Aug 16 2025 19:52:59 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('19', '1', '-100.00', '2200.27', '2100.27', 'Sent 100kg for boiling', '1', 'Sat Aug 16 2025 20:41:56 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('20', '1', '45.00', '2145.27', '2145.27', 'Returned 45kg from boiling (record ID: 2)', '1', 'Sat Aug 16 2025 20:43:27 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('21', '1', '-50.00', '2145.27', '2095.27', 'Sent 50kg for boiling', '1', 'Sat Aug 16 2025 20:51:12 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('22', '1', '-100.00', '2095.27', '1995.27', 'Sent 100kg for boiling', '1', 'Sat Aug 16 2025 21:02:05 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('23', '1', '90.00', '2085.27', '2085.28', 'Returned 90kg from boiling (record ID: 6)', '1', 'Sat Aug 16 2025 21:02:24 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('24', '1', '45.00', '2130.27', '2130.27', 'Returned 45kg from boiling (record ID: 5)', '1', 'Sun Aug 17 2025 11:10:44 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('25', '1', '-100.00', '2130.27', '2030.27', 'Sent 100kg for milling', '1', 'Sun Aug 17 2025 11:32:30 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('26', '1', '-100.00', '2030.27', '1930.27', 'Sent 100kg for milling', '1', 'Sun Aug 17 2025 11:32:45 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('27', '2', '90.00', '140.00', '140.01', 'Received 90kg from milling (record ID: 1)', '1', 'Sun Aug 17 2025 11:34:11 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('28', '2', '100.00', '240.00', '240.00', 'Received 100kg from milling (record ID: 2)', '1', 'Sun Aug 17 2025 11:53:25 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('29', '1', '-50.00', '1930.27', '1880.27', 'Sent 50kg for milling', '1', 'Sun Aug 17 2025 11:54:05 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('30', '2', '50.00', '290.00', '290.01', 'Received 50kg from milling (record ID: 3)', '1', 'Sun Aug 17 2025 11:56:07 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('31', '2', '-100.00', '290.00', '190.00', 'Sold 100kg to customer 1', '1', 'Sun Aug 17 2025 12:44:46 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('32', '2', '-100.00', '190.00', '90.00', 'Sold 100kg to customer 1', '1', 'Sun Aug 17 2025 12:55:02 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('33', '2', '-10.00', '90.00', '80.00', 'Sold 10kg to customer 2', '1', 'Sun Aug 17 2025 12:55:22 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('34', '2', '-10.00', '80.00', '70.00', 'Sold 10kg to customer 3', '1', 'Sun Aug 17 2025 13:11:12 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('35', '2', '-10.00', '70.00', '60.00', 'Sold 10kg to customer 5', '1', 'Sun Aug 17 2025 14:16:19 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('36', '2', '-10.00', '60.00', '50.00', 'Sold 10kg to customer 3', '1', 'Sun Aug 17 2025 14:17:00 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('37', '1', '-100.00', '1880.27', '1780.27', 'Sent 100kg for milling', '1', 'Sun Aug 17 2025 19:05:58 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('38', '1', '95.00', '1875.27', '1875.28', 'Returned 95kg from boiling (record ID: 4)', '1', 'Sun Aug 17 2025 19:25:29 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('39', '4', '2000.00', '0.00', '2000.00', 'addition', '1', 'Mon Aug 18 2025 17:54:12 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('40', '2', '1500.00', '50.00', '-1450.00', 'Buy 1500kg from customer 3', '1', 'Mon Aug 18 2025 17:55:57 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('41', '4', '-1500.00', '2000.00', '500.00', 'Sent 1500kg for boiling', '1', 'Mon Aug 18 2025 17:57:17 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('42', '4', '1300.00', '1800.00', '1800.00', 'Returned 1300kg from boiling (record ID: 7)', '1', 'Mon Aug 18 2025 17:59:24 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('43', '5', '1000.00', '0.00', '1000.00', '', '1', 'Tue Aug 19 2025 20:16:35 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('44', '3', '1000.00', '0.00', '-1000.00', 'Buy 1000kg from customer 2', '1', 'Thu Aug 28 2025 20:33:36 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('45', '6', '-5000.00', '0.00', '-5000.00', 'Sent 5000kg for milling', '1', 'Sun Aug 31 2025 13:01:26 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('46', '3', '-100.00', '1000.00', '900.00', 'Sold 100kg to customer 3', '1', 'Fri Sep 05 2025 15:40:17 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('47', '4', '-115.00', '1800.00', '1685.00', 'Sold 115kg to customer 3', '1', 'Fri Sep 05 2025 15:42:38 GMT+0530 (India Standard Time)');
INSERT INTO `inventory_adjustments` (`id`, `rice_variety_id`, `adjustment_amount`, `previous_stock`, `new_stock`, `notes`, `adjusted_by`, `adjustment_date`) VALUES ('48', '3', '-50.00', '900.00', '850.00', 'Sold 50kg to customer 1', '1', 'Sun Sep 28 2025 17:09:06 GMT+0530 (India Standard Time)');

-- Table: milling_completions
DROP TABLE IF EXISTS `milling_completions`;
CREATE TABLE `milling_completions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `milling_record_id` int NOT NULL,
  `output_rice_variety_id` int NOT NULL,
  `returned_quantity_kg` decimal(10,2) NOT NULL,
  `completion_date` datetime NOT NULL,
  `notes` text,
  `created_by` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data for table: milling_completions
INSERT INTO `milling_completions` (`id`, `milling_record_id`, `output_rice_variety_id`, `returned_quantity_kg`, `completion_date`, `notes`, `created_by`, `created_at`) VALUES ('1', '1', '2', '90.00', 'Sun Aug 17 2025 17:04:11 GMT+0530 (India Standard Time)', 'Milled successfully', '1', 'Sun Aug 17 2025 11:34:11 GMT+0530 (India Standard Time)');
INSERT INTO `milling_completions` (`id`, `milling_record_id`, `output_rice_variety_id`, `returned_quantity_kg`, `completion_date`, `notes`, `created_by`, `created_at`) VALUES ('2', '2', '2', '100.00', 'Sun Aug 17 2025 17:23:25 GMT+0530 (India Standard Time)', 'sas', '1', 'Sun Aug 17 2025 11:53:25 GMT+0530 (India Standard Time)');
INSERT INTO `milling_completions` (`id`, `milling_record_id`, `output_rice_variety_id`, `returned_quantity_kg`, `completion_date`, `notes`, `created_by`, `created_at`) VALUES ('3', '3', '2', '50.00', 'Sun Aug 17 2025 17:26:07 GMT+0530 (India Standard Time)', 'sa', '1', 'Sun Aug 17 2025 11:56:07 GMT+0530 (India Standard Time)');

-- Table: milling_records
DROP TABLE IF EXISTS `milling_records`;
CREATE TABLE `milling_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `rice_variety_id` int NOT NULL,
  `quantity_kg` decimal(10,2) NOT NULL,
  `milling_date` datetime NOT NULL,
  `created_by` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `mdeleted` tinyint(1) DEFAULT '0',
  `deleted_by` int DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `status` enum('pending','completed','cancelled') DEFAULT 'pending',
  `completed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data for table: milling_records
INSERT INTO `milling_records` (`id`, `rice_variety_id`, `quantity_kg`, `milling_date`, `created_by`, `created_at`, `mdeleted`, `deleted_by`, `deleted_at`, `status`, `completed_at`) VALUES ('1', '1', '100.00', 'Sun Aug 17 2025 17:02:30 GMT+0530 (India Standard Time)', '1', 'Sun Aug 17 2025 11:32:30 GMT+0530 (India Standard Time)', '0', NULL, NULL, 'completed', 'Sun Aug 17 2025 17:04:11 GMT+0530 (India Standard Time)');
INSERT INTO `milling_records` (`id`, `rice_variety_id`, `quantity_kg`, `milling_date`, `created_by`, `created_at`, `mdeleted`, `deleted_by`, `deleted_at`, `status`, `completed_at`) VALUES ('2', '1', '100.00', 'Sun Aug 17 2025 17:02:45 GMT+0530 (India Standard Time)', '1', 'Sun Aug 17 2025 11:32:45 GMT+0530 (India Standard Time)', '0', NULL, NULL, 'completed', 'Sun Aug 17 2025 17:23:25 GMT+0530 (India Standard Time)');
INSERT INTO `milling_records` (`id`, `rice_variety_id`, `quantity_kg`, `milling_date`, `created_by`, `created_at`, `mdeleted`, `deleted_by`, `deleted_at`, `status`, `completed_at`) VALUES ('3', '1', '50.00', 'Sun Aug 17 2025 17:24:05 GMT+0530 (India Standard Time)', '1', 'Sun Aug 17 2025 11:54:05 GMT+0530 (India Standard Time)', '0', NULL, NULL, 'completed', 'Sun Aug 17 2025 17:26:07 GMT+0530 (India Standard Time)');
INSERT INTO `milling_records` (`id`, `rice_variety_id`, `quantity_kg`, `milling_date`, `created_by`, `created_at`, `mdeleted`, `deleted_by`, `deleted_at`, `status`, `completed_at`) VALUES ('4', '1', '100.00', 'Mon Aug 18 2025 00:35:58 GMT+0530 (India Standard Time)', '1', 'Sun Aug 17 2025 19:05:58 GMT+0530 (India Standard Time)', '0', NULL, NULL, 'pending', NULL);
INSERT INTO `milling_records` (`id`, `rice_variety_id`, `quantity_kg`, `milling_date`, `created_by`, `created_at`, `mdeleted`, `deleted_by`, `deleted_at`, `status`, `completed_at`) VALUES ('5', '6', '5000.00', 'Sun Aug 31 2025 13:01:26 GMT+0530 (India Standard Time)', '1', 'Sun Aug 31 2025 13:01:26 GMT+0530 (India Standard Time)', '0', NULL, NULL, 'pending', NULL);

-- Table: rice_purchases
DROP TABLE IF EXISTS `rice_purchases`;
CREATE TABLE `rice_purchases` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `rice_type_id` int NOT NULL,
  `quantity_kg` decimal(10,2) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `paid_amount` decimal(10,2) NOT NULL,
  `pending_amount` decimal(10,2) NOT NULL,
  `purchase_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data for table: rice_purchases
INSERT INTO `rice_purchases` (`id`, `customer_id`, `rice_type_id`, `quantity_kg`, `unit_price`, `total_price`, `paid_amount`, `pending_amount`, `purchase_date`, `created_by`) VALUES ('1', '1', '1', '50.00', '80.00', '4000.00', '4000.00', '0.00', 'Thu Aug 14 2025 18:03:52 GMT+0530 (India Standard Time)', '1');
INSERT INTO `rice_purchases` (`id`, `customer_id`, `rice_type_id`, `quantity_kg`, `unit_price`, `total_price`, `paid_amount`, `pending_amount`, `purchase_date`, `created_by`) VALUES ('2', '1', '1', '80.00', '80.00', '6400.00', '2600.00', '3800.00', 'Thu Aug 14 2025 18:06:55 GMT+0530 (India Standard Time)', '1');
INSERT INTO `rice_purchases` (`id`, `customer_id`, `rice_type_id`, `quantity_kg`, `unit_price`, `total_price`, `paid_amount`, `pending_amount`, `purchase_date`, `created_by`) VALUES ('3', '1', '1', '10.00', '100.00', '1000.00', '100.00', '900.00', 'Thu Aug 14 2025 19:07:37 GMT+0530 (India Standard Time)', '1');
INSERT INTO `rice_purchases` (`id`, `customer_id`, `rice_type_id`, `quantity_kg`, `unit_price`, `total_price`, `paid_amount`, `pending_amount`, `purchase_date`, `created_by`) VALUES ('4', '2', '1', '100.00', '100.00', '10000.00', '2000.00', '8000.00', 'Thu Aug 14 2025 19:07:59 GMT+0530 (India Standard Time)', '1');
INSERT INTO `rice_purchases` (`id`, `customer_id`, `rice_type_id`, `quantity_kg`, `unit_price`, `total_price`, `paid_amount`, `pending_amount`, `purchase_date`, `created_by`) VALUES ('5', '1', '1', '10.50', '500.00', '5250.00', '400.00', '4850.00', 'Sat Aug 16 2025 13:45:12 GMT+0530 (India Standard Time)', '1');
INSERT INTO `rice_purchases` (`id`, `customer_id`, `rice_type_id`, `quantity_kg`, `unit_price`, `total_price`, `paid_amount`, `pending_amount`, `purchase_date`, `created_by`) VALUES ('6', '2', '1', '100.00', '100.00', '10000.00', '999.00', '9001.00', 'Sat Aug 16 2025 13:59:09 GMT+0530 (India Standard Time)', '1');
INSERT INTO `rice_purchases` (`id`, `customer_id`, `rice_type_id`, `quantity_kg`, `unit_price`, `total_price`, `paid_amount`, `pending_amount`, `purchase_date`, `created_by`) VALUES ('7', '2', '1', '10.00', '100.00', '1000.00', '100.00', '900.00', 'Sat Aug 16 2025 14:01:08 GMT+0530 (India Standard Time)', '1');
INSERT INTO `rice_purchases` (`id`, `customer_id`, `rice_type_id`, `quantity_kg`, `unit_price`, `total_price`, `paid_amount`, `pending_amount`, `purchase_date`, `created_by`) VALUES ('8', '2', '1', '50.00', '100.00', '5000.00', '1000.00', '4000.00', 'Sat Aug 16 2025 14:17:49 GMT+0530 (India Standard Time)', '1');
INSERT INTO `rice_purchases` (`id`, `customer_id`, `rice_type_id`, `quantity_kg`, `unit_price`, `total_price`, `paid_amount`, `pending_amount`, `purchase_date`, `created_by`) VALUES ('9', '1', '1', '100.00', '100.00', '10000.00', '2000.00', '8000.00', 'Sat Aug 16 2025 14:24:32 GMT+0530 (India Standard Time)', '1');
INSERT INTO `rice_purchases` (`id`, `customer_id`, `rice_type_id`, `quantity_kg`, `unit_price`, `total_price`, `paid_amount`, `pending_amount`, `purchase_date`, `created_by`) VALUES ('10', '2', '1', '1000.00', '100.00', '100000.00', '10000.00', '90000.00', 'Sat Aug 16 2025 14:33:41 GMT+0530 (India Standard Time)', '1');
INSERT INTO `rice_purchases` (`id`, `customer_id`, `rice_type_id`, `quantity_kg`, `unit_price`, `total_price`, `paid_amount`, `pending_amount`, `purchase_date`, `created_by`) VALUES ('11', '1', '1', '100.00', '500.00', '50000.00', '10000.00', '40000.00', 'Sat Aug 16 2025 14:35:21 GMT+0530 (India Standard Time)', '1');
INSERT INTO `rice_purchases` (`id`, `customer_id`, `rice_type_id`, `quantity_kg`, `unit_price`, `total_price`, `paid_amount`, `pending_amount`, `purchase_date`, `created_by`) VALUES ('12', '3', '2', '1500.00', '115.00', '172500.00', '150000.00', '22500.00', 'Mon Aug 18 2025 17:55:57 GMT+0530 (India Standard Time)', '1');
INSERT INTO `rice_purchases` (`id`, `customer_id`, `rice_type_id`, `quantity_kg`, `unit_price`, `total_price`, `paid_amount`, `pending_amount`, `purchase_date`, `created_by`) VALUES ('13', '2', '3', '1000.00', '100.00', '100000.00', '0.00', '100000.00', 'Thu Aug 28 2025 20:33:37 GMT+0530 (India Standard Time)', '1');

-- Table: rice_sales
DROP TABLE IF EXISTS `rice_sales`;
CREATE TABLE `rice_sales` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `rice_variety_id` int NOT NULL,
  `quantity_kg` decimal(10,2) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `paid_amount` decimal(10,2) NOT NULL,
  `pending_amount` decimal(10,2) NOT NULL,
  `sale_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data for table: rice_sales
INSERT INTO `rice_sales` (`id`, `customer_id`, `rice_variety_id`, `quantity_kg`, `unit_price`, `total_price`, `paid_amount`, `pending_amount`, `sale_date`, `created_by`) VALUES ('1', '1', '2', '100.00', '50.00', '5000.00', '5000.00', '0.00', 'Sun Aug 17 2025 12:44:46 GMT+0530 (India Standard Time)', '1');
INSERT INTO `rice_sales` (`id`, `customer_id`, `rice_variety_id`, `quantity_kg`, `unit_price`, `total_price`, `paid_amount`, `pending_amount`, `sale_date`, `created_by`) VALUES ('2', '1', '2', '100.00', '50.00', '5000.00', '4100.00', '900.00', 'Sun Aug 17 2025 12:55:02 GMT+0530 (India Standard Time)', '1');
INSERT INTO `rice_sales` (`id`, `customer_id`, `rice_variety_id`, `quantity_kg`, `unit_price`, `total_price`, `paid_amount`, `pending_amount`, `sale_date`, `created_by`) VALUES ('3', '2', '2', '10.00', '55.00', '550.00', '550.00', '0.00', 'Sun Aug 17 2025 12:55:22 GMT+0530 (India Standard Time)', '1');
INSERT INTO `rice_sales` (`id`, `customer_id`, `rice_variety_id`, `quantity_kg`, `unit_price`, `total_price`, `paid_amount`, `pending_amount`, `sale_date`, `created_by`) VALUES ('4', '3', '2', '10.00', '100.00', '1000.00', '1000.00', '0.00', 'Sun Aug 17 2025 13:11:12 GMT+0530 (India Standard Time)', '1');
INSERT INTO `rice_sales` (`id`, `customer_id`, `rice_variety_id`, `quantity_kg`, `unit_price`, `total_price`, `paid_amount`, `pending_amount`, `sale_date`, `created_by`) VALUES ('5', '5', '2', '10.00', '1000.00', '10000.00', '1100.00', '8900.00', 'Sun Aug 17 2025 14:16:19 GMT+0530 (India Standard Time)', '1');
INSERT INTO `rice_sales` (`id`, `customer_id`, `rice_variety_id`, `quantity_kg`, `unit_price`, `total_price`, `paid_amount`, `pending_amount`, `sale_date`, `created_by`) VALUES ('6', '3', '2', '10.00', '100.00', '1000.00', '200.00', '800.00', 'Sun Aug 17 2025 14:17:00 GMT+0530 (India Standard Time)', '1');
INSERT INTO `rice_sales` (`id`, `customer_id`, `rice_variety_id`, `quantity_kg`, `unit_price`, `total_price`, `paid_amount`, `pending_amount`, `sale_date`, `created_by`) VALUES ('7', '3', '3', '100.00', '246.99', '24699.00', '0.00', '24699.00', 'Fri Sep 05 2025 15:40:18 GMT+0530 (India Standard Time)', '1');
INSERT INTO `rice_sales` (`id`, `customer_id`, `rice_variety_id`, `quantity_kg`, `unit_price`, `total_price`, `paid_amount`, `pending_amount`, `sale_date`, `created_by`) VALUES ('8', '3', '4', '115.00', '185.00', '21275.00', '22000.00', '-725.00', 'Fri Sep 05 2025 15:42:39 GMT+0530 (India Standard Time)', '1');
INSERT INTO `rice_sales` (`id`, `customer_id`, `rice_variety_id`, `quantity_kg`, `unit_price`, `total_price`, `paid_amount`, `pending_amount`, `sale_date`, `created_by`) VALUES ('9', '1', '3', '50.00', '100.00', '5000.00', '1000.00', '4000.00', 'Sun Sep 28 2025 22:39:05 GMT+0530 (India Standard Time)', '1');

-- Table: rice_varieties
DROP TABLE IF EXISTS `rice_varieties`;
CREATE TABLE `rice_varieties` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL,
  `current_stock_kg` decimal(10,2) DEFAULT '0.00',
  `min_stock_level` decimal(10,2) DEFAULT '100.00',
  `rice_type` enum('paddy','selling') NOT NULL DEFAULT 'paddy',
  `description` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data for table: rice_varieties
INSERT INTO `rice_varieties` (`id`, `name`, `created_at`, `updated_at`, `created_by`, `current_stock_kg`, `min_stock_level`, `rice_type`, `description`) VALUES ('1', 'red rice', 'Thu Aug 14 2025 17:27:55 GMT+0530 (India Standard Time)', 'Tue Aug 19 2025 20:08:28 GMT+0530 (India Standard Time)', '1', '1875.27', '2000.00', 'paddy', NULL);
INSERT INTO `rice_varieties` (`id`, `name`, `created_at`, `updated_at`, `created_by`, `current_stock_kg`, `min_stock_level`, `rice_type`, `description`) VALUES ('2', 'white rice', 'Sat Aug 16 2025 14:38:17 GMT+0530 (India Standard Time)', 'Mon Aug 18 2025 17:56:33 GMT+0530 (India Standard Time)', '1', '1550.00', '100.00', 'paddy', NULL);
INSERT INTO `rice_varieties` (`id`, `name`, `created_at`, `updated_at`, `created_by`, `current_stock_kg`, `min_stock_level`, `rice_type`, `description`) VALUES ('3', 'basmathi', 'Sun Aug 17 2025 19:01:12 GMT+0530 (India Standard Time)', 'Sun Sep 28 2025 17:09:06 GMT+0530 (India Standard Time)', '1', '850.00', '10.00', 'paddy', NULL);
INSERT INTO `rice_varieties` (`id`, `name`, `created_at`, `updated_at`, `created_by`, `current_stock_kg`, `min_stock_level`, `rice_type`, `description`) VALUES ('4', 'white Nadu', 'Mon Aug 18 2025 17:53:44 GMT+0530 (India Standard Time)', 'Fri Sep 05 2025 15:42:38 GMT+0530 (India Standard Time)', '1', '1685.00', '100.00', 'paddy', NULL);
INSERT INTO `rice_varieties` (`id`, `name`, `created_at`, `updated_at`, `created_by`, `current_stock_kg`, `min_stock_level`, `rice_type`, `description`) VALUES ('5', 'Margherita Pizza', 'Mon Aug 18 2025 18:22:14 GMT+0530 (India Standard Time)', 'Tue Aug 19 2025 20:16:35 GMT+0530 (India Standard Time)', '1', '1000.00', '100.00', 'selling', NULL);
INSERT INTO `rice_varieties` (`id`, `name`, `created_at`, `updated_at`, `created_by`, `current_stock_kg`, `min_stock_level`, `rice_type`, `description`) VALUES ('6', 'Keeri Samba', 'Sun Aug 31 2025 12:58:56 GMT+0530 (India Standard Time)', 'Sun Aug 31 2025 13:01:26 GMT+0530 (India Standard Time)', '1', '-5000.00', '100.00', 'paddy', NULL);

-- Table: sales_payments
DROP TABLE IF EXISTS `sales_payments`;
CREATE TABLE `sales_payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sale_id` int NOT NULL,
  `customer_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `payment_method` enum('cash','bank_transfer','cheque','other') DEFAULT 'cash',
  `reference_number` varchar(100) DEFAULT NULL,
  `notes` text,
  `created_by` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data for table: sales_payments
INSERT INTO `sales_payments` (`id`, `sale_id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('1', '1', '1', '4000.00', 'Sun Aug 17 2025 12:44:46 GMT+0530 (India Standard Time)', 'bank_transfer', 'BANK12345', 'First bulk order', '1');
INSERT INTO `sales_payments` (`id`, `sale_id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('2', '1', '1', '500.00', 'Sun Aug 17 2025 12:45:49 GMT+0530 (India Standard Time)', 'cash', NULL, 'Final payment for order', '1');
INSERT INTO `sales_payments` (`id`, `sale_id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('3', '2', '1', '4000.00', 'Sun Aug 17 2025 12:55:02 GMT+0530 (India Standard Time)', 'bank_transfer', NULL, NULL, '1');
INSERT INTO `sales_payments` (`id`, `sale_id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('4', '3', '2', '550.00', 'Sun Aug 17 2025 12:55:22 GMT+0530 (India Standard Time)', 'cash', NULL, NULL, '1');
INSERT INTO `sales_payments` (`id`, `sale_id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('5', '4', '3', '499.99', 'Sun Aug 17 2025 13:11:12 GMT+0530 (India Standard Time)', 'cash', NULL, '', '1');
INSERT INTO `sales_payments` (`id`, `sale_id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('6', '4', '3', '100.00', 'Sun Aug 17 2025 13:28:52 GMT+0530 (India Standard Time)', 'cash', NULL, 'Payment for sale #4', '1');
INSERT INTO `sales_payments` (`id`, `sale_id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('7', '5', '5', '1000.00', 'Sun Aug 17 2025 14:16:19 GMT+0530 (India Standard Time)', 'cash', NULL, '', '1');
INSERT INTO `sales_payments` (`id`, `sale_id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('8', '6', '3', '100.00', 'Sun Aug 17 2025 14:17:00 GMT+0530 (India Standard Time)', 'cash', NULL, '', '1');
INSERT INTO `sales_payments` (`id`, `sale_id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('9', '4', '3', '100.01', 'Sun Aug 17 2025 14:40:49 GMT+0530 (India Standard Time)', 'cash', NULL, 'General payment for customer Sathira Dissanayaka', '1');
INSERT INTO `sales_payments` (`id`, `sale_id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('10', '4', '3', '100.00', 'Sun Aug 17 2025 14:41:02 GMT+0530 (India Standard Time)', 'cash', NULL, '', '1');
INSERT INTO `sales_payments` (`id`, `sale_id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('11', '4', '3', '100.00', 'Sun Aug 17 2025 14:41:15 GMT+0530 (India Standard Time)', 'cash', NULL, '', '1');
INSERT INTO `sales_payments` (`id`, `sale_id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('12', '4', '3', '100.00', 'Sun Aug 17 2025 14:41:24 GMT+0530 (India Standard Time)', 'cash', NULL, '', '1');
INSERT INTO `sales_payments` (`id`, `sale_id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('13', '6', '3', '100.00', 'Sun Aug 17 2025 14:41:24 GMT+0530 (India Standard Time)', 'cash', NULL, '', '1');
INSERT INTO `sales_payments` (`id`, `sale_id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('14', '5', '5', '100.00', 'Sun Aug 17 2025 14:41:46 GMT+0530 (India Standard Time)', 'cash', NULL, 'Payment for sale #5', '1');
INSERT INTO `sales_payments` (`id`, `sale_id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('15', '1', '1', '100.00', 'Sun Aug 17 2025 14:42:01 GMT+0530 (India Standard Time)', 'cash', NULL, 'Payment for sale #1', '1');
INSERT INTO `sales_payments` (`id`, `sale_id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('16', '1', '1', '200.00', 'Sun Aug 17 2025 14:42:16 GMT+0530 (India Standard Time)', 'cash', NULL, 'General payment for customer Wholesale Buyer Inc', '1');
INSERT INTO `sales_payments` (`id`, `sale_id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('17', '1', '1', '200.00', 'Sun Aug 17 2025 14:42:33 GMT+0530 (India Standard Time)', 'cash', NULL, 'General payment for customer Wholesale Buyer Inc', '1');
INSERT INTO `sales_payments` (`id`, `sale_id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('18', '2', '1', '100.00', 'Sun Aug 17 2025 14:42:33 GMT+0530 (India Standard Time)', 'cash', NULL, 'General payment for customer Wholesale Buyer Inc', '1');
INSERT INTO `sales_payments` (`id`, `sale_id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('19', '8', '3', '22000.00', 'Fri Sep 05 2025 15:42:38 GMT+0530 (India Standard Time)', 'cash', NULL, '', '1');
INSERT INTO `sales_payments` (`id`, `sale_id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `created_by`) VALUES ('20', '9', '1', '1000.00', 'Sun Sep 28 2025 17:09:06 GMT+0530 (India Standard Time)', 'cash', NULL, '', '1');

-- Table: selling_customers
DROP TABLE IF EXISTS `selling_customers`;
CREATE TABLE `selling_customers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `address` text,
  `customer_type` enum('wholesale','retail') NOT NULL,
  `total_purchases` decimal(12,2) DEFAULT '0.00',
  `total_paid` decimal(12,2) DEFAULT '0.00',
  `total_pending` decimal(12,2) DEFAULT '0.00',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `phone` (`phone`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data for table: selling_customers
INSERT INTO `selling_customers` (`id`, `name`, `phone`, `address`, `customer_type`, `total_purchases`, `total_paid`, `total_pending`, `created_at`, `updated_at`) VALUES ('1', 'Wholesale Buyer Inc', '9876543210', '123 Market Street', 'wholesale', '15000.00', '10100.00', '4900.00', 'Sun Aug 17 2025 12:43:38 GMT+0530 (India Standard Time)', 'Sun Sep 28 2025 17:09:05 GMT+0530 (India Standard Time)');
INSERT INTO `selling_customers` (`id`, `name`, `phone`, `address`, `customer_type`, `total_purchases`, `total_paid`, `total_pending`, `created_at`, `updated_at`) VALUES ('2', 'New Retail Customer', '9876543211', '456 Local Street', 'retail', '550.00', '550.00', '0.00', 'Sun Aug 17 2025 12:55:22 GMT+0530 (India Standard Time)', 'Sun Aug 17 2025 12:55:22 GMT+0530 (India Standard Time)');
INSERT INTO `selling_customers` (`id`, `name`, `phone`, `address`, `customer_type`, `total_purchases`, `total_paid`, `total_pending`, `created_at`, `updated_at`) VALUES ('3', 'Sathira Dissanayaka', '0774487666', NULL, 'retail', '47974.00', '23200.00', '24774.00', 'Sun Aug 17 2025 13:11:12 GMT+0530 (India Standard Time)', 'Fri Sep 05 2025 15:42:38 GMT+0530 (India Standard Time)');
INSERT INTO `selling_customers` (`id`, `name`, `phone`, `address`, `customer_type`, `total_purchases`, `total_paid`, `total_pending`, `created_at`, `updated_at`) VALUES ('5', 'Sathira Dissanayaka', '0774487555', 'Sooriya sewana, Aranwella', 'retail', '10000.00', '1100.00', '8900.00', 'Sun Aug 17 2025 14:16:19 GMT+0530 (India Standard Time)', 'Sun Aug 17 2025 14:41:46 GMT+0530 (India Standard Time)');

