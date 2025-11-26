import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/db";

interface WorkScheduleRuleAttributes {
  id: number;
  name: string;
  ruleType: "late_threshold" | "early_threshold" | "working_days" | "holidays";
  value: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface WorkScheduleRuleCreationAttributes
  extends Optional<
    WorkScheduleRuleAttributes,
    "id" | "description" | "isActive" | "createdAt" | "updatedAt"
  > {}

export class WorkScheduleRule
  extends Model<WorkScheduleRuleAttributes, WorkScheduleRuleCreationAttributes>
  implements WorkScheduleRuleAttributes
{
  public id!: number;
  public name!: string;
  public ruleType!:
    | "late_threshold"
    | "early_threshold"
    | "working_days"
    | "holidays";
  public value!: string;
  public description!: string | null;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

WorkScheduleRule.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100],
      },
    },
    ruleType: {
      field: "rule_type",
      type: DataTypes.STRING(20), //  Khớp với VARCHAR(20) trong database
      allowNull: false,
      validate: {
        isIn: [
          ["late_threshold", "early_threshold", "working_days", "holidays"],
        ], //  Validation thay cho ENUM
      },
    },
    value: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      field: "is_active",
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    createdAt: {
      field: "created_at",
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      field: "updated_at",
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "work_schedule_rules",
    timestamps: true,
    underscored: true, //  Tự động convert camelCase to snake_case
    indexes: [
      {
        fields: ["rule_type"],
        name: "idx_work_schedule_rules_type",
      },
      {
        fields: ["is_active"],
        name: "idx_work_schedule_rules_active",
      },
    ],
  }
);

export default WorkScheduleRule;
