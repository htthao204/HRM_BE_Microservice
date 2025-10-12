import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";
import SalaryStructureType from "./salaryStructureModel";

interface CalculationRuleAttributes {
  id: number;
  salary_structure_type_id: number;
  name: string;
  formula: string;
  rule_condition?: string;
  priority?: number;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

interface CalculationRuleCreationAttributes
  extends Optional<
    CalculationRuleAttributes,
    | "id"
    | "rule_condition"
    | "priority"
    | "is_active"
    | "created_at"
    | "updated_at"
  > {}

class CalculationRule
  extends Model<CalculationRuleAttributes, CalculationRuleCreationAttributes>
  implements CalculationRuleAttributes
{
  declare id: number;
  declare salary_structure_type_id: number;
  declare name: string;
  declare formula: string;
  declare rule_condition?: string;
  declare priority?: number;
  declare is_active?: boolean;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

CalculationRule.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    salary_structure_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "salary_structure_types", key: "id" },
    },
    name: { type: DataTypes.STRING(100), allowNull: false },
    formula: { type: DataTypes.TEXT, allowNull: false },
    rule_condition: { type: DataTypes.TEXT, allowNull: true },
    priority: { type: DataTypes.INTEGER, defaultValue: 1 },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: "calculation_rules",
    timestamps: false,
  }
);

// Quan hệ
CalculationRule.belongsTo(SalaryStructureType, {
  foreignKey: "salary_structure_type_id",
});

export default CalculationRule;
