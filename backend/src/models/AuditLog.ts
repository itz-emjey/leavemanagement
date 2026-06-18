import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface AuditLogAttributes {
  id: number;
  userId?: number;
  action: string;
  entity: string;
  entityId?: number;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}

interface AuditLogCreationAttributes extends Optional<AuditLogAttributes, 'id'> {}

class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> implements AuditLogAttributes {
  public id!: number;
  public userId?: number;
  public action!: string;
  public entity!: string;
  public entityId?: number;
  public details?: string;
  public ipAddress?: string;
  public userAgent?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

AuditLog.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    entity: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    entityId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'audit_logs',
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        name: 'idx_audit_logs_user',
        fields: ['userId'],
      },
      {
        name: 'idx_audit_logs_action_entity',
        fields: ['action', 'entity'],
      },
      {
        name: 'idx_audit_logs_created',
        fields: ['createdAt'],
      },
    ],
  }
);

export default AuditLog;
