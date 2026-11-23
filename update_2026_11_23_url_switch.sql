-- ==============================================================
-- INIYA CLINICAL CARE SYSTEM: URL SWITCH DATABASE UPDATE
-- Date: 23-Nov-2026
-- Description:
--   1. Create `url` table for superadmin URL switcher
--   2. Safe default record insertion
--   3. Register migration in `migrations` table
-- ==============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------------
-- 1. Create `url` Table
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `url` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `url` text NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------
-- 2. Insert Default Record if Table is Empty
-- --------------------------------------------------------------
INSERT INTO `url` (`url`, `is_active`, `created_at`, `updated_at`)
SELECT 'https://apptesting.fun', 0, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `url`);

-- --------------------------------------------------------------
-- 3. Register Migration in Laravel `migrations` table
-- --------------------------------------------------------------
INSERT INTO `migrations` (`migration`, `batch`)
SELECT '2026_11_23_150000_create_url_table', IFNULL(MAX(batch), 0) + 1
FROM `migrations`
WHERE NOT EXISTS (
    SELECT 1 FROM `migrations` WHERE `migration` = '2026_11_23_150000_create_url_table'
);

SET FOREIGN_KEY_CHECKS = 1;
