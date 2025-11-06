import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

interface PayrollAttributes {
  id: number;
  employeeId: number;
  period: string;
  baseSalary: number;
  totalAllowance?: number;
  totalOvertime?: number;
  totalBonus?: number;
  totalDeduction?: number;
  grossSalary: number;
  netSalary: number;
  totalWorkingDays?: number;
  totalActualHours?: number;
  totalLateDeduction?: number;
  totalAbsentDeduction?: number;
  taxAmount?: number;
  socialInsuranceAmount?: number;
  healthInsuranceAmount?: number;
  unemploymentInsuranceAmount?: number;
  unionFeeAmount?: number;
  taxableIncome?: number;
  calculationDetails?: any; // JSON type
  status?: "draft" | "calculated" | "approved" | "paid" | "cancelled";
  paidDate?: Date | null;
  approvedBy?: number | null;
  approvedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PayrollCreationAttributes
  extends Optional<
    PayrollAttributes,
    | "id"
    | "totalAllowance"
    | "totalOvertime"
    | "totalBonus"
    | "totalDeduction"
    | "totalWorkingDays"
    | "totalActualHours"
    | "totalLateDeduction"
    | "totalAbsentDeduction"
    | "taxAmount"
    | "socialInsuranceAmount"
    | "healthInsuranceAmount"
    | "unemploymentInsuranceAmount"
    | "unionFeeAmount"
    | "taxableIncome"
    | "calculationDetails"
    | "status"
    | "paidDate"
    | "approvedBy"
    | "approvedAt"
    | "createdAt"
    | "updatedAt"
  > {}

class Payroll
  extends Model<PayrollAttributes, PayrollCreationAttributes>
  implements PayrollAttributes
{
  declare id: number;
  declare employeeId: number;
  declare period: string;
  declare baseSalary: number;
  declare totalAllowance?: number;
  declare totalOvertime?: number;
  declare totalBonus?: number;
  declare totalDeduction?: number;
  declare grossSalary: number;
  declare netSalary: number;
  declare totalWorkingDays?: number;
  declare totalActualHours?: number;
  declare totalLateDeduction?: number;
  declare totalAbsentDeduction?: number;
  declare taxAmount?: number;
  declare socialInsuranceAmount?: number;
  declare healthInsuranceAmount?: number;
  declare unemploymentInsuranceAmount?: number;
  declare unionFeeAmount?: number;
  declare taxableIncome?: number;
  declare calculationDetails?: any;
  declare status?: "draft" | "calculated" | "approved" | "paid" | "cancelled";
  declare paidDate?: Date | null;
  declare approvedBy?: number | null;
  declare approvedAt?: Date | null;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

Payroll.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    employeeId: {
      field: "employee_id",
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "employee_information",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    period: {
      type: DataTypes.STRING(7),
      allowNull: false,
      validate: {
        is: /^[0-9]{4}-[0-9]{2}$/, // Format: YYYY-MM
      },
    },
    baseSalary: {
      field: "base_salary",
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    totalAllowance: {
      field: "total_allowance",
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    totalOvertime: {
      field: "total_overtime",
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    totalBonus: {
      field: "total_bonus",
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    totalDeduction: {
      field: "total_deduction",
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    grossSalary: {
      field: "gross_salary",
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    netSalary: {
      field: "net_salary",
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    totalWorkingDays: {
      field: "total_working_days",
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    totalActualHours: {
      field: "total_actual_hours",
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    totalLateDeduction: {
      field: "total_late_deduction",
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    totalAbsentDeduction: {
      field: "total_absent_deduction",
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    taxAmount: {
      field: "tax_amount",
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    socialInsuranceAmount: {
      field: "social_insurance_amount",
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    healthInsuranceAmount: {
      field: "health_insurance_amount",
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    unemploymentInsuranceAmount: {
      field: "unemployment_insurance_amount",
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    unionFeeAmount: {
      field: "union_fee_amount",
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    taxableIncome: {
      field: "taxable_income",
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    calculationDetails: {
      field: "calculation_details",
      type: DataTypes.JSON,
    },
    status: {
      type: DataTypes.ENUM(
        "draft",
        "calculated",
        "approved",
        "paid",
        "cancelled"
      ),
      defaultValue: "draft",
    },
    paidDate: {
      field: "paid_date",
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    approvedBy: {
      field: "approved_by",
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "employee_information",
        key: "id",
      },
      onDelete: "SET NULL",
    },
    approvedAt: {
      field: "approved_at",
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "payrolls",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        unique: true,
        fields: ["employee_id", "period"], // UNIQUE constraint
      },
      {
        fields: ["period", "status"], // Index for queries
      },
    ],
  }
);

export default Payroll;
