import { DataTypes } from 'sequelize';

/**
 * AdServiceInquiry model.
 * Stores dynamic booking inquiries for Ad Services.
 */
export default function AdServiceInquiry(sequelize) {
  const AdServiceInquiryModel = sequelize.define('AdServiceInquiry', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
    },
    serviceId: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    serviceTitle: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    formData: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'rejected', 'cancelled', 'completed'),
      defaultValue: 'pending',
    },
    isResubmitted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_resubmitted',
    },
  }, {
    tableName: 'AdServiceInquiries',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  });
  return AdServiceInquiryModel;
}
