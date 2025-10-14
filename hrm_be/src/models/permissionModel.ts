import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

interface PermissionAttributes {
  id: number;
  name: string;
  description?: string;
}

interface PermissionCreationAttributes
  extends Optional<PermissionAttributes, "id"> {}

class Permission
  extends Model<PermissionAttributes, PermissionCreationAttributes>
  implements PermissionAttributes
{
  declare id: number;
  declare name: string;
  declare description?: string;
}

Permission.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "permissions",
    timestamps: false,
  }
);

export default Permission;
