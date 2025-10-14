import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";
import { EmployeeInformation } from "./employeeModel";

interface PayrollAttributes {
  id: number;
  employee_id: number;
  period: string; // "YYYY-MM"
  base_salary: number;
  total_allowance?: number;
  total_overtime?: number;
  total_deduction?: number;
  gross_salary: number;
  net_salary: number;
  status?: "Pending" | "Paid" | "Cancelled";
  created_at?: Date;
  updated_at?: Date;
}

interface PayrollCreationAttributes
  extends Optional<
    PayrollAttributes,
    | "id"
    | "total_allowance"
    | "total_overtime"
    | "total_deduction"
    | "status"
    | "created_at"
    | "updated_at"
  > {}
class Payroll
  extends Model<PayrollAttributes, PayrollCreationAttributes>
  implements PayrollAttributes
{
  declare id: number;
  declare employee_id: number;
  declare period: string;
  declare base_salary: number;
  declare total_allowance?: number;
  declare total_overtime?: number;
  declare total_deduction?: number;
  declare gross_salary: number;
  declare net_salary: number;
  declare status?: "Pending" | "Paid" | "Cancelled";
  declare readonly created_at?: Date;
  declare readonly updated_at?: Date;
}

Payroll.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "employee_information", key: "id" },
    },
    period: { type: DataTypes.STRING(7), allowNull: false },
    base_salary: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    total_allowance: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    total_overtime: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    total_deduction: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    gross_salary: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    net_salary: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    status: {
      type: DataTypes.ENUM("Pending", "Paid", "Cancelled"),
      defaultValue: "Pending",
    },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: "payrolls",
    timestamps: false,
  }
);

// Quan hệ
Payroll.belongsTo(EmployeeInformation, { foreignKey: "employee_id" });

export default Payroll;
