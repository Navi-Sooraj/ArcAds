-- ============================================================
-- ArcAds – Unified database schema
-- Matches Sequelize models exactly. Run this to create a fresh DB.
--
-- Usage:
--   mysql -u root -p < Backend/database/schema_unified.sql
-- Or open in MySQL Workbench and execute.
-- ============================================================

CREATE DATABASE IF NOT EXISTS arcads
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE arcads;

-- ============================================================
-- 1. Users
-- Model: createdAt/updatedAt (camelCase), isActive -> is_active
-- ============================================================
CREATE TABLE IF NOT EXISTS Users (
  id            INT          NOT NULL AUTO_INCREMENT,
  name          VARCHAR(255) DEFAULT NULL,
  email         VARCHAR(255) NOT NULL,
  password      VARCHAR(255) NOT NULL,
  phone         VARCHAR(50)  DEFAULT NULL,
  role          ENUM('advertiser', 'space_owner', 'admin') NOT NULL DEFAULT 'advertiser',
  avatar        VARCHAR(500) DEFAULT NULL,
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  createdAt     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. AdSpaces
-- Model: underscored -> created_at/updated_at, ad_type, price_per_day, image_url, owner_id
-- ============================================================
CREATE TABLE IF NOT EXISTS AdSpaces (
  id             INT            NOT NULL AUTO_INCREMENT,
  title          VARCHAR(255)   NOT NULL,
  description    TEXT           DEFAULT NULL,
  city           VARCHAR(100)   DEFAULT NULL,
  location       VARCHAR(500)   DEFAULT NULL,
  ad_type        VARCHAR(50)    DEFAULT NULL,
  width          DECIMAL(10,2)  DEFAULT NULL,
  height         DECIMAL(10,2)  DEFAULT NULL,
  price_per_day  DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
  image_url      VARCHAR(500)   DEFAULT NULL,
  owner_id       INT            NOT NULL,
  verified       TINYINT(1)     NOT NULL DEFAULT 0,
  created_at     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_adspaces_owner_id (owner_id),
  KEY idx_adspaces_city (city),
  KEY idx_adspaces_ad_type (ad_type),
  CONSTRAINT fk_adspaces_owner FOREIGN KEY (owner_id) REFERENCES Users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. Bookings
-- Model: camelCase columns (advertiserId, adSpaceId, startDate, endDate, totalAmount, createdAt, updatedAt)
-- ============================================================
CREATE TABLE IF NOT EXISTS Bookings (
  id             INT            NOT NULL AUTO_INCREMENT,
  advertiserId   INT            NOT NULL,
  adSpaceId      INT            NOT NULL,
  startDate      DATE           NOT NULL,
  endDate        DATE           NOT NULL,
  totalAmount    DECIMAL(12,2)  NOT NULL,
  status         ENUM('pending', 'confirmed', 'rejected', 'cancelled', 'completed') NOT NULL DEFAULT 'pending',
  notes          TEXT           DEFAULT NULL,
  createdAt      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_bookings_advertiser (advertiserId),
  KEY idx_bookings_ad_space (adSpaceId),
  KEY idx_bookings_status (status),
  CONSTRAINT fk_bookings_advertiser FOREIGN KEY (advertiserId) REFERENCES Users (id) ON DELETE CASCADE,
  CONSTRAINT fk_bookings_ad_space   FOREIGN KEY (adSpaceId)  REFERENCES AdSpaces (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3b. Payments (dummy payment per booking)
-- ============================================================
CREATE TABLE IF NOT EXISTS Payments (
  id             INT            NOT NULL AUTO_INCREMENT,
  bookingId      INT            NOT NULL,
  amount         DECIMAL(12,2)  NOT NULL,
  currency       VARCHAR(10)    NOT NULL DEFAULT 'INR',
  status         ENUM('pending','success','failed','refunded') NOT NULL DEFAULT 'pending',
  paymentMethod  VARCHAR(50)    NOT NULL DEFAULT 'card',
  cardLast4      VARCHAR(4)     DEFAULT NULL,
  transactionId  VARCHAR(100)   DEFAULT NULL,
  createdAt      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_payments_booking (bookingId),
  CONSTRAINT fk_payments_booking FOREIGN KEY (bookingId) REFERENCES Bookings (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. Reviews
-- Model: userId, adSpaceId, createdAt, updatedAt (camelCase)
-- ============================================================
CREATE TABLE IF NOT EXISTS Reviews (
  id          INT      NOT NULL AUTO_INCREMENT,
  userId      INT      NOT NULL,
  adSpaceId   INT      NOT NULL,
  rating      INT      NOT NULL,
  comment     TEXT     DEFAULT NULL,
  createdAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_reviews_user (userId),
  KEY idx_reviews_ad_space (adSpaceId),
  CONSTRAINT chk_reviews_rating CHECK (rating >= 1 AND rating <= 5),
  CONSTRAINT fk_reviews_user     FOREIGN KEY (userId)     REFERENCES Users (id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_ad_space  FOREIGN KEY (adSpaceId)  REFERENCES AdSpaces (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. Notifications
-- Model: userId, isRead, createdAt, updatedAt (camelCase)
-- ============================================================
CREATE TABLE IF NOT EXISTS Notifications (
  id          INT          NOT NULL AUTO_INCREMENT,
  userId      INT          NOT NULL,
  title       VARCHAR(255) NOT NULL,
  message     TEXT         DEFAULT NULL,
  type        VARCHAR(50)  DEFAULT NULL,
  link        VARCHAR(500) DEFAULT NULL,
  isRead      TINYINT(1)   NOT NULL DEFAULT 0,
  createdAt   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notifications_user (userId),
  CONSTRAINT fk_notifications_user FOREIGN KEY (userId) REFERENCES Users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Optional: create admin user (password: admin123)
-- ============================================================
-- INSERT INTO Users (name, email, password, phone, role, is_active)
-- VALUES ('Admin', 'admin@arcads.com', 'admin123', NULL, 'admin', 1);

SELECT 'ArcAds database and tables created.' AS message;
