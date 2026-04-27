import { DataTypes } from 'sequelize';

/**
 * Review model.
 * User reviews for an AdSpace (or owner).
 */
export default function Review(sequelize) {
  const ReviewModel = sequelize.define('Review', {
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
    adSpaceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'AdSpaces', key: 'id' },
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 5 },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'Reviews',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  });
  return ReviewModel;
}
