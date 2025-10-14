import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

interface SalaryStructureTypeAttributes {
  id: number;
  name: string;
  description?: string;
  is_taxable: boolean;
  is_deduction: boolean;
  created_at?: Date;
  updated_at?: Date;
}

interface SalaryStructureTypeCreationAttributes
  extends Optional<
    SalaryStructureTypeAttributes,
    | "id"
    | "description"
    | "is_taxable"
    | "is_deduction"
    | "created_at"
    | "updated_at"
  > {}

class SalaryStructureType
  extends Model<
    SalaryStructureTypeAttributes,
    SalaryStructureTypeCreationAttributes
  >
  implements SalaryStructureTypeAttributes
{
  declare id: number;
  declare name: string;
  declare description?: string;
  declare is_taxable: boolean;
  declare is_deduction: boolean;
  declare created_at: Date;
  declare updated_at: Date;
}

SalaryStructureType.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_taxable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_deduction: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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
    tableName: "salary_structure_types",
    timestamps: false,
  }
);

export default SalaryStructureType;
