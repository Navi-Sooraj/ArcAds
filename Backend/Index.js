/**
 * ArcAds Backend – Entry point.
 * Connects to MySQL via Sequelize, syncs models, mounts API routes.
 */
import dotenv from 'dotenv';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';
import { runDailyMaintenance } from './scripts/automation.js';
import { connectDatabase, sequelize } from './config/database.js';
import models from './models/index.js';
import authRoutes from './routes/auth.js';
import { getUsers } from './controllers/authController.js';
import adSpaceRoutes from './routes/adSpaces.js';
import bookingRoutes from './routes/bookings.js';
import partnerRoutes from './routes/partners.js';
import adminRoutes from './routes/admin.js';
import reviewRoutes from './routes/reviews.js';
import notificationRoutes from './routes/notifications.js';
import templateRoutes from './routes/templates.js';
import aiRoutes from './routes/ai.js';
import adServiceRoutes from './routes/adServices.js';
import adServiceInquiryRoutes from './routes/adServiceInquiries.js';
import publicRoutes from './routes/public.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load env from Backend/.env regardless of shell working directory.
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/auth', authRoutes);
app.get('/api/users', getUsers);
app.use('/api/adspaces', adSpaceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ad-services', adServiceRoutes);
app.use('/api/ad-service-inquiries', adServiceInquiryRoutes);
app.use('/api/public', publicRoutes);

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'ArcAds API' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not found.' });
});

// Global error handler – log and return 500 so we can see what failed
app.use((err, req, res, next) => {
  if (err?.name === 'MulterError' || /image file must be an image|video file must be a video|file must be a video/i.test(String(err?.message || ''))) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Invalid file upload.',
    });
  }
  if (err?.type === 'entity.too.large' || String(err?.message || '').toLowerCase().includes('request entity too large')) {
    return res.status(413).json({
      success: false,
      message: 'Uploaded payload is too large. Please reduce image/video size or upload fewer files.',
    });
  }
  console.error('Server error:', err.message || err);
  if (err.stack) console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

