import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

interface SystemSettingAttributes {
  id: number;
  settingKey: string;
  settingValue: string;
  settingType: "string" | "number" | "boolean" | "json";
  description: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface SystemSettingCreationAttributes
  extends Optional<
    SystemSettingAttributes,
    | "id"
    | "settingType"
    | "description"
    | "isPublic"
    | "createdAt"
    | "updatedAt"
  > {}

export class SystemSetting
  extends Model<SystemSettingAttributes, SystemSettingCreationAttributes>
  implements SystemSettingAttributes
{
  public id!: number;
  public settingKey!: string;
  public settingValue!: string;
  public settingType!: "string" | "number" | "boolean" | "json";
  public description!: string | null;
  public isPublic!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Helper method to get typed value
  public getTypedValue(): any {
    switch (this.settingType) {
      case "number":
        return Number(this.settingValue);
      case "boolean":
        return this.settingValue === "true" || this.settingValue === "1";
      case "json":
        try {
          return JSON.parse(this.settingValue);
        } catch {
          return this.settingValue;
        }
      default:
        return this.settingValue;
    }
  }

  // Helper method to set typed value
  public setTypedValue(value: any): void {
    switch (this.settingType) {
      case "number":
        this.settingValue = String(value);
        break;
      case "boolean":
        this.settingValue = value ? "true" : "false";
        break;
      case "json":
        this.settingValue = JSON.stringify(value);
        break;
      default:
        this.settingValue = String(value);
    }
  }
}

SystemSetting.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    settingKey: {
      field: "setting_key",
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [1, 100],
      },
    },
    settingValue: {
      field: "setting_value",
      type: DataTypes.TEXT,
      allowNull: false,
    },
    settingType: {
      field: "setting_type",
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "string",
      validate: {
        isIn: [["string", "number", "boolean", "json"]],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isPublic: {
      field: "is_public",
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    createdAt: {
      field: "created_at",
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      field: "updated_at",
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "system_settings",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ["setting_key"],
        name: "idx_system_settings_key",
      },
      {
        fields: ["is_public"],
        name: "idx_system_settings_public",
      },
    ],
  }
);

export default SystemSetting;
