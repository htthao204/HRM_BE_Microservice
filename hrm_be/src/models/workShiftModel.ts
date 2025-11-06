import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/db";

export interface WorkShiftAttributes {
  id: number;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  breakStart?: string | null;
  breakEnd?: string | null;
  totalHours: number;
  isNightShift?: boolean;
  isActive?: boolean;
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WorkShiftCreationAttributes
  extends Optional<
    WorkShiftAttributes,
    "id" | "createdAt" | "updatedAt" | "isNightShift" | "isActive"
  > {}

export class WorkShift
  extends Model<WorkShiftAttributes, WorkShiftCreationAttributes>
  implements WorkShiftAttributes
{
  declare id: number;
  declare code: string;
  declare name: string;
  declare startTime: string;
  declare endTime: string;
  declare breakStart?: string | null;
  declare breakEnd?: string | null;
  declare totalHours: number;
  declare isNightShift?: boolean;
  declare isActive?: boolean;
  declare description?: string | null;
  declare createdAt?: Date;
  declare updatedAt?: Date;
}

WorkShift.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    startTime: {
      field: "start_time",
      type: DataTypes.TIME,
      allowNull: false,
    },
    endTime: {
      field: "end_time",
      type: DataTypes.TIME,
      allowNull: false,
    },
    breakStart: {
      field: "break_start",
      type: DataTypes.TIME,
      allowNull: true,
    },
    breakEnd: {
      field: "break_end",
      type: DataTypes.TIME,
      allowNull: true,
    },
    totalHours: {
      field: "total_hours",
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    isNightShift: {
      field: "is_night_shift",
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isActive: {
      field: "is_active",
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      field: "created_at",
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: "updated_at",
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "work_shifts",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default WorkShift;
