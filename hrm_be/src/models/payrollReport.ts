import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";
import { EmployeeInformation } from "./employeeModel";
import { Department } from "./departmentModel";

interface PayrollReportAttributes {
  id: number;
  report_name: string;
  report_type: "monthly" | "quarterly" | "yearly" | "custom";
  period: string; // "YYYY-MM"
  department_id?: number | null;
  generated_by: number;
  report_data: object;
  file_path?: string | null;
  status?: "generating" | "completed" | "failed";
  created_at?: Date;
  updated_at?: Date;
}

interface PayrollReportCreationAttributes
  extends Optional<
    PayrollReportAttributes,
    | "id"
    | "department_id"
    | "file_path"
    | "status"
    | "created_at"
    | "updated_at"
  > {}

class PayrollReport
  extends Model<PayrollReportAttributes, PayrollReportCreationAttributes>
  implements PayrollReportAttributes
{
  declare id: number;
  declare report_name: string;
  declare report_type: "monthly" | "quarterly" | "yearly" | "custom";
  declare period: string;
  declare department_id?: number | null;
  declare generated_by: number;
  declare report_data: object;
  declare file_path?: string | null;
  declare status?: "generating" | "completed" | "failed";
  declare readonly created_at?: Date;
  declare readonly updated_at?: Date;
}

PayrollReport.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    report_name: { type: DataTypes.STRING(255), allowNull: false },
    report_type: {
      type: DataTypes.ENUM("monthly", "quarterly", "yearly", "custom"),
      allowNull: false,
    },
    period: { type: DataTypes.STRING(7), allowNull: false },
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "departments", key: "id" },
      onDelete: "SET NULL",
    },
    generated_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "employee_information", key: "id" },
      onDelete: "CASCADE",
    },
    report_data: { type: DataTypes.JSON, allowNull: false },
    file_path: { type: DataTypes.STRING(500), allowNull: true },
    status: {
      type: DataTypes.ENUM("generating", "completed", "failed"),
      defaultValue: "generating",
    },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: "payroll_reports",
    timestamps: false,
  }
);

export default PayrollReport;
