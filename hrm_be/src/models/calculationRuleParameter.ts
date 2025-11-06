import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";
import { CalculationRule } from "./calculationRuleModel";

interface CalculationRuleParameterAttributes {
  id: number;
  ruleId: number;
  paramKey: string;
  paramName: string;
  paramType: "NUMBER" | "STRING" | "BOOLEAN" | "DATE" | "DATETIME";
  defaultValue: string | null;
  isRequired: boolean;
  description: string | null;
  createdAt: Date;
}

interface CalculationRuleParameterCreationAttributes
  extends Optional<
    CalculationRuleParameterAttributes,
    "id" | "defaultValue" | "isRequired" | "description" | "createdAt"
  > {}

export class CalculationRuleParameter
  extends Model<
    CalculationRuleParameterAttributes,
    CalculationRuleParameterCreationAttributes
  >
  implements CalculationRuleParameterAttributes
{
  public id!: number;
  public ruleId!: number;
  public paramKey!: string;
  public paramName!: string;
  public paramType!: "NUMBER" | "STRING" | "BOOLEAN" | "DATE" | "DATETIME";
  public defaultValue!: string | null;
  public isRequired!: boolean;
  public description!: string | null;
  public readonly createdAt!: Date;
}

CalculationRuleParameter.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    ruleId: {
      field: "rule_id",
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "calculation_rules",
        key: "id",
      },
    },
    paramKey: {
      field: "param_key",
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 50],
      },
    },
    paramName: {
      field: "param_name",
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100],
      },
    },
    paramType: {
      field: "param_type",
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [["NUMBER", "STRING", "BOOLEAN", "DATE", "DATETIME"]],
      },
    },
    defaultValue: {
      field: "default_value",
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    isRequired: {
      field: "is_required",
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      field: "created_at",
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "calculation_rule_parameters",
    timestamps: false, // Chỉ có created_at, không có updated_at
    underscored: true,
    indexes: [
      {
        fields: ["rule_id"],
        name: "idx_calculation_rule_params_rule",
      },
      {
        fields: ["param_key"],
        name: "idx_calculation_rule_params_key",
      },
    ],
  }
);

export default CalculationRuleParameter;
