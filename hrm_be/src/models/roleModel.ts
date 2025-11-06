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
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

Role.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    description: { type: DataTypes.STRING(255), allowNull: true },
  },
  {
    sequelize,
    tableName: "roles",
    timestamps: true, // Sequelize sẽ tự quản lý createdAt & updatedAt
    underscored: true, // Map sang created_at, updated_at
  }
);

export default Role;
