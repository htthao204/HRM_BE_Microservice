import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

interface SalaryTypeAttributes {
  id: number;
  name: string;
  code?: string;
  description?: string;
  category: "basic" | "allowance" | "bonus" | "deduction" | "overtime";
  is_taxable?: boolean;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

interface SalaryTypeCreationAttributes
  extends Optional<
    SalaryTypeAttributes,
    | "id"
    | "code"
    | "description"
    | "is_taxable"
    | "is_active"
    | "created_at"
    | "updated_at"
  > {}

class SalaryType
  extends Model<SalaryTypeAttributes, SalaryTypeCreationAttributes>
  implements SalaryTypeAttributes
{
  declare id: number;
  declare name: string;
  declare code?: string;
  declare description?: string;
  declare category: "basic" | "allowance" | "bonus" | "deduction" | "overtime";
  declare is_taxable?: boolean;
  declare is_active?: boolean;
  declare readonly created_at?: Date;
  declare readonly updated_at?: Date;
}

SalaryType.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(50), allowNull: false },
    code: { type: DataTypes.STRING(20), unique: true },
    description: { type: DataTypes.TEXT },
    category: {
      type: DataTypes.ENUM(
        "basic",
        "allowance",
        "bonus",
        "deduction",
        "overtime"
      ),
      allowNull: false,
    },
    is_taxable: { type: DataTypes.BOOLEAN, defaultValue: false },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    sequelize,
    tableName: "salary_types",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default SalaryType;
