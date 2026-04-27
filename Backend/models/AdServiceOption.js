import { DataTypes } from 'sequelize';

export default function AdServiceOption(sequelize) {
  return sequelize.define('AdServiceOption', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    category: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    fieldKey: {
      type: DataTypes.STRING(80),
      allowNull: false,
      field: 'field_key',
    },
    optionValue: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'option_value',
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'created_by',
      references: { model: 'Users', key: 'id' },
    },
  }, {
    tableName: 'AdServiceOptions',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['category', 'field_key', 'option_value'],
        name: 'uniq_adservice_option',
      },
    ],
  });
}
