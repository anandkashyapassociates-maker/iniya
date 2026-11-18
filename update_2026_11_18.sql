-- ==============================================================================
-- INIYA CLINIC MANAGEMENT SYSTEM - DATABASE UPDATE SCRIPT
-- Date: 18-Nov-2026
-- Description: 
--   1. Update `payouts` table to support Sales Team Payouts (`sales_member_id` & `payout_type`).
--   2. Ensure `appointment_sessions` has `executed_by_staff_id` & `consultation_fee`.
--   3. Data backfill for `executed_by_staff_id` on closed/in-progress sessions.
--   4. Ensure `master_appointments` has `sales_commission`.
--   5. Sync Laravel migrations table record.
-- ==============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 1. PAYOUTS TABLE: SUPPORT SALES TEAM PAYOUTS
-- ------------------------------------------------------------------------------

-- (A) Change payout_type to VARCHAR(50) so 'sales' type can be inserted without enum constraints
ALTER TABLE `payouts` 
MODIFY COLUMN `payout_type` VARCHAR(50) NOT NULL;

-- (B) Add sales_member_id column to payouts if it does not already exist
-- For MySQL 8.0.29+ / MariaDB 10.2+:
ALTER TABLE `payouts` 
ADD COLUMN IF NOT EXISTS `sales_member_id` BIGINT UNSIGNED NULL AFTER `vendor_id`;

-- Add foreign key constraint for sales_member_id (safe execution)
SET @fk_exists = (
    SELECT COUNT(*) 
    FROM information_schema.TABLE_CONSTRAINTS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'payouts' 
      AND CONSTRAINT_NAME = 'payouts_sales_member_id_foreign'
);

SET @sql_payouts_fk = IF(@fk_exists = 0,
    'ALTER TABLE `payouts` ADD CONSTRAINT `payouts_sales_member_id_foreign` FOREIGN KEY (`sales_member_id`) REFERENCES `sales_members` (`id`) ON DELETE SET NULL;',
    'SELECT "payouts_sales_member_id_foreign already exists";'
);
PREPARE stmt_payouts_fk FROM @sql_payouts_fk;
EXECUTE stmt_payouts_fk;
DEALLOCATE PREPARE stmt_payouts_fk;


-- ------------------------------------------------------------------------------
-- 2. APPOINTMENT SESSIONS TABLE: EXECUTED BY STAFF & CONSULTATION FEE
-- ------------------------------------------------------------------------------

-- (A) Ensure executed_by_staff_id and consultation_fee columns exist
ALTER TABLE `appointment_sessions` 
ADD COLUMN IF NOT EXISTS `executed_by_staff_id` BIGINT UNSIGNED NULL AFTER `staff_id`,
ADD COLUMN IF NOT EXISTS `consultation_fee` DECIMAL(10,2) NULL AFTER `service_id`;

-- (B) Add foreign key constraint for executed_by_staff_id if not exists
SET @fk_session_exists = (
    SELECT COUNT(*) 
    FROM information_schema.TABLE_CONSTRAINTS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'appointment_sessions' 
      AND CONSTRAINT_NAME = 'appointment_sessions_executed_by_staff_id_foreign'
);

SET @sql_session_fk = IF(@fk_session_exists = 0,
    'ALTER TABLE `appointment_sessions` ADD CONSTRAINT `appointment_sessions_executed_by_staff_id_foreign` FOREIGN KEY (`executed_by_staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL;',
    'SELECT "appointment_sessions_executed_by_staff_id_foreign already exists";'
);
PREPARE stmt_session_fk FROM @sql_session_fk;
EXECUTE stmt_session_fk;
DEALLOCATE PREPARE stmt_session_fk;

-- (C) Data Backfill: Set executed_by_staff_id = staff_id for sessions already marked completed, in_progress, or cancelled
UPDATE `appointment_sessions` 
SET `executed_by_staff_id` = `staff_id` 
WHERE `executed_by_staff_id` IS NULL 
  AND `status` IN ('completed', 'in_progress', 'cancelled') 
  AND `staff_id` IS NOT NULL;


-- ------------------------------------------------------------------------------
-- 3. MASTER APPOINTMENTS TABLE: SALES COMMISSION
-- ------------------------------------------------------------------------------

ALTER TABLE `master_appointments` 
ADD COLUMN IF NOT EXISTS `sales_commission` DECIMAL(10,2) NULL DEFAULT 0.00 AFTER `sales_team_id`;


-- ------------------------------------------------------------------------------
-- 4. LARAVEL MIGRATIONS TABLE SYNC (Optional, but ensures Laravel migration sync)
-- ------------------------------------------------------------------------------

INSERT INTO `migrations` (`migration`, `batch`) 
SELECT '2026_11_18_115945_add_sales_member_id_to_payouts_table', IFNULL(MAX(batch), 0) + 1 
FROM `migrations`
WHERE NOT EXISTS (
    SELECT 1 FROM `migrations` WHERE `migration` = '2026_11_18_115945_add_sales_member_id_to_payouts_table'
);

INSERT INTO `migrations` (`migration`, `batch`) 
SELECT '2026_11_16_182500_add_executed_by_and_consultation_fee_to_appointment_sessions', IFNULL(MAX(batch), 0) + 1 
FROM `migrations`
WHERE NOT EXISTS (
    SELECT 1 FROM `migrations` WHERE `migration` = '2026_11_16_182500_add_executed_by_and_consultation_fee_to_appointment_sessions'
);

INSERT INTO `migrations` (`migration`, `batch`) 
SELECT '2026_11_16_181000_add_sales_commission_to_master_appointments_table', IFNULL(MAX(batch), 0) + 1 
FROM `migrations`
WHERE NOT EXISTS (
    SELECT 1 FROM `migrations` WHERE `migration` = '2026_11_16_181000_add_sales_commission_to_master_appointments_table'
);

SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================================================
-- SCRIPT COMPLETED SUCCESSFULLY
-- ==============================================================================
