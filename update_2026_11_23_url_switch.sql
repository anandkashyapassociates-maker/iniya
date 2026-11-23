-- ==============================================================
-- INIYA CLINICAL CARE SYSTEM: URL & SERVER SWITCH DATABASE UPDATE
-- Date: 23-Nov-2026
-- Description:
--   1. Create `url` table with `db_database` and `db_username` columns
--   2. Add columns if table already exists
--   3. Register migrations in `migrations` table
-- ==============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------------
-- 1. Create `url` Table if not exists
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `url` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `url` text NOT NULL,
  `db_database` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `db_username` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `previous_url` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `previous_db_database` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `previous_db_username` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------
-- 2. Add columns if table already existed without them
-- --------------------------------------------------------------
DROP PROCEDURE IF EXISTS `AddUrlColumnsIfNotExists`;
DELIMITER $$
CREATE PROCEDURE `AddUrlColumnsIfNotExists`()
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'url' AND COLUMN_NAME = 'db_database') THEN
    ALTER TABLE `url` ADD COLUMN `db_database` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `url`;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'url' AND COLUMN_NAME = 'db_username') THEN
    ALTER TABLE `url` ADD COLUMN `db_username` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `db_database`;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'url' AND COLUMN_NAME = 'previous_url') THEN
    ALTER TABLE `url` ADD COLUMN `previous_url` text COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `db_username`;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'url' AND COLUMN_NAME = 'previous_db_database') THEN
    ALTER TABLE `url` ADD COLUMN `previous_db_database` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `previous_url`;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'url' AND COLUMN_NAME = 'previous_db_username') THEN
    ALTER TABLE `url` ADD COLUMN `previous_db_username` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `previous_db_database`;
  END IF;
END $$
DELIMITER ;

CALL `AddUrlColumnsIfNotExists`();
DROP PROCEDURE IF EXISTS `AddUrlColumnsIfNotExists`;

-- --------------------------------------------------------------
-- 3. Insert or Update Default Record
-- --------------------------------------------------------------
INSERT INTO `url` (`url`, `db_database`, `db_username`, `previous_url`, `previous_db_database`, `previous_db_username`, `is_active`, `created_at`, `updated_at`)
SELECT 'https://funtesting.fun', 'iniya', 'root', 'http://localhost:5173', 'iniya', 'root', 0, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `url`);

-- --------------------------------------------------------------
-- 4. Register Migrations in Laravel `migrations` table
-- --------------------------------------------------------------
INSERT INTO `migrations` (`migration`, `batch`)
SELECT '2026_11_23_150000_create_url_table', IFNULL(MAX(batch), 0) + 1
FROM `migrations`
WHERE NOT EXISTS (
    SELECT 1 FROM `migrations` WHERE `migration` = '2026_11_23_150000_create_url_table'
);

INSERT INTO `migrations` (`migration`, `batch`)
SELECT '2026_11_23_161000_add_db_columns_to_url_table', IFNULL(MAX(batch), 0) + 1
FROM `migrations`
WHERE NOT EXISTS (
    SELECT 1 FROM `migrations` WHERE `migration` = '2026_11_23_161000_add_db_columns_to_url_table'
);

SET FOREIGN_KEY_CHECKS = 1;
