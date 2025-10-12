import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";
import Permission from "./permissionModel";

interface RoleAttributes {
  id: number;
  name: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
  permissions?: Permission[];
}

interface RoleCreationAttributes
  extends Optional<
    RoleAttributes,
    "id" | "description" | "createdAt" | "updatedAt"
  > {}

class Role
  extends Model<RoleAttributes, RoleCreationAttributes>
  implements RoleAttributes
{
  declare id: number;
  declare name: string;
  declare description?: string;
  declare permissions?: Permission[];
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Role.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    description: { type: DataTypes.STRING(255), allowNull: true },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "created_at",
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "updated_at",
    },
  },
  {
    sequelize,
    tableName: "roles",
    timestamps: true,
    underscored: true,
  }
);

export default Role;
