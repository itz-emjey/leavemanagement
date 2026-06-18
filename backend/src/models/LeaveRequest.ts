import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface LeaveRequestAttributes {
  id: number;
  employeeId: number;
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  duration: number;
  durationType?: 'full' | 'half' | 'hourly';
  startTime?: string;
  endTime?: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approverId?: number;
  rejectionReason?: string;
  attachment?: string;
}

interface LeaveRequestCreationAttributes extends Optional<LeaveRequestAttributes, 'id' | 'reason' | 'durationType' | 'startTime' | 'endTime' | 'approverId' | 'rejectionReason' | 'attachment'> {}

class LeaveRequest extends Model<LeaveRequestAttributes, LeaveRequestCreationAttributes> implements LeaveRequestAttributes {
  public id!: number;
  public employeeId!: number;
  public leaveTypeId!: number;
  public startDate!: string;
  public endDate!: string;
  public duration!: number;
  public reason?: string;
  public status!: 'pending' | 'approved' | 'rejected' | 'cancelled';
  public approverId?: number;
  public rejectionReason?: string;
  public attachment?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

LeaveRequest.init(
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
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    duration: {
      type: DataTypes.DECIMAL(4, 1),
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    durationType: {
      type: DataTypes.ENUM('full', 'half', 'hourly'),
      defaultValue: 'full',
    },
    startTime: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    endTime: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'),
      defaultValue: 'pending',
    },
    approverId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    attachment: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'leave_requests',
    indexes: [
      {
        name: 'idx_leave_requests_employee_status',
        fields: ['employeeId', 'status'],
      },
      {
        name: 'idx_leave_requests_employee_dates',
        fields: ['employeeId', 'startDate'],
      },
      {
        name: 'idx_leave_requests_status_date',
        fields: ['status', 'startDate'],
      },
    ],
  }
);

export default LeaveRequest;
