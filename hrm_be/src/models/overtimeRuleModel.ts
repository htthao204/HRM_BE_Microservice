import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

interface OvertimeRuleAttributes {
  id: number;
  name: string;
  multiplier: number;
  start_hour: string;
  end_hour: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface OvertimeRuleCreationAttributes
  extends Optional<OvertimeRuleAttributes, "id" | "description"> {}

class OvertimeRule
  extends Model<OvertimeRuleAttributes, OvertimeRuleCreationAttributes>
  implements OvertimeRuleAttributes
{
  declare id: number;
  declare name: string;
  declare multiplier: number;
  declare start_hour: string;
  declare end_hour: string;
  declare description?: string;

  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

OvertimeRule.init(
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
    multiplier: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    start_hour: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    end_hour: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "overtime_rules",
    timestamps: true,
    underscored: true,
  }
);

export { OvertimeRule, OvertimeRuleAttributes, OvertimeRuleCreationAttributes };
