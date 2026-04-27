-- ============================================================
-- ArcAds – Add more sellers (space owners) and ad places
-- Run after you have at least the admin user.
-- Sellers get auto IDs; ad spaces are linked to them.
-- ============================================================
USE arcads;

-- ============================================================
-- 1. Sellers (space_owner) – no ID so auto_increment assigns
-- ============================================================
INSERT INTO Users (name, email, password, phone, role, is_active)
VALUES
('Ravi Kumar', 'ravi.seller@example.com', 'pass123', '9123456701', 'space_owner', 1),
('Priya Sharma', 'priya.seller@example.com', 'pass123', '9123456702', 'space_owner', 1),
('Amit Singh', 'amit.seller@example.com', 'pass123', '9123456703', 'space_owner', 1);

-- 2. Ad places – owned by the three sellers we just added (last 3 user IDs)
-- Columns: title, description, location, ad_type, width, height, price_per_day, image_url, owner_id, verified (no city)
INSERT INTO AdSpaces (title, description, location, ad_type, width, height, price_per_day, image_url, owner_id, verified)
SELECT 'Indiranagar Metro Billboard', 'High-traffic billboard opposite Indiranagar metro. Ideal for brands.', 'Indiranagar 12th Main, Bangalore', 'billboard', 8.00, 4.00, 4500.00, NULL, id, 1
FROM (SELECT id FROM Users WHERE role = 'space_owner' ORDER BY id DESC LIMIT 1 OFFSET 2) AS t
UNION ALL
SELECT 'Electronic City Hoarding', 'Large hoarding on Hosur Road. 24/7 visibility.', 'Electronic City Phase 1, Bangalore', 'hoarding', 15.00, 5.00, 6000.00, NULL, id, 0
FROM (SELECT id FROM Users WHERE role = 'space_owner' ORDER BY id DESC LIMIT 1 OFFSET 2) AS t
UNION ALL
SELECT 'Jayanagar Digital Display', 'LED display at busy shopping area.', 'Jayanagar 4th Block, Bangalore', 'digital_screen', 5.00, 3.00, 7500.00, NULL, id, 1
FROM (SELECT id FROM Users WHERE role = 'space_owner' ORDER BY id DESC LIMIT 1 OFFSET 1) AS t
UNION ALL
SELECT 'Malleshwaram Wall Painting', 'Premium wall painting near railway station.', 'Malleshwaram 8th Cross, Bangalore', 'wall_painting', 20.00, 4.00, 4000.00, NULL, id, 1
FROM (SELECT id FROM Users WHERE role = 'space_owner' ORDER BY id DESC LIMIT 1 OFFSET 1) AS t
UNION ALL
SELECT 'HSR Layout Billboard', 'Corner billboard at HSR Layout junction.', 'HSR Layout Sector 2, Bangalore', 'billboard', 10.00, 5.00, 5500.00, NULL, id, 1
FROM (SELECT id FROM Users WHERE role = 'space_owner' ORDER BY id DESC LIMIT 1 OFFSET 0) AS t
UNION ALL
SELECT 'Koramangala Hoarding', 'Prime hoarding near Forum Mall.', 'Koramangala 80 Feet Road, Bangalore', 'hoarding', 12.00, 4.00, 7000.00, NULL, id, 0
FROM (SELECT id FROM Users WHERE role = 'space_owner' ORDER BY id DESC LIMIT 1 OFFSET 0) AS t;

SELECT 'Sellers and ad places added.' AS message;
SELECT COUNT(*) AS total_users FROM Users;
SELECT COUNT(*) AS total_ad_spaces FROM AdSpaces;
