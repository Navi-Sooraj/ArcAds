import { DataTypes } from 'sequelize';

export default function AdService(sequelize) {
  return sequelize.define('AdService', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    category: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(160),
      allowNull: false,
    },
    subtitle: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    image: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
    },
    images: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
    },
    examples: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
    },
    features: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
    },
    color: {
      type: DataTypes.STRING(32),
      allowNull: true,
    },
    lightColor: {
      type: DataTypes.STRING(32),
      allowNull: true,
      field: 'light_color',
    },
    icon: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    bookingFields: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
      field: 'booking_fields',
    },
    criteriaValues: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
      field: 'criteria_values',
    },
    pricingConfig: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      field: 'pricing_config',
    },
    availableFrom: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'available_from',
    },
    availableTo: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'available_to',
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'created_by',
      references: { model: 'Users', key: 'id' },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
  }, {
    tableName: 'AdServices',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });
}
