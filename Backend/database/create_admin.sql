-- ============================================================
-- Create admin account for ArcAds
-- Run in MySQL:  mysql -u root -p arcads < Backend/database/create_admin.sql
-- Or in Workbench: open this file and execute
-- ============================================================
USE arcads;

-- Insert admin (skip if email already exists)
-- createdAt and updatedAt are set automatically by the database
INSERT INTO Users (name, email, password, phone, role, is_active)
VALUES ('Admin', 'admin@arcads.com', 'admin123', NULL, 'admin', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role), is_active = VALUES(is_active);

SELECT 'Admin account ready.' AS message;
SELECT id, name, email, role FROM Users WHERE role = 'admin';
