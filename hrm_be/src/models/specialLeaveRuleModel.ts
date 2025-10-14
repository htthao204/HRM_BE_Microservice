import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db"; // instance sequelize

interface SpecialLeaveRuleAttributes {
  id: number;
  name: string;
  description?: string;
  eligibilityCriteria?: string;
  maxDaysPerYear: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SpecialLeaveRuleCreationAttributes
  extends Optional<
    SpecialLeaveRuleAttributes,
    "id" | "description" | "eligibilityCriteria" | "createdAt" | "updatedAt"
  > {}

class SpecialLeaveRule
  extends Model<SpecialLeaveRuleAttributes, SpecialLeaveRuleCreationAttributes>
  implements SpecialLeaveRuleAttributes
{
  declare id: number;
  declare name: string;
  declare description?: string;
  declare eligibilityCriteria?: string;
  declare maxDaysPerYear: number;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

SpecialLeaveRule.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    eligibilityCriteria: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "eligibility_criteria",
    },
    maxDaysPerYear: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "max_days_per_year",
      defaultValue: 0,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "created_at",
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "updated_at",
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "special_leave_rules",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    underscored: true,
  }
);

export {
  SpecialLeaveRule,
  SpecialLeaveRuleAttributes,
  SpecialLeaveRuleCreationAttributes,
};
