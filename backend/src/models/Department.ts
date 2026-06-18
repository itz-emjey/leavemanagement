import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface DepartmentAttributes {
  id: number;
  name: string;
  description?: string;
}

interface DepartmentCreationAttributes extends Optional<DepartmentAttributes, 'id'> {}

class Department extends Model<DepartmentAttributes, DepartmentCreationAttributes> implements DepartmentAttributes {
  public id!: number;
  public name!: string;
  public description?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Department.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
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
    tableName: 'departments',
  }
);

export default Department;
