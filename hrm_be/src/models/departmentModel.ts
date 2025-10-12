import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

interface DepartmentAttributes {
  id: number;
  name: string;
  managerId?: number;
  created_at?: Date;
  updated_at?: Date;
}

interface DepartmentCreationAttributes
  extends Optional<DepartmentAttributes, "id"> {}

export class Department extends Model<
  DepartmentAttributes,
  DepartmentCreationAttributes
> {}

// Khai báo init
Department.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    managerId: {
      type: DataTypes.INTEGER,
      field: "manager_id",
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
