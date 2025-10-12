import { Model, Optional, DataTypes } from "sequelize";
import sequelize from "../config/db";

// 1. Interface cho các thuộc tính của bảng
interface EmployeeSalaryHistoryAttributes {
  id: number;
  employeeId: number;
  salaryStructureId: number;
  salaryAmount: number;
  effectiveFrom: Date;
  effectiveTo?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// 2. Interface cho create (các trường optional khi tạo)
interface EmployeeSalaryHistoryCreationAttributes
  extends Optional<
    EmployeeSalaryHistoryAttributes,
    "id" | "effectiveTo" | "createdAt" | "updatedAt"
  > {}

// 3. Class model
class EmployeeSalaryHistory
  extends Model<
    EmployeeSalaryHistoryAttributes,
    EmployeeSalaryHistoryCreationAttributes
  >
  implements EmployeeSalaryHistoryAttributes
{
  declare id: number;
  declare employeeId: number;
  declare salaryStructureId: number;
  declare salaryAmount: number;
  declare effectiveFrom: Date;
  declare effectiveTo?: Date;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

// 4. Khởi tạo model
EmployeeSalaryHistory.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "employee_id",
    },
    salaryStructureId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "salary_structure_id",
    },
    salaryAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      field: "salary_amount",
    },
    effectiveFrom: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "effective_from",
    },
    effectiveTo: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "effective_to",
    },
  },
  {
    sequelize,
    tableName: "employee_salary_history",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default EmployeeSalaryHistory;
