import { DataTypes } from 'sequelize';

/**
 * AdSpace model – Marketplace schema.
 * Table: AdSpaces
 * Columns: id, title, description, city, location, ad_type, width, height,
 *          price_per_day, price_per_second, image_url, video_url, owner_id, verified, created_at, updated_at
 */
export default function AdSpace(sequelize) {
  const AdSpaceModel = sequelize.define('AdSpace', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    adType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'ad_type',
    },
    width: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    height: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    pricePerDay: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'price_per_day',
    },
    pricePerSecond: {
      type: DataTypes.DECIMAL(12, 4),
      allowNull: true,
      field: 'price_per_second',
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'image_url',
    },
    videoUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'video_url',
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
    slotDuration: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'slot_duration',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    mediaUrls: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'media_urls',
      get() {
        const val = this.getDataValue('mediaUrls');
        if (!val) return [];
        if (Array.isArray(val)) return val;
        try {
          let parsed = typeof val === 'string' ? JSON.parse(val) : val;
          // Handle cases where it might have been stringified multiple times
          while (typeof parsed === 'string') {
            parsed = JSON.parse(parsed);
          }
          return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          return [];
        }
      },
      set(val) {
        // Only stringify if it's not already a string
        const toStore = Array.isArray(val) ? JSON.stringify(val) : (val || '[]');
        this.setDataValue('mediaUrls', toStore);
      },
    },
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'owner_id',
      references: { model: 'Users', key: 'id' },
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    verificationStatus: {
      type: DataTypes.ENUM('pending', 'verified', 'rejected'),
      defaultValue: 'pending',
      field: 'verification_status',
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'rejection_reason',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
    adminDeactivated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'admin_deactivated',
    },
    reactivationRequested: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'reactivation_requested',
    },
  }, {
    tableName: 'AdSpaces',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });
  return AdSpaceModel;
}
