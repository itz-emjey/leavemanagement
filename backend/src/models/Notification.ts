import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface NotificationAttributes {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  link?: string;
  isRead: boolean;
  isEmailSent: boolean;
}

interface NotificationCreationAttributes extends Optional<NotificationAttributes, 'id' | 'isRead' | 'isEmailSent'> {}

class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
  public id!: number;
  public userId!: number;
  public title!: string;
  public message!: string;
  public type!: string;
  public link?: string;
  public isRead!: boolean;
  public isEmailSent!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Notification.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'info',
    },
    link: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isEmailSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'notifications',
    indexes: [
      {
        name: 'idx_notifications_user_read',
        fields: ['userId', 'isRead'],
      },
      {
        name: 'idx_notifications_created',
        fields: ['createdAt'],
      },
    ],
  }
);

export default Notification;
