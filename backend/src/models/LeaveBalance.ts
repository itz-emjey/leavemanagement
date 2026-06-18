import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface LeaveBalanceAttributes {
  id: number;
  employeeId: number;
  leaveTypeId: number;
  allocated: number;
  used: number;
  remaining: number;
  year: number;
}

interface LeaveBalanceCreationAttributes extends Optional<LeaveBalanceAttributes, 'id' | 'used' | 'remaining'> {}

class LeaveBalance extends Model<LeaveBalanceAttributes, LeaveBalanceCreationAttributes> implements LeaveBalanceAttributes {
  public id!: number;
  public employeeId!: number;
  public leaveTypeId!: number;
  public allocated!: number;
  public used!: number;
  public remaining!: number;
  public year!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

LeaveBalance.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    employeeId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    leaveTypeId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    allocated: {
      type: DataTypes.DECIMAL(6, 1),
      allowNull: false,
      defaultValue: 0,
    },
    used: {
      type: DataTypes.DECIMAL(6, 1),
      defaultValue: 0,
    },
    remaining: {
      type: DataTypes.DECIMAL(6, 1),
      defaultValue: 0,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'leave_balances',
    indexes: [
      {
        unique: true,
        fields: ['employeeId', 'leaveTypeId', 'year'],
      },
    ],
  }
);

export default LeaveBalance;
