import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface RoleAttributes {
  id: number;
  name: string;
  description?: string;
}

interface RoleCreationAttributes extends Optional<RoleAttributes, 'id'> {}

class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
  public id!: number;
  public name!: string;
  public description?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Role.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'roles',
  }
);

export default Role;
