-- ============================================================
-- ArcAds – Insert ad spaces only (no new users)
-- Requires at least one user with role = 'space_owner'. All spaces use that owner.
-- Columns used: title, description, location, ad_type, width, height, price_per_day, image_url, owner_id, verified
-- ============================================================
USE arcads;

INSERT INTO AdSpaces (title, description, location, ad_type, width, height, price_per_day, image_url, owner_id, verified)
SELECT 'MG Road Prime Billboard', 'Premium billboard on MG Road. High footfall.', 'MG Road, Bangalore', 'billboard', 10.00, 5.00, 5000.00, NULL, id, 1 FROM (SELECT id FROM Users WHERE role = 'space_owner' LIMIT 1) AS o
UNION ALL
SELECT 'Koramangala LED Screen', 'Digital screen at 80 Feet Road junction.', 'Koramangala, Bangalore', 'digital_screen', 6.00, 3.00, 8000.00, NULL, id, 1 FROM (SELECT id FROM Users WHERE role = 'space_owner' LIMIT 1) AS o
UNION ALL
SELECT 'Whitefield Hoarding', 'Large hoarding on ITPL Road.', 'Whitefield, Bangalore', 'hoarding', 12.00, 4.00, 3500.00, NULL, id, 0 FROM (SELECT id FROM Users WHERE role = 'space_owner' LIMIT 1) AS o
UNION ALL
SELECT 'Indiranagar Wall Art', 'Creative wall painting near metro.', 'Indiranagar, Bangalore', 'wall_painting', 15.00, 4.00, 4500.00, NULL, id, 1 FROM (SELECT id FROM Users WHERE role = 'space_owner' LIMIT 1) AS o
UNION ALL
SELECT 'HSR Layout Billboard', 'Corner visibility at HSR Sector 2.', 'HSR Layout, Bangalore', 'billboard', 8.00, 4.00, 4200.00, NULL, id, 1 FROM (SELECT id FROM Users WHERE role = 'space_owner' LIMIT 1) AS o
UNION ALL
SELECT 'Jayanagar Hoarding', 'Busy market area hoarding.', 'Jayanagar 4th Block, Bangalore', 'hoarding', 10.00, 5.00, 5500.00, NULL, id, 1 FROM (SELECT id FROM Users WHERE role = 'space_owner' LIMIT 1) AS o;

SELECT 'Ad spaces inserted.' AS message;
SELECT COUNT(*) AS total_ad_spaces FROM AdSpaces;
