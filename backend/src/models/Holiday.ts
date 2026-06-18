import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface HolidayAttributes {
  id: number;
  name: string;
  date: string;
  isRecurring: boolean;
  type: string;
}

interface HolidayCreationAttributes extends Optional<HolidayAttributes, 'id'> {}

class Holiday extends Model<HolidayAttributes, HolidayCreationAttributes> implements HolidayAttributes {
  public id!: number;
  public name!: string;
  public date!: string;
  public isRecurring!: boolean;
  public type!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Holiday.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    isRecurring: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'public',
    },
  },
  {
    sequelize,
    tableName: 'holidays',
    indexes: [
      {
        name: 'idx_holidays_date',
        fields: ['date'],
      },
      {
        name: 'idx_holidays_type',
        fields: ['type'],
      },
    ],
  }
);

export default Holiday;
