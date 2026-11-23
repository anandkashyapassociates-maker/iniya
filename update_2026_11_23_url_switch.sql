-- ==============================================================
-- INIYA CLINICAL CARE SYSTEM: URL & SERVER SWITCH DATABASE UPDATE
-- Date: 23-Nov-2026
-- Description:
--   1. Create `url` table with ONLY: `api_url`, `db_database`, `db_username`, `db_password`
--   2. Drop `is_active` or previous_* columns if they existed
--   3. Register migrations in Laravel `migrations` table
-- ==============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------------
-- 1. Create or Restructure `url` Table
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `url` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `api_url` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `db_database` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `db_username` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `db_password` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------
-- 2. Cleanup / Alignment Procedure for existing installations
-- --------------------------------------------------------------
DROP PROCEDURE IF EXISTS `AlignUrlTableStructure`;
DELIMITER $$
CREATE PROCEDURE `AlignUrlTableStructure`()
BEGIN
  -- Rename url to api_url if needed
  IF EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'url' AND COLUMN_NAME = 'url') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'url' AND COLUMN_NAME = 'api_url') THEN
    ALTER TABLE `url` CHANGE COLUMN `url` `api_url` text COLLATE utf8mb4_unicode_ci NOT NULL;
  END IF;

  -- Ensure api_url column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'url' AND COLUMN_NAME = 'api_url') THEN
    ALTER TABLE `url` ADD COLUMN `api_url` text COLLATE utf8mb4_unicode_ci NOT NULL AFTER `id`;
  END IF;

  -- Ensure db_database column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'url' AND COLUMN_NAME = 'db_database') THEN
    ALTER TABLE `url` ADD COLUMN `db_database` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `api_url`;
  END IF;

  -- Ensure db_username column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'url' AND COLUMN_NAME = 'db_username') THEN
    ALTER TABLE `url` ADD COLUMN `db_username` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `db_database`;
  END IF;

  -- Ensure db_password column exists and is TEXT
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'url' AND COLUMN_NAME = 'db_password') THEN
    ALTER TABLE `url` ADD COLUMN `db_password` text COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `db_username`;
  ELSE
    ALTER TABLE `url` MODIFY COLUMN `db_password` text COLLATE utf8mb4_unicode_ci DEFAULT NULL;
  END IF;

  -- Drop is_active if it exists
  IF EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'url' AND COLUMN_NAME = 'is_active') THEN
    ALTER TABLE `url` DROP COLUMN `is_active`;
  END IF;

  -- Drop previous_* columns if they exist
  IF EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'url' AND COLUMN_NAME = 'previous_url') THEN
    ALTER TABLE `url` DROP COLUMN `previous_url`;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'url' AND COLUMN_NAME = 'previous_db_database') THEN
    ALTER TABLE `url` DROP COLUMN `previous_db_database`;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'url' AND COLUMN_NAME = 'previous_db_username') THEN
    ALTER TABLE `url` DROP COLUMN `previous_db_username`;
  END IF;
END $$
DELIMITER ;

CALL `AlignUrlTableStructure`();
DROP PROCEDURE IF EXISTS `AlignUrlTableStructure`;

-- --------------------------------------------------------------
-- 3. Ensure Default Initial Row
-- --------------------------------------------------------------
INSERT INTO `url` (`id`, `api_url`, `db_database`, `db_username`, `db_password`, `created_at`, `updated_at`)
SELECT 1, 'http://localhost:5173', 'iniya', 'root', '', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `url`);

-- --------------------------------------------------------------
-- 4. Register Migrations in Laravel `migrations` table
-- --------------------------------------------------------------
INSERT INTO `migrations` (`migration`, `batch`)
SELECT '2026_11_23_150000_create_url_table', IFNULL(MAX(batch), 0) + 1
FROM `migrations`
WHERE NOT EXISTS (SELECT 1 FROM `migrations` WHERE `migration` = '2026_11_23_150000_create_url_table');

INSERT INTO `migrations` (`migration`, `batch`)
SELECT '2026_11_23_161000_add_db_columns_to_url_table', IFNULL(MAX(batch), 0) + 1
FROM `migrations`
WHERE NOT EXISTS (SELECT 1 FROM `migrations` WHERE `migration` = '2026_11_23_161000_add_db_columns_to_url_table');

INSERT INTO `migrations` (`migration`, `batch`)
SELECT '2026_11_23_163000_restructure_url_table_columns', IFNULL(MAX(batch), 0) + 1
FROM `migrations`
WHERE NOT EXISTS (SELECT 1 FROM `migrations` WHERE `migration` = '2026_11_23_163000_restructure_url_table_columns');

INSERT INTO `migrations` (`migration`, `batch`)
SELECT '2026_11_23_170000_add_db_password_to_url_table', IFNULL(MAX(batch), 0) + 1
FROM `migrations`
WHERE NOT EXISTS (SELECT 1 FROM `migrations` WHERE `migration` = '2026_11_23_170000_add_db_password_to_url_table');

INSERT INTO `migrations` (`migration`, `batch`)
SELECT '2026_11_23_173000_change_db_password_column_to_text_in_url_table', IFNULL(MAX(batch), 0) + 1
FROM `migrations`
WHERE NOT EXISTS (SELECT 1 FROM `migrations` WHERE `migration` = '2026_11_23_173000_change_db_password_column_to_text_in_url_table');

INSERT INTO `migrations` (`migration`, `batch`)
SELECT '2026_11_23_164000_remove_is_active_from_url_table', IFNULL(MAX(batch), 0) + 1
FROM `migrations`
WHERE NOT EXISTS (SELECT 1 FROM `migrations` WHERE `migration` = '2026_11_23_164000_remove_is_active_from_url_table');

SET FOREIGN_KEY_CHECKS = 1;
