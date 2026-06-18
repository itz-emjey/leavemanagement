import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Role from './Role';

export interface PermissionAttributes {
  id: number;
  roleId: number;
  resource: string;
  action: string;
  allowed: boolean;
}

interface PermissionCreationAttributes extends Optional<PermissionAttributes, 'id'> {}

class Permission extends Model<PermissionAttributes, PermissionCreationAttributes> implements PermissionAttributes {
  public id!: number;
  public roleId!: number;
  public resource!: string;
  public action!: string;
  public allowed!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Permission.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    roleId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: Role,
        key: 'id',
      },
    },
    resource: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    allowed: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'permissions',
    indexes: [
      {
        name: 'idx_permissions_role_resource',
        unique: true,
        fields: ['roleId', 'resource', 'action'],
      },
    ],
  }
);

export default Permission;
