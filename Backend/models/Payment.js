import { DataTypes } from 'sequelize';

/**
 * Payment model (dummy / demo).
 * One payment per booking; stores card last4 and dummy transaction id.
 */
export default function Payment(sequelize) {
  const PaymentModel = sequelize.define('Payment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    bookingId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Bookings', key: 'id' },
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'INR',
    },
    status: {
      type: DataTypes.ENUM('pending', 'success', 'failed', 'refunded'),
      allowNull: false,
      defaultValue: 'pending',
    },
    paymentMethod: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'card',
    },
    cardLast4: {
      type: DataTypes.STRING(4),
      allowNull: true,
    },
    transactionId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Dummy gateway reference',
    },
  }, {
    tableName: 'Payments',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  });
  return PaymentModel;
}
