import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/db";

interface HolidayAttributes {
  id: number;
  name: string;
  holidayDate: Date;
  year: number;
  isRecurring?: boolean;
  description?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

interface HolidayCreationAttributes
  extends Optional<
    HolidayAttributes,
    "id" | "isRecurring" | "description" | "created_at" | "updated_at"
  > {}

export class Holiday
  extends Model<HolidayAttributes, HolidayCreationAttributes>
  implements HolidayAttributes
{
  declare id: number;
  declare name: string;
  declare holidayDate: Date;
  declare year: number;
  declare isRecurring?: boolean;
  declare description?: string | null;
  declare created_at?: Date;
  declare updated_at?: Date;
}

Holiday.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    holidayDate: {
      field: "holiday_date",
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    isRecurring: {
      field: "is_recurring",
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "holidays",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default Holiday;
