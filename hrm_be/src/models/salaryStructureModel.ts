import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";
import { SalaryType } from "./salaryTypeModel";
import { EmployeeInformation } from "./employeeModel";

interface SalaryStructureAttributes {
  id: number;
  employeeId: number;
  salaryTypeId: number;
  amount: number;
  calculationType: "fixed" | "percentage" | "formula";
  formula: string | null;
  effectiveDate: Date;
  endDate: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface SalaryStructureCreationAttributes
  extends Optional<
    SalaryStructureAttributes,
    "id" | "formula" | "endDate" | "isActive" | "createdAt" | "updatedAt"
  > {}

class SalaryStructure
  extends Model<SalaryStructureAttributes, SalaryStructureCreationAttributes>
  implements SalaryStructureAttributes
{
  public id!: number;
  public employeeId!: number;
  public salaryTypeId!: number;
  public amount!: number;
  public calculationType!: "fixed" | "percentage" | "formula";
  public formula!: string | null;
  public effectiveDate!: Date;
  public endDate!: Date | null;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SalaryStructure.init(
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
    },
    salaryTypeId: {
      field: "salary_type_id",
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "salary_types",
        key: "id",
      },
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    calculationType: {
      field: "calculation_type",
      type: DataTypes.STRING(20), //  Khớp với VARCHAR(20) trong database
      allowNull: false,
      defaultValue: "fixed",
      validate: {
        isIn: [["fixed", "percentage", "formula"]], //  Validation thay cho ENUM
      },
    },
    formula: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    effectiveDate: {
      field: "effective_date",
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
      },
    },
    endDate: {
      field: "end_date",
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: true,
        isAfterEffectiveDate(value: Date | null) {
          if (value && value < this.effectiveDate) {
            throw new Error("End date must be after effective date");
          }
        },
      },
    },
    isActive: {
      field: "is_active",
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    tableName: "salary_structures",
    timestamps: true,
    underscored: true, //  Tự động convert camelCase to snake_case
    indexes: [
      {
        fields: ["employee_id"],
        name: "idx_salary_structures_employee",
      },
      {
        fields: ["salary_type_id"],
        name: "idx_salary_structures_salary_type",
      },
      {
        fields: ["is_active"],
        name: "idx_salary_structures_active",
      },
      {
        fields: ["effective_date", "end_date"],
        name: "idx_salary_structures_date_range",
      },
      {
        fields: ["calculation_type"],
        name: "idx_salary_structures_calc_type",
      },
    ],
  }
);

export default SalaryStructure;
