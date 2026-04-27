import { DataTypes } from 'sequelize';

/**
 * User model.
 * Roles: advertiser | space_owner | admin
 * Auth: simple email + password (no hashing per requirements).
 */
export default function User(sequelize) {
  const UserModel = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('advertiser', 'space_owner', 'admin'),
      allowNull: false,
      defaultValue: 'advertiser',
    },
    avatar: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
  }, {
    tableName: 'Users',
    timestamps: true,
    underscored: false,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  });
  return UserModel;
}
