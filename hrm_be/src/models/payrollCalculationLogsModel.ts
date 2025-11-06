import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

interface PayrollCalculationLogAttributes {
  id: number;
  payrollId: number;
  calculationStep: string;
  inputData: object | null;
  outputData: object | null;
  calculationTime: number | null;
  success: boolean;
  errorMessage: string | null;
  createdAt: Date;
}

interface PayrollCalculationLogCreationAttributes
  extends Optional<
    PayrollCalculationLogAttributes,
    | "id"
    | "inputData"
    | "outputData"
    | "calculationTime"
    | "success"
    | "errorMessage"
    | "createdAt"
  > {}

export class PayrollCalculationLog
  extends Model<
    PayrollCalculationLogAttributes,
    PayrollCalculationLogCreationAttributes
  >
  implements PayrollCalculationLogAttributes
{
  public id!: number;
  public payrollId!: number;
  public calculationStep!: string;
  public inputData!: object | null;
  public outputData!: object | null;
  public calculationTime!: number | null;
  public success!: boolean;
  public errorMessage!: string | null;
  public readonly createdAt!: Date;
}

PayrollCalculationLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    payrollId: {
      field: "payroll_id",
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "payrolls",
        key: "id",
      },
    },
    calculationStep: {
      field: "calculation_step",
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100],
      },
    },
    inputData: {
      field: "input_data",
      type: DataTypes.JSONB,
      allowNull: true,
    },
    outputData: {
      field: "output_data",
      type: DataTypes.JSONB,
      allowNull: true,
    },
    calculationTime: {
      field: "calculation_time",
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    success: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    errorMessage: {
      field: "error_message",
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      field: "created_at",
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "payroll_calculation_logs",
    timestamps: false,
    underscored: true,
    indexes: [
      {
        fields: ["payroll_id"],
        name: "idx_payroll_logs_payroll",
      },
      {
        fields: ["calculation_step"],
        name: "idx_payroll_logs_step",
      },
      {
        fields: ["success"],
        name: "idx_payroll_logs_success",
      },
      {
        fields: ["created_at"],
        name: "idx_payroll_logs_created",
      },
    ],
  }
);

export default PayrollCalculationLog;
