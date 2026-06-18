import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface LeaveRequestApprovalAttributes {
  id: number;
  leaveRequestId: number;
  approverId: number;
  level: number;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
}

interface LeaveRequestApprovalCreationAttributes extends Optional<LeaveRequestApprovalAttributes, 'id' | 'status' | 'comment'> {}

class LeaveRequestApproval
  extends Model<LeaveRequestApprovalAttributes, LeaveRequestApprovalCreationAttributes>
  implements LeaveRequestApprovalAttributes
{
  public id!: number;
  public leaveRequestId!: number;
  public approverId!: number;
  public level!: number;
  public status!: 'pending' | 'approved' | 'rejected';
  public comment?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

LeaveRequestApproval.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    leaveRequestId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    approverId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    level: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'leave_request_approvals',
    timestamps: true,
    updatedAt: true,
    indexes: [
      {
        name: 'idx_approval_leave_request',
        fields: ['leaveRequestId'],
      },
      {
        name: 'idx_approval_approver',
        fields: ['approverId'],
      },
      {
        name: 'idx_approval_status',
        fields: ['leaveRequestId', 'status'],
      },
    ],
  }
);

export default LeaveRequestApproval;
