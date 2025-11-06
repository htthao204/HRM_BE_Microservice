import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

interface CalculationRuleAttributes {
  id: number;
  ruleCode: string;
  name: string;
  description?: string | null;
  ruleCategory:
    | "ATTENDANCE"
    | "SALARY"
    | "ALLOWANCE"
    | "DEDUCTION"
    | "TAX"
    | "INSURANCE"
    | "BONUS";
  ruleType:
    | "FIXED_AMOUNT"
    | "PERCENTAGE"
    | "FORMULA"
    | "DAILY_RATE"
    | "HOURLY_RATE";
  formulaTemplate: string;
  conditionExpression?: string | null;
  defaultValue?: number;
  minValue?: number | null;
  maxValue?: number | null;
  executionOrder?: number;
  isActive?: boolean;
  isSystemRule?: boolean;
  appliesTo?:
    | "ALL_EMPLOYEES"
    | "SPECIFIC_DEPARTMENT"
    | "SPECIFIC_POSITION"
    | "SPECIFIC_EMPLOYEE";
  createdAt?: Date;
  updatedAt?: Date;
}

interface CalculationRuleCreationAttributes
  extends Optional<
    CalculationRuleAttributes,
    | "id"
    | "description"
    | "conditionExpression"
    | "defaultValue"
    | "minValue"
    | "maxValue"
    | "executionOrder"
    | "isActive"
    | "isSystemRule"
    | "appliesTo"
    | "createdAt"
    | "updatedAt"
  > {}

class CalculationRule
  extends Model<CalculationRuleAttributes, CalculationRuleCreationAttributes>
  implements CalculationRuleAttributes
{
  declare id: number;
  declare ruleCode: string;
  declare name: string;
  declare description?: string | null;
  declare ruleCategory:
    | "ATTENDANCE"
    | "SALARY"
    | "ALLOWANCE"
    | "DEDUCTION"
    | "TAX"
    | "INSURANCE"
    | "BONUS";
  declare ruleType:
    | "FIXED_AMOUNT"
    | "PERCENTAGE"
    | "FORMULA"
    | "DAILY_RATE"
    | "HOURLY_RATE";
  declare formulaTemplate: string;
  declare conditionExpression?: string | null;
  declare defaultValue?: number;
  declare minValue?: number | null;
  declare maxValue?: number | null;
  declare executionOrder?: number;
  declare isActive?: boolean;
  declare isSystemRule?: boolean;
  declare appliesTo?:
    | "ALL_EMPLOYEES"
    | "SPECIFIC_DEPARTMENT"
    | "SPECIFIC_POSITION"
    | "SPECIFIC_EMPLOYEE";
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

CalculationRule.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    ruleCode: {
      field: "rule_code",
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    ruleCategory: {
      field: "rule_category",
      type: DataTypes.ENUM(
        "ATTENDANCE",
        "SALARY",
        "ALLOWANCE",
        "DEDUCTION",
        "TAX",
        "INSURANCE",
        "BONUS"
      ),
      allowNull: false,
    },
    ruleType: {
      field: "rule_type",
      type: DataTypes.ENUM(
        "FIXED_AMOUNT",
        "PERCENTAGE",
        "FORMULA",
        "DAILY_RATE",
        "HOURLY_RATE"
      ),
      allowNull: false,
    },
    formulaTemplate: {
      field: "formula_template",
      type: DataTypes.TEXT,
      allowNull: false,
    },
    conditionExpression: {
      field: "condition_expression",
      type: DataTypes.TEXT,
    },
    defaultValue: {
      field: "default_value",
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    minValue: {
      field: "min_value",
      type: DataTypes.DECIMAL(15, 2),
    },
    maxValue: {
      field: "max_value",
      type: DataTypes.DECIMAL(15, 2),
    },
    executionOrder: {
      field: "execution_order",
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    isActive: {
      field: "is_active",
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isSystemRule: {
      field: "is_system_rule",
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    appliesTo: {
      field: "applies_to",
      type: DataTypes.ENUM(
        "ALL_EMPLOYEES",
        "SPECIFIC_DEPARTMENT",
        "SPECIFIC_POSITION",
        "SPECIFIC_EMPLOYEE"
      ),
      defaultValue: "ALL_EMPLOYEES",
    },
  },
  {
    sequelize,
    tableName: "calculation_rules",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default CalculationRule;
