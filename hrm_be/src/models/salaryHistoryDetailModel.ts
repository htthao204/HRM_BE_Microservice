import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

interface SalaryHistoryDetailAttributes {
  id: number;
  employeeId: number;
  payrollId: number;
  salaryTypeId: number;
  itemType: "earning" | "deduction";
  itemName: string;
  amount: number;
  calculationBasis: string | null;
  quantity: number;
  unit: string | null;
  notes: string | null;
  createdAt: Date;
}

interface SalaryHistoryDetailCreationAttributes
  extends Optional<
    SalaryHistoryDetailAttributes,
    "id" | "calculationBasis" | "quantity" | "unit" | "notes" | "createdAt"
  > {}

export class SalaryHistoryDetail
  extends Model<
    SalaryHistoryDetailAttributes,
    SalaryHistoryDetailCreationAttributes
  >
  implements SalaryHistoryDetailAttributes
{
  public id!: number;
  public employeeId!: number;
  public payrollId!: number;
  public salaryTypeId!: number;
  public itemType!: "earning" | "deduction";
  public itemName!: string;
  public amount!: number;
  public calculationBasis!: string | null;
  public quantity!: number;
  public unit!: string | null;
  public notes!: string | null;
  public readonly createdAt!: Date;
}

SalaryHistoryDetail.init(
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
    payrollId: {
      field: "payroll_id",
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "payrolls",
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
    itemType: {
      field: "item_type",
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        isIn: [["earning", "deduction"]],
      },
    },
    itemName: {
      field: "item_name",
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100],
      },
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    calculationBasis: {
      field: "calculation_basis",
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 0,
      },
    },
    unit: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    notes: {
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
    tableName: "salary_history_details",
    timestamps: false,
    underscored: true,
    indexes: [
      {
        fields: ["employee_id"],
        name: "idx_salary_history_employee",
      },
      {
        fields: ["payroll_id"],
        name: "idx_salary_history_payroll",
      },
      {
        fields: ["salary_type_id"],
        name: "idx_salary_history_salary_type",
      },
      {
        fields: ["item_type"],
        name: "idx_salary_history_item_type",
      },
    ],
  }
);

export default SalaryHistoryDetail;
