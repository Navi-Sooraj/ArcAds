-- ============================================================
-- ArcAds – Complete MySQL Schema (run manually)
-- Database: arcads
-- Tables: Users, AdSpaces, Bookings, Reviews, Notifications
-- ============================================================

-- Create database
CREATE DATABASE IF NOT EXISTS arcads
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE arcads;

-- ============================================================
-- 1. Users
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
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. AdSpaces
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
-- (Sequelize model uses camelCase column names)
-- API mapping: user_id → advertiserId, adspace_id → adSpaceId,
-- start_date → startDate, end_date → endDate, total_price → totalAmount,
-- status: pending | approved (stored as confirmed) | rejected
-- ============================================================
CREATE TABLE IF NOT EXISTS Bookings (
  id             INT            NOT NULL AUTO_INCREMENT,
  advertiserId   INT            NOT NULL,
  adSpaceId     INT            NOT NULL,
  startDate     DATE           NOT NULL,
  endDate       DATE           NOT NULL,
  totalAmount   DECIMAL(12,2)  NOT NULL,
  status         ENUM('pending', 'confirmed', 'rejected', 'cancelled', 'completed') NOT NULL DEFAULT 'pending',
  notes          TEXT           DEFAULT NULL,
  createdAt      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_bookings_advertiser (advertiserId),
  KEY idx_bookings_ad_space (adSpaceId),
  KEY idx_bookings_status (status),
  CONSTRAINT fk_bookings_advertiser FOREIGN KEY (advertiserId) REFERENCES Users (id) ON DELETE CASCADE,
  CONSTRAINT fk_bookings_ad_space   FOREIGN KEY (adSpaceId)   REFERENCES AdSpaces (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. Reviews
-- (Sequelize model uses camelCase column names)
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
  CONSTRAINT fk_reviews_ad_space FOREIGN KEY (adSpaceId) REFERENCES AdSpaces (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. Notifications
-- (Sequelize model uses camelCase column names)
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
-- Optional: sample admin user (password: admin123)
-- ============================================================
-- INSERT INTO Users (name, email, password, phone, role, created_at, updated_at)
-- VALUES ('Admin', 'admin@arcads.com', 'admin123', NULL, 'admin', NOW(), NOW());
