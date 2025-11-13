// src/models/salaryGradeModel.ts
import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/db";

interface SalaryGradeAttributes {
  id: number;
  grade_code: string;
  grade_name: string;
  basic_salary: number;
  coefficient: number;
  min_salary: number;
  max_salary: number;
  description?: string | null;
  is_active: boolean;
  effective_date: Date;
  end_date?: Date | null;
  created_by?: number | null;
  updated_by?: number | null;
  created_at?: Date;
  updated_at?: Date;
}

interface SalaryGradeCreationAttributes
  extends Optional<
    SalaryGradeAttributes,
    | "id"
    | "description"
    | "is_active"
    | "end_date"
    | "created_by"
    | "updated_by"
    | "created_at"
    | "updated_at"
  > {}

export class SalaryGrade
  extends Model<SalaryGradeAttributes, SalaryGradeCreationAttributes>
  implements SalaryGradeAttributes
{
  declare id: number;
  declare grade_code: string;
  declare grade_name: string;
  declare basic_salary: number;
  declare coefficient: number;
  declare min_salary: number;
  declare max_salary: number;
  declare description?: string | null;
  declare is_active: boolean;
  declare effective_date: Date;
  declare end_date?: Date | null;
  declare created_by?: number | null;
  declare updated_by?: number | null;
  declare created_at?: Date;
  declare updated_at?: Date;
}

SalaryGrade.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    grade_code: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
    },
    grade_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    basic_salary: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    coefficient: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: false,
    },
    min_salary: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    max_salary: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    effective_date: {
      field: "effective_date",
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    end_date: {
      field: "end_date",
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "salary_grades",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default SalaryGrade;
