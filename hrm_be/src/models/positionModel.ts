// src/models/PositionModel.ts
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

interface PositionAttributes {
  id: number;
  name: string;
  description?: string;
  level?: number;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

interface PositionCreationAttributes
  extends Optional<
    PositionAttributes,
    "id" | "description" | "level" | "is_active" | "created_at" | "updated_at"
  > {}

class Position
  extends Model<PositionAttributes, PositionCreationAttributes>
  implements PositionAttributes
{
  declare id: number;
  declare name: string;
  declare description?: string;
  declare level?: number;
  declare is_active?: boolean;
  declare created_at?: Date;
  declare updated_at?: Date;
}

Position.init(
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
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
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
    tableName: "positions",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default Position;
