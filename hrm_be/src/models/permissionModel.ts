import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

interface PermissionAttributes {
  id: number;
  name: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PermissionCreationAttributes
  extends Optional<PermissionAttributes, "id" | "createdAt" | "updatedAt"> {}

class Permission
  extends Model<PermissionAttributes, PermissionCreationAttributes>
  implements PermissionAttributes
{
  declare id: number;
  declare name: string;
  declare description?: string;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

Permission.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      field: "created_at",
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: "updated_at",
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "permissions",
    timestamps: true,
    underscored: true,
  }
);

export default Permission;
