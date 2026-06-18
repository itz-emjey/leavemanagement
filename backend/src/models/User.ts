import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Role from './Role';

interface UserAttributes {
  id: number;
  email: string;
  password: string;
  roleId: number;
  isActive: boolean;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'isActive'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public email!: string;
  public password!: string;
  public roleId!: number;
  public isActive!: boolean;
  public resetPasswordToken?: string;
  public resetPasswordExpires?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    roleId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: Role,
        key: 'id',
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    resetPasswordToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    resetPasswordExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'users',
    indexes: [
      {
        name: 'idx_users_role',
        fields: ['roleId'],
      },
      {
        name: 'idx_users_active_role',
        fields: ['isActive', 'roleId'],
      },
      {
        name: 'idx_users_reset_token',
        fields: ['resetPasswordToken'],
      },
    ],
  }
);

export default User;
