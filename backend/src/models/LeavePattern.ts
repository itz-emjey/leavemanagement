import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface LeavePatternAttributes {
  id: number;
  employeeId: number;
  leaveTypeId: number;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  weekOfMonth?: number; // 1-4 for monthly (first-fourth week)
  startDate: string;
  endDate?: string;
  status: 'active' | 'paused' | 'cancelled';
  reason?: string;
}

interface LeavePatternCreationAttributes extends Optional<LeavePatternAttributes, 'id' | 'weekOfMonth' | 'endDate' | 'status' | 'reason'> {}

class LeavePattern extends Model<LeavePatternAttributes, LeavePatternCreationAttributes> implements LeavePatternAttributes {
  public id!: number;
  public employeeId!: number;
  public leaveTypeId!: number;
  public frequency!: 'weekly' | 'biweekly' | 'monthly';
  public dayOfWeek!: number;
  public weekOfMonth?: number;
  public startDate!: string;
  public endDate?: string;
  public status!: 'active' | 'paused' | 'cancelled';
  public reason?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

LeavePattern.init(
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
    frequency: {
      type: DataTypes.ENUM('weekly', 'biweekly', 'monthly'),
      allowNull: false,
    },
    dayOfWeek: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      validate: { min: 0, max: 6 },
    },
    weekOfMonth: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: true,
      validate: { min: 1, max: 4 },
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'paused', 'cancelled'),
      defaultValue: 'active',
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'leave_patterns',
    indexes: [
      {
        name: 'idx_leave_patterns_employee',
        fields: ['employeeId'],
      },
      {
        name: 'idx_leave_patterns_status',
        fields: ['status'],
      },
    ],
  }
);

export default LeavePattern;
