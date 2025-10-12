import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

// Attributes của LeaveType
interface LeaveTypeAttributes {
  id: number;
  name: string;
  description?: string;
  defaultDays: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Attributes dùng khi tạo mới LeaveType
interface LeaveTypeCreationAttributes
  extends Optional<
    LeaveTypeAttributes,
    "id" | "description" | "createdAt" | "updatedAt"
  > {}

// Class LeaveType kế thừa Model
class LeaveType
  extends Model<LeaveTypeAttributes, LeaveTypeCreationAttributes>
  implements LeaveTypeAttributes
{
  declare id: number;
  declare name: string;
  declare description?: string;
  declare defaultDays: number;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

// Init model
LeaveType.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    defaultDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "default_days",
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: "leave_types",
    timestamps: true,
    underscored: true,
  }
);

export { LeaveType, LeaveTypeAttributes, LeaveTypeCreationAttributes };
