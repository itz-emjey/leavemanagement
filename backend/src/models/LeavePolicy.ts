import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import LeaveType from './LeaveType';

interface LeavePolicyAttributes {
  id: number;
  leaveTypeId: number;
  maxConsecutiveDays: number;
  minNoticeDays: number;
  carryOverLimit: number;
  requiresApproval: boolean;
  isActive: boolean;
  accrualRule: 'none' | 'monthly' | 'quarterly' | 'yearly';
}

interface LeavePolicyCreationAttributes extends Optional<LeavePolicyAttributes, 'id' | 'accrualRule'> {}

class LeavePolicy extends Model<LeavePolicyAttributes, LeavePolicyCreationAttributes> implements LeavePolicyAttributes {
  public id!: number;
  public leaveTypeId!: number;
  public maxConsecutiveDays!: number;
  public minNoticeDays!: number;
  public carryOverLimit!: number;
  public requiresApproval!: boolean;
  public isActive!: boolean;
  public accrualRule!: 'none' | 'monthly' | 'quarterly' | 'yearly';

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

LeavePolicy.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    leaveTypeId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: LeaveType,
        key: 'id',
      },
    },
    maxConsecutiveDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 15,
    },
    minNoticeDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    carryOverLimit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
    },
    requiresApproval: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    accrualRule: {
      type: DataTypes.ENUM('none', 'monthly', 'quarterly', 'yearly'),
      defaultValue: 'none',
    },
  },
  {
    sequelize,
    tableName: 'leave_policies',
  }
);

export default LeavePolicy;
