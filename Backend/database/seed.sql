-- ============================================================
-- ArcAds – Seed data for testing
-- Run after schema.sql. Uses fixed IDs – best on a fresh DB.
--
-- From MySQL client:
--   mysql -u root -p arcads < Backend/database/seed.sql
-- Or in MySQL Workbench / CLI: source path/to/seed.sql
-- ============================================================

USE arcads;

USE arcads;

USE arcads;

-- Add is_active if your Users table was created without it (e.g. by Sequelize).
-- If you get "Duplicate column name 'is_active'", skip the next line and run the INSERTs.
ALTER TABLE Users ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER avatar;

-- ============================================================
-- 1. Users (admin, advertiser, space_owner)
-- ============================================================
INSERT INTO Users (id, name, email, password, phone, role, is_active) VALUES
(1, 'Admin', 'admin@arcads.com', 'admin123', NULL, 'admin', 1),
(2, 'Advertiser One', 'advertiser@test.com', 'pass123', '9876543210', 'advertiser', 1),
(3, 'Space Owner One', 'owner@test.com', 'pass123', '9876543211', 'space_owner', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role);

-- ============================================================
-- 2. Ad Spaces (owned by user 3 – Space Owner)
-- ============================================================
INSERT INTO AdSpaces (id, title, description, city, location, ad_type, width, height, price_per_day, image_url, owner_id, verified) VALUES
(1, 'Billboard at MG Road', 'Prime billboard near metro station. High visibility.', 'Bangalore', 'MG Road', 'billboard', 10.00, 5.00, 5000.00, 'https://via.placeholder.com/400x200?text=MG+Road', 3, 1),
(2, 'Digital Screen – Koramangala', 'LED digital screen at busy junction.', 'Bangalore', 'Koramangala 5th Block', 'digital_screen', 6.00, 3.00, 8000.00, 'https://via.placeholder.com/400x200?text=Digital+Screen', 3, 1),
(3, 'Hoarding – Whitefield', 'Large hoarding on main road.', 'Bangalore', 'Whitefield Main Road', 'hoarding', 12.00, 4.00, 3500.00, NULL, 3, 0)
ON DUPLICATE KEY UPDATE title = VALUES(title), city = VALUES(city), price_per_day = VALUES(price_per_day), verified = VALUES(verified);

-- ============================================================
-- 3. Bookings (advertiser 2 books spaces 1 and 2)
-- ============================================================
INSERT INTO Bookings (id, advertiserId, adSpaceId, startDate, endDate, totalAmount, status, notes) VALUES
(1, 2, 1, '2025-03-10', '2025-03-15', 30000.00, 'confirmed', 'Campaign launch'),
(2, 2, 2, '2025-03-20', '2025-03-22', 24000.00, 'pending', NULL)
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- ============================================================
-- Optional: Reviews (user 2 reviewed ad space 1)
-- ============================================================
INSERT INTO Reviews (id, userId, adSpaceId, rating, comment) VALUES
(1, 2, 1, 5, 'Great visibility, campaign performed well.')
ON DUPLICATE KEY UPDATE comment = VALUES(comment);

SELECT 'Seed data inserted.' AS message;
SELECT COUNT(*) AS users FROM Users;
SELECT COUNT(*) AS ad_spaces FROM AdSpaces;
SELECT COUNT(*) AS bookings FROM Bookings;
