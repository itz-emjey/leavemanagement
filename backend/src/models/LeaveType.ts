import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface LeaveTypeAttributes {
  id: number;
  name: string;
  description?: string;
  defaultDays: number;
  color: string;
}

interface LeaveTypeCreationAttributes extends Optional<LeaveTypeAttributes, 'id'> {}

class LeaveType extends Model<LeaveTypeAttributes, LeaveTypeCreationAttributes> implements LeaveTypeAttributes {
  public id!: number;
  public name!: string;
  public description?: string;
  public defaultDays!: number;
  public color!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

LeaveType.init(
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
      type: DataTypes.TEXT,
      allowNull: true,
    },
    defaultDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    color: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: '#3B82F6',
    },
  },
  {
    sequelize,
    tableName: 'leave_types',
  }
);

export default LeaveType;
