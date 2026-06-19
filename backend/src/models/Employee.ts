import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Department from './Department';

interface EmployeeAttributes {
  id: number;
  userId?: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  departmentId: number;
  phone?: string;
  hireDate: Date;
  profilePicture?: string;
  signature?: string;
  managerId?: number;
  deletedAt?: Date;
  dateOfBirth?: string;
}

interface EmployeeCreationAttributes extends Optional<EmployeeAttributes, 'id' | 'profilePicture' | 'signature' | 'phone' | 'managerId' | 'deletedAt' | 'dateOfBirth'> {}

class Employee extends Model<EmployeeAttributes, EmployeeCreationAttributes> implements EmployeeAttributes {
  public id!: number;
  public userId?: number;
  public employeeId!: string;
  public firstName!: string;
  public lastName!: string;
  public email!: string;
  public position!: string;
  public departmentId!: number;
  public phone?: string;
  public hireDate!: Date;
  public profilePicture?: string;
  public signature?: string;
  public managerId?: number;
  public deletedAt?: Date;
  public dateOfBirth?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Employee.init(
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
    employeeId: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    position: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    departmentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: Department,
        key: 'id',
      },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    hireDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    profilePicture: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    signature: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
    },
    managerId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'employees',
    paranoid: true,
    indexes: [
      {
        name: 'idx_employees_department',
        fields: ['departmentId'],
      },
      {
        name: 'idx_employees_user',
        fields: ['userId'],
      },
      {
        name: 'idx_employees_manager',
        fields: ['managerId'],
      },
      {
        name: 'idx_employees_name_search',
        fields: ['firstName', 'lastName'],
      },
    ],
  }
);

export default Employee;
