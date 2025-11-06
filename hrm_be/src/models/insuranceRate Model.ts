import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

interface InsuranceRateAttributes {
  id: number;
  insuranceType: "social" | "health" | "unemployment" | "union";
  employeeRate: number;
  employerRate: number;
  minSalary: number;
  maxSalary?: number | null;
  effectiveDate: Date;
  description?: string | null;
  createdAt?: Date;
}

interface InsuranceRateCreationAttributes
  extends Optional<
    InsuranceRateAttributes,
    "id" | "maxSalary" | "description" | "createdAt"
  > {}

class InsuranceRate
  extends Model<InsuranceRateAttributes, InsuranceRateCreationAttributes>
  implements InsuranceRateAttributes
{
  declare id: number;
  declare insuranceType: "social" | "health" | "unemployment" | "union";
  declare employeeRate: number;
  declare employerRate: number;
  declare minSalary: number;
  declare maxSalary?: number | null;
  declare effectiveDate: Date;
  declare description?: string | null;
  declare readonly createdAt?: Date;
}

InsuranceRate.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    insuranceType: {
      field: "insurance_type",
      type: DataTypes.ENUM("social", "health", "unemployment", "union"),
      allowNull: false,
    },
    employeeRate: {
      field: "employee_rate",
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
    },
    employerRate: {
      field: "employer_rate",
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
    },
    minSalary: {
      field: "min_salary",
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    maxSalary: {
      field: "max_salary",
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    effectiveDate: {
      field: "effective_date",
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      field: "created_at",
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "insurance_rates",
    timestamps: false, // Chỉ có created_at, không có updated_at
  }
);

export default InsuranceRate;
