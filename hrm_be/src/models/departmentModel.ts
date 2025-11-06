// models/departmentModel.ts - SỬA HOÀN TOÀN
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

interface DepartmentAttributes {
  id: number;
  name: string;
  code?: string;
  manager_id?: number | null;
  parent_id?: number | null;
  description?: string | null;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

interface DepartmentCreationAttributes
  extends Optional<DepartmentAttributes, "id" | "deleted_at"> {}

export class Department
  extends Model<DepartmentAttributes, DepartmentCreationAttributes>
  implements DepartmentAttributes
{
  declare id: number;
  declare name: string;
  declare code?: string;
  declare manager_id?: number | null; // 🟪 SỬA
  declare parent_id?: number | null;
  declare description?: string | null;
  declare is_active?: boolean; // 🟪 SỬA
  declare created_at?: Date;
  declare updated_at?: Date;
  declare deleted_at?: Date | null;
}

Department.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    code: { type: DataTypes.STRING(20), unique: true },
    manager_id: {
      // 🟪 SỬA: dùng manager_id trực tiếp, không cần field mapping
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    parent_id: {
      // 🟪 SỬA: dùng parent_id trực tiếp
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    description: { type: DataTypes.TEXT, allowNull: true },
    is_active: {
      // 🟪 SỬA: dùng is_active trực tiếp
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "departments",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
    paranoid: true,
  }
);

export default Department;
