import { DataTypes } from 'sequelize';

/**
 * Booking model.
 * Links advertiser, ad space, and date range.
 */
export default function Booking(sequelize) {
  const BookingModel = sequelize.define('Booking', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    advertiserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
    },
    adSpaceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'AdSpaces', key: 'id' },
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'rejected', 'cancelled', 'completed'),
      defaultValue: 'pending',
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    /** Digital screen: purchased airtime in seconds */
    totalSeconds: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'total_seconds',
    },
    /** Advertiser-uploaded creative path (photo or video) */
    creativeUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'creative_url',
    },
    isResubmitted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_resubmitted',
    },
  }, {
    tableName: 'Bookings',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  });
  return BookingModel;
}
