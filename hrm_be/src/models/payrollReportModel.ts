import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";
import { Department } from "./departmentModel";

interface PayrollReportAttributes {
  id: number;
  reportName: string;
  reportType: "monthly" | "quarterly" | "yearly" | "custom";
  period: string;
  departmentId: number | null;
  generatedBy: number;
  reportData: object;
  filePath: string | null;
  status: "generating" | "completed" | "failed";
  createdAt: Date;
  updatedAt: Date;
}

interface PayrollReportCreationAttributes
  extends Optional<
    PayrollReportAttributes,
    "id" | "departmentId" | "filePath" | "status" | "createdAt" | "updatedAt"
  > {}

export class PayrollReport
  extends Model<PayrollReportAttributes, PayrollReportCreationAttributes>
  implements PayrollReportAttributes
{
  public id!: number;
  public reportName!: string;
  public reportType!: "monthly" | "quarterly" | "yearly" | "custom";
  public period!: string;
  public departmentId!: number | null;
  public generatedBy!: number;
  public reportData!: object;
  public filePath!: string | null;
  public status!: "generating" | "completed" | "failed";
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PayrollReport.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    reportName: {
      field: "report_name",
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255],
      },
    },
    reportType: {
      field: "report_type",
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [["monthly", "quarterly", "yearly", "custom"]],
      },
    },
    period: {
      type: DataTypes.STRING(7),
      allowNull: false,
      validate: {
        is: /^[0-9]{4}-[0-9]{2}$/, // YYYY-MM format
      },
    },
    departmentId: {
      field: "department_id",
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "departments",
        key: "id",
      },
    },
    generatedBy: {
      field: "generated_by",
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "employee_information",
        key: "id",
      },
    },
    reportData: {
      field: "report_data",
      type: DataTypes.JSONB,
      allowNull: false,
    },
    filePath: {
      field: "file_path",
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "generating",
      validate: {
        isIn: [["generating", "completed", "failed"]],
      },
    },
    createdAt: {
      field: "created_at",
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      field: "updated_at",
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "payroll_reports",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ["report_type"],
        name: "idx_payroll_reports_type",
      },
      {
        fields: ["period"],
        name: "idx_payroll_reports_period",
      },
      {
        fields: ["department_id"],
        name: "idx_payroll_reports_department",
      },
      {
        fields: ["generated_by"],
        name: "idx_payroll_reports_generator",
      },
      {
        fields: ["status"],
        name: "idx_payroll_reports_status",
      },
      {
        fields: ["created_at"],
        name: "idx_payroll_reports_created",
      },
    ],
  }
);

export default PayrollReport;
