import {
  DataTypes,
  Model,
  Optional,
  BelongsToGetAssociationMixin,
} from "sequelize";
import sequelize from "../config/db";
import Role from "./roleModel";

interface AccountAttributes {
  id: number;
  username: string;
  password: string;
  roleId: number;
  is_active?: boolean;
  last_login?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

interface AccountCreationAttributes
  extends Optional<
    AccountAttributes,
    "id" | "created_at" | "updated_at" | "is_active" | "last_login"
  > {}

export class Account
  extends Model<AccountAttributes, AccountCreationAttributes>
  implements AccountAttributes
{
  declare id: number;
  declare username: string;
  declare password: string;
  declare roleId: number;
  declare is_active?: boolean;
  declare last_login?: Date | null;
  declare created_at?: Date;
  declare updated_at?: Date;

  // Association
  declare role?: Role;
  declare getRole: BelongsToGetAssociationMixin<Role>;
}

Account.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    password: { type: DataTypes.STRING(255), allowNull: false },
    roleId: { type: DataTypes.INTEGER, allowNull: false, field: "role_id" },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    last_login: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, field: "created_at" },
    updated_at: { type: DataTypes.DATE, field: "updated_at" },
  },
  {
    sequelize,
    tableName: "accounts",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default Account;
