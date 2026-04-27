-- Add Payments table for dummy payment module
-- Run after schema_unified.sql or on existing arcads DB: mysql -u root -p arcads < Backend/database/add_payments.sql

USE arcads;

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

SELECT 'Payments table created.' AS message;
