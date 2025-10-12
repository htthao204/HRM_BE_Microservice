import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

interface SalaryTypeAttributes {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

interface SalaryTypeCreationAttributes
  extends Optional<
    SalaryTypeAttributes,
    "id" | "description" | "is_active" | "created_at" | "updated_at"
  > {}

class SalaryType
  extends Model<SalaryTypeAttributes, SalaryTypeCreationAttributes>
  implements SalaryTypeAttributes
{
  declare id: number;
  declare name: string;
  declare description?: string;
  declare is_active: boolean;
  declare readonly created_at?: Date;
  declare readonly updated_at?: Date;
}

SalaryType.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
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
    tableName: "salary_types",
    timestamps: false,
  }
);

export default SalaryType;
