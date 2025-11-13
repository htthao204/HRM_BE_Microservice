// src/models/employeeSalaryGradeModel.ts
import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/db";

import SalaryGrade from "./salaryGradeModel";
import EmployeeInformation from "./employeeModel";

interface EmployeeSalaryGradeAttributes {
  id: number;
  employee_id: number;
  salary_grade_id: number;
  assigned_date: Date;
  end_date?: Date | null;
  reason?: string | null;
  approved_by?: number | null;
  approved_at?: Date | null;
  is_current: boolean;
  created_at?: Date;
  updated_at?: Date;
}

interface EmployeeSalaryGradeCreationAttributes
  extends Optional<
    EmployeeSalaryGradeAttributes,
    | "id"
    | "end_date"
    | "reason"
    | "approved_by"
    | "approved_at"
    | "is_current"
    | "created_at"
    | "updated_at"
  > {}

export class EmployeeSalaryGrade
  extends Model<
    EmployeeSalaryGradeAttributes,
    EmployeeSalaryGradeCreationAttributes
  >
  implements EmployeeSalaryGradeAttributes
{
  declare id: number;
  declare employee_id: number;
  declare salary_grade_id: number;
  declare assigned_date: Date;
  declare end_date?: Date | null;
  declare reason?: string | null;
  declare approved_by?: number | null;
  declare approved_at?: Date | null;
  declare is_current: boolean;
  declare created_at?: Date;
  declare updated_at?: Date;
}

EmployeeSalaryGrade.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "employee_information",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    salary_grade_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "salary_grades",
        key: "id",
      },
      onDelete: "RESTRICT",
    },
    assigned_date: {
      field: "assigned_date",
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    end_date: {
      field: "end_date",
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    reason: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    approved_at: {
      field: "approved_at",
      type: DataTypes.DATE,
      allowNull: true,
    },
    is_current: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: "employee_salary_grades",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["employee_id", "is_current"] },
      { fields: ["assigned_date", "end_date"] },
    ],
  }
);

// === ASSOCIATIONS ===
EmployeeSalaryGrade.belongsTo(EmployeeInformation, {
  foreignKey: "employee_id",
  as: "employee",
});
EmployeeSalaryGrade.belongsTo(SalaryGrade, {
  foreignKey: "salary_grade_id",
  as: "salaryGrade",
});
SalaryGrade.hasMany(EmployeeSalaryGrade, {
  foreignKey: "salary_grade_id",
  as: "assignments",
});

export default EmployeeSalaryGrade;
