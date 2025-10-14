import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";
import SalaryType from "./salaryTypeModel";
import SalaryStructureType from "./salaryStructureTypeModel";

interface SalaryStructureAttributes {
  id: number;
  salary_structure_type_id: number;
  salary_type_id: number;
  value_type: "Fixed" | "Percentage" | "Formula-based";
  value: number;
  effective_from: Date;
  effective_to?: Date;
  created_at?: Date;
  updated_at?: Date;
}

interface SalaryStructureCreationAttributes
  extends Optional<
    SalaryStructureAttributes,
    "id" | "effective_to" | "created_at" | "updated_at"
  > {}

class SalaryStructure
  extends Model<SalaryStructureAttributes, SalaryStructureCreationAttributes>
  implements SalaryStructureAttributes
{
  declare id: number;
  declare salary_structure_type_id: number;
  declare salary_type_id: number;
  declare value_type: "Fixed" | "Percentage" | "Formula-based";
  declare value: number;
  declare effective_from: Date;
  declare effective_to?: Date;
  declare created_at: Date;
  declare updated_at: Date;
}

SalaryStructure.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    salary_structure_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "salary_structure_types", key: "id" },
    },
    salary_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "salary_types", key: "id" },
    },
    value_type: {
      type: DataTypes.ENUM("Fixed", "Percentage", "Formula-based"),
      allowNull: false,
    },
    value: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    effective_from: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    effective_to: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "salary_structures",
    timestamps: false,
  }
);

// Thiết lập quan hệ
SalaryStructure.belongsTo(SalaryType, { foreignKey: "salary_type_id" });
SalaryStructure.belongsTo(SalaryStructureType, {
  foreignKey: "salary_structure_type_id",
});

export default SalaryStructure;
