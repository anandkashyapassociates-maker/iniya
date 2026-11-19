-- ==============================================================
-- INIYA CLINICAL CARE SYSTEM: TODAY WORK DATABASE UPDATE
-- Date: 19-Nov-2026
-- Description:
--   1. Create `appointment_payments` table for payment collection ledger
--   2. Safe column checks for `appointment_sessions` payment fields
--   3. Register migration in `migrations` table
-- ==============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------------
-- 1. Create `appointment_payments` Table
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `appointment_payments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `receipt_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `master_appointment_id` bigint unsigned NOT NULL,
  `admin_id` bigint unsigned DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_date` date NOT NULL,
  `payment_mode` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cash',
  `payment_notes` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_appointment_fees` decimal(10,2) NOT NULL DEFAULT '0.00',
  `previous_paid_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `current_paid_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `balance_remaining` decimal(10,2) NOT NULL DEFAULT '0.00',
  `session_allocations` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `appointment_payments_receipt_number_unique` (`receipt_number`),
  KEY `appointment_payments_master_appointment_id_payment_date_index` (`master_appointment_id`,`payment_date`),
  KEY `appointment_payments_admin_id_foreign` (`admin_id`),
  CONSTRAINT `appointment_payments_master_appointment_id_foreign` FOREIGN KEY (`master_appointment_id`) REFERENCES `master_appointments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `appointment_payments_admin_id_foreign` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------
-- 2. Register Migration in Laravel `migrations` table
-- --------------------------------------------------------------
INSERT INTO `migrations` (`migration`, `batch`)
SELECT '2026_11_19_121500_create_appointment_payments_table', IFNULL(MAX(batch), 0) + 1
FROM `migrations`
WHERE NOT EXISTS (
    SELECT 1 FROM `migrations` WHERE `migration` = '2026_11_19_121500_create_appointment_payments_table'
);

SET FOREIGN_KEY_CHECKS = 1;
