/**
 * Sequelize models index.
 * Initializes all models, sets up associations, and exports them.
 * Call initModels(sequelize) after sequelize is created, then sync if needed.
 */
import { sequelize } from '../config/database.js';
import User from './User.js';
import AdSpace from './AdSpace.js';
import Booking from './Booking.js';
import Review from './Review.js';
import Notification from './Notification.js';
import Payment from './Payment.js';
import AdTemplate from './AdTemplate.js';
import AdService from './AdService.js';
import AdServiceOption from './AdServiceOption.js';
import AdServiceInquiry from './AdServiceInquiry.js';

// Initialize models with sequelize
const models = {
  User: User(sequelize),
  AdSpace: AdSpace(sequelize),
  Booking: Booking(sequelize),
  Review: Review(sequelize),
  Notification: Notification(sequelize),
  Payment: Payment(sequelize),
  AdTemplate: AdTemplate(sequelize),
  AdService: AdService(sequelize),
  AdServiceOption: AdServiceOption(sequelize),
  AdServiceInquiry: AdServiceInquiry(sequelize),
};

// Associations
// User (owner) -> AdSpaces
models.AdSpace.belongsTo(models.User, { foreignKey: 'ownerId' });
models.User.hasMany(models.AdSpace, { foreignKey: 'ownerId' });

// User (advertiser) -> Bookings | AdSpace -> Bookings
models.Booking.belongsTo(models.User, { foreignKey: 'advertiserId' });
models.User.hasMany(models.Booking, { foreignKey: 'advertiserId' });
models.Booking.belongsTo(models.AdSpace, { foreignKey: 'adSpaceId' });
models.AdSpace.hasMany(models.Booking, { foreignKey: 'adSpaceId' });

// Payments: Booking -> Payment (one payment per booking for dummy flow)
models.Payment.belongsTo(models.Booking, { foreignKey: 'bookingId' });
models.Booking.hasMany(models.Payment, { foreignKey: 'bookingId' });

// Reviews: User (reviewer) -> Review -> AdSpace or User (reviewee)
models.Review.belongsTo(models.User, { foreignKey: 'userId' });
models.User.hasMany(models.Review, { foreignKey: 'userId' });
models.Review.belongsTo(models.AdSpace, { foreignKey: 'adSpaceId' });
models.AdSpace.hasMany(models.Review, { foreignKey: 'adSpaceId' });

// Notifications: User -> Notifications
models.Notification.belongsTo(models.User, { foreignKey: 'userId' });
models.User.hasMany(models.Notification, { foreignKey: 'userId' });

// Ad templates (created by admin)
models.AdTemplate.belongsTo(models.User, { foreignKey: 'createdBy' });
models.User.hasMany(models.AdTemplate, { foreignKey: 'createdBy' });

// Ad services (created by admin)
models.AdService.belongsTo(models.User, { foreignKey: 'createdBy' });
models.User.hasMany(models.AdService, { foreignKey: 'createdBy' });
models.AdServiceOption.belongsTo(models.User, { foreignKey: 'createdBy' });
models.User.hasMany(models.AdServiceOption, { foreignKey: 'createdBy' });

// Ad service inquiries
models.AdServiceInquiry.belongsTo(models.User, { foreignKey: 'userId' });
models.User.hasMany(models.AdServiceInquiry, { foreignKey: 'userId' });

export { sequelize };
export default models;
