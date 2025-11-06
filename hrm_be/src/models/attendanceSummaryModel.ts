import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";
import { EmployeeInformation } from "./employeeModel";

interface AttendanceSummaryAttributes {
  id: number;
  employee_id: number;
  summary_month: string; // "YYYY-MM"
  total_working_days: number;
  total_present_days: number;
  total_absent_days: number;
  total_late_days: number;
  total_early_days: number;
  total_leave_days: number;
  total_overtime_hours: number;
  total_actual_hours: number;
  created_at?: Date;
  updated_at?: Date;
}

interface AttendanceSummaryCreationAttributes
  extends Optional<
    AttendanceSummaryAttributes,
    | "id"
    | "total_working_days"
    | "total_present_days"
    | "total_absent_days"
    | "total_late_days"
    | "total_early_days"
    | "total_leave_days"
    | "total_overtime_hours"
    | "total_actual_hours"
    | "created_at"
    | "updated_at"
  > {}

class AttendanceSummary
  extends Model<
    AttendanceSummaryAttributes,
    AttendanceSummaryCreationAttributes
  >
  implements AttendanceSummaryAttributes
{
  declare id: number;
  declare employee_id: number;
  declare summary_month: string;
  declare total_working_days: number;
  declare total_present_days: number;
  declare total_absent_days: number;
  declare total_late_days: number;
  declare total_early_days: number;
  declare total_leave_days: number;
  declare total_overtime_hours: number;
  declare total_actual_hours: number;
  declare readonly created_at?: Date;
  declare readonly updated_at?: Date;
}

AttendanceSummary.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "employee_information", key: "id" },
      onDelete: "CASCADE",
    },
    summary_month: { type: DataTypes.STRING(7), allowNull: false },
    total_working_days: { type: DataTypes.INTEGER, defaultValue: 0 },
    total_present_days: { type: DataTypes.INTEGER, defaultValue: 0 },
    total_absent_days: { type: DataTypes.INTEGER, defaultValue: 0 },
    total_late_days: { type: DataTypes.INTEGER, defaultValue: 0 },
    total_early_days: { type: DataTypes.INTEGER, defaultValue: 0 },
    total_leave_days: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
    total_overtime_hours: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
    total_actual_hours: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: "attendance_summaries",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["employee_id", "summary_month"],
      },
    ],
  }
);

export default AttendanceSummary;
