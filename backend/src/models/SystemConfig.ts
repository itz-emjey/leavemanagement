import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface SystemConfigAttributes {
  id: number;
  key: string;
  value: string;
  description?: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  group: 'general' | 'leave' | 'email' | 'system';
}

interface SystemConfigCreationAttributes extends Optional<SystemConfigAttributes, 'id' | 'description'> {}

class SystemConfig extends Model<SystemConfigAttributes, SystemConfigCreationAttributes> implements SystemConfigAttributes {
  public id!: number;
  public key!: string;
  public value!: string;
  public description?: string;
  public type!: 'string' | 'number' | 'boolean' | 'json';
  public group!: 'general' | 'leave' | 'email' | 'system';

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SystemConfig.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
      defaultValue: 'string',
    },
    group: {
      type: DataTypes.ENUM('general', 'leave', 'email', 'system'),
      defaultValue: 'general',
    },
  },
  {
    sequelize,
    tableName: 'system_configs',
    indexes: [
      {
        name: 'idx_system_config_key',
        unique: true,
        fields: ['key'],
      },
    ],
  }
);

export default SystemConfig;
