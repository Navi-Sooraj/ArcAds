-- ============================================================
-- Set createdAt and updatedAt to auto-fill (run once)
-- After this, INSERTs can omit these columns and MySQL will set them.
-- ============================================================
USE arcads;

ALTER TABLE Users
  MODIFY COLUMN createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  MODIFY COLUMN updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- If your columns are named created_at / updated_at instead, use:
-- ALTER TABLE Users
--   MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
--   MODIFY COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
