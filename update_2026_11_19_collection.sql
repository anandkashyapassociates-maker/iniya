-- ==============================================================
-- INIYA CLINICAL CARE SYSTEM: PATIENT PAYMENT COLLECTION UPDATE
-- Date: 19-Nov-2026
-- Description: Create appointment_payments table for installment
--              tracking, FIFO session payment allocation & receipts.
-- ==============================================================

CREATE TABLE IF NOT EXISTS `appointment_payments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `receipt_number` varchar(50) NOT NULL,
  `master_appointment_id` bigint unsigned NOT NULL,
  `admin_id` bigint unsigned DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_date` date NOT NULL,
  `payment_mode` varchar(50) NOT NULL DEFAULT 'cash',
  `payment_notes` text DEFAULT NULL,
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
  CONSTRAINT `appointment_payments_master_appointment_id_foreign` FOREIGN KEY (`master_appointment_id`) REFERENCES `master_appointments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `appointment_payments_admin_id_foreign` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
