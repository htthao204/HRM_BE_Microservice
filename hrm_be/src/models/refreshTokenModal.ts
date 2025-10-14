import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";
import Account from "./accountModel";

interface RefreshTokenAttributes {
  id: number;
  token: string;
  expiresAt: Date;
  createdAt?: Date;
  accountId: number;
}

interface RefreshTokenCreationAttributes
  extends Optional<RefreshTokenAttributes, "id" | "createdAt"> {}

class RefreshToken
  extends Model<RefreshTokenAttributes, RefreshTokenCreationAttributes>
  implements RefreshTokenAttributes
{
  declare id: number;
  declare token: string;
  declare expiresAt: Date;
  declare createdAt?: Date;
  declare accountId: number;
}

RefreshToken.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    token: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "expires_at",
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "created_at",
    },
    accountId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "account_id",
      references: {
        model: Account,
        key: "id",
      },
      onDelete: "CASCADE",
    },
  },
  {
    sequelize,
    tableName: "refresh_tokens",
    timestamps: false,
  }
);

export default RefreshToken;
