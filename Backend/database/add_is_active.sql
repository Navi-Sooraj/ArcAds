-- ============================================================
-- Add is_active to Users (run once if you get "Unknown column 'is_active'" on register/login)
-- ============================================================
USE arcads;

-- Add column if your Users table was created without it (e.g. by an older Sequelize sync)
ALTER TABLE Users ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER avatar;

-- If you get "Duplicate column name 'is_active'", the column already exists—you're done.