async function start() {
  try {
    await connectDatabase();
    await models.User.sync();
    await models.AdSpace.sync();
    await models.Booking.sync();
    await models.Payment.sync();
    await models.Review.sync();
    await models.Notification.sync();
    await models.AdTemplate.sync();
    await models.AdService.sync();
    await models.AdServiceOption.sync();
    await models.AdServiceInquiry.sync();
    const [adServiceCols] = await sequelize.query('SHOW COLUMNS FROM `AdServices`;');
    const colNames = new Set((adServiceCols || []).map((c) => c.Field));
    if (!colNames.has('available_from')) {
      await sequelize.query('ALTER TABLE `AdServices` ADD COLUMN `available_from` DATE NULL AFTER `pricing_config`;');
    }
    if (!colNames.has('available_to')) {
      await sequelize.query('ALTER TABLE `AdServices` ADD COLUMN `available_to` DATE NULL AFTER `available_from`;');
    }
    if (!colNames.has('images')) {
      await sequelize.query("ALTER TABLE `AdServices` ADD COLUMN `images` LONGTEXT NULL AFTER `image`;");
      await sequelize.query("UPDATE `AdServices` SET `images` = JSON_ARRAY(`image`) WHERE `images` IS NULL AND `image` IS NOT NULL;");
      await sequelize.query("UPDATE `AdServices` SET `images` = '[]' WHERE `images` IS NULL;");
      await sequelize.query("ALTER TABLE `AdServices` MODIFY COLUMN `images` LONGTEXT NOT NULL;");
    }
    if (!colNames.has('is_active')) {
      await sequelize.query('ALTER TABLE `AdServices` ADD COLUMN `is_active` TINYINT(1) DEFAULT 1 AFTER `created_by`;');
    }
    const [adSpaceCols] = await sequelize.query('SHOW COLUMNS FROM `AdSpaces`;');
    const adSpaceColNames = new Set((adSpaceCols || []).map((c) => c.Field));
    if (!adSpaceColNames.has('video_url')) {
      await sequelize.query('ALTER TABLE `AdSpaces` ADD COLUMN `video_url` VARCHAR(500) NULL AFTER `image_url`;');
    }
    if (!adSpaceColNames.has('price_per_second')) {
      await sequelize.query('ALTER TABLE `AdSpaces` ADD COLUMN `price_per_second` DECIMAL(12,4) NULL AFTER `price_per_day`;');
    }
    if (!adSpaceColNames.has('available_from')) {
      await sequelize.query('ALTER TABLE `AdSpaces` ADD COLUMN `available_from` DATE NULL AFTER `video_url`;');
    }
    if (!adSpaceColNames.has('available_to')) {
      await sequelize.query('ALTER TABLE `AdSpaces` ADD COLUMN `available_to` DATE NULL AFTER `available_from`;');
    }
    if (!adSpaceColNames.has('slot_duration')) {
      await sequelize.query('ALTER TABLE `AdSpaces` ADD COLUMN `slot_duration` VARCHAR(50) NULL AFTER `available_to`;');
    }
    if (!adSpaceColNames.has('notes')) {
      await sequelize.query('ALTER TABLE `AdSpaces` ADD COLUMN `notes` TEXT NULL AFTER `slot_duration`;');
    }
    if (!adSpaceColNames.has('media_urls')) {
      await sequelize.query('ALTER TABLE `AdSpaces` ADD COLUMN `media_urls` LONGTEXT NULL AFTER `notes`;');
    }
    if (!adSpaceColNames.has('is_active')) {
      await sequelize.query('ALTER TABLE `AdSpaces` ADD COLUMN `is_active` TINYINT(1) DEFAULT 1 AFTER `verified`;');
    }
    if (!adSpaceColNames.has('admin_deactivated')) {
      await sequelize.query('ALTER TABLE `AdSpaces` ADD COLUMN `admin_deactivated` TINYINT(1) DEFAULT 0 AFTER `is_active`;');
    }
    if (!adSpaceColNames.has('reactivation_requested')) {
      await sequelize.query('ALTER TABLE `AdSpaces` ADD COLUMN `reactivation_requested` TINYINT(1) DEFAULT 0 AFTER `admin_deactivated`;');
    }
    const [bookingCols] = await sequelize.query('SHOW COLUMNS FROM `Bookings`;');
    const bookingColNames = new Set((bookingCols || []).map((c) => c.Field));
    if (!bookingColNames.has('title')) {
      await sequelize.query('ALTER TABLE `Bookings` ADD COLUMN `title` VARCHAR(255) NULL AFTER `status`;');
      await sequelize.query("UPDATE `Bookings` SET `title` = 'Untitled Ad' WHERE `title` IS NULL;");
      await sequelize.query('ALTER TABLE `Bookings` MODIFY COLUMN `title` VARCHAR(255) NOT NULL;');
    }
    if (!bookingColNames.has('description')) {
      await sequelize.query('ALTER TABLE `Bookings` ADD COLUMN `description` TEXT NULL AFTER `title`;');
    }
    if (!bookingColNames.has('total_seconds')) {
      await sequelize.query('ALTER TABLE `Bookings` ADD COLUMN `total_seconds` INT NULL AFTER `notes`;');
    }
    if (!bookingColNames.has('creative_url')) {
      if (bookingColNames.has('creative_video_url')) {
        await sequelize.query('ALTER TABLE `Bookings` CHANGE COLUMN `creative_video_url` `creative_url` VARCHAR(500) NULL;');
      } else {
        await sequelize.query('ALTER TABLE `Bookings` ADD COLUMN `creative_url` VARCHAR(500) NULL AFTER `total_seconds`;');
      }
    }
    if (!bookingColNames.has('is_resubmitted')) {
      await sequelize.query('ALTER TABLE `Bookings` ADD COLUMN `is_resubmitted` TINYINT(1) DEFAULT 0 AFTER `creative_url`;');
    }

    const [inquiryCols] = await sequelize.query('SHOW COLUMNS FROM `AdServiceInquiries`;');
    const inquiryColNames = new Set((inquiryCols || []).map((c) => c.Field));
    if (!inquiryColNames.has('is_resubmitted')) {
      await sequelize.query('ALTER TABLE `AdServiceInquiries` ADD COLUMN `is_resubmitted` TINYINT(1) DEFAULT 0 AFTER `status`;');
    }
    // Update status ENUM for AdServiceInquiries
    await sequelize.query("ALTER TABLE `AdServiceInquiries` MODIFY COLUMN `status` ENUM('pending', 'confirmed', 'rejected', 'cancelled', 'completed') DEFAULT 'pending';");
    
    // Ensure Bookings status ENUM also includes cancelled
    await sequelize.query("ALTER TABLE `Bookings` MODIFY COLUMN `status` ENUM('pending', 'confirmed', 'rejected', 'cancelled', 'completed') DEFAULT 'pending';");


    if (!adSpaceColNames.has('verification_status')) {
      await sequelize.query("ALTER TABLE `AdSpaces` ADD COLUMN `verification_status` ENUM('pending', 'verified', 'rejected') DEFAULT 'pending' AFTER `verified`;");
      // Migrate existing data
      await sequelize.query("UPDATE `AdSpaces` SET `verification_status` = 'verified' WHERE `verified` = 1;");
      await sequelize.query("UPDATE `AdSpaces` SET `verification_status` = 'pending' WHERE `verified` = 0;");
    }
    if (!adSpaceColNames.has('rejection_reason')) {
      await sequelize.query("ALTER TABLE `AdSpaces` ADD COLUMN `rejection_reason` TEXT NULL AFTER `verification_status`;");
    }
    console.log('Models synced.');
    app.listen(PORT, () => {
      console.log(`ArcAds server running on http://localhost:${PORT}`);
      
      // Schedule daily maintenance (at midnight)
      cron.schedule('0 0 * * *', () => {
        runDailyMaintenance();
      });

      // Run once on startup
      runDailyMaintenance();
    });
  } catch (err) {
    console.error('Startup error:', err);
    process.exit(1);
  }
}

start();
