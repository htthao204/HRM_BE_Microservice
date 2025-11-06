import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

interface ReportConfigurationAttributes {
  id: number;
  reportType: "attendance" | "payroll" | "overtime" | "summary";
  configName: string;
  configData: object;
  isDefault: boolean;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ReportConfigurationCreationAttributes
  extends Optional<
    ReportConfigurationAttributes,
    "id" | "isDefault" | "createdAt" | "updatedAt"
  > {}

export class ReportConfiguration
  extends Model<
    ReportConfigurationAttributes,
    ReportConfigurationCreationAttributes
  >
  implements ReportConfigurationAttributes
{
  public id!: number;
  public reportType!: "attendance" | "payroll" | "overtime" | "summary";
  public configName!: string;
  public configData!: object;
  public isDefault!: boolean;
  public createdBy!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ReportConfiguration.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    reportType: {
      field: "report_type",
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [["attendance", "payroll", "overtime", "summary"]],
      },
    },
    configName: {
      field: "config_name",
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100],
      },
    },
    configData: {
      field: "config_data",
      type: DataTypes.JSONB,
      allowNull: false,
    },
    isDefault: {
      field: "is_default",
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    createdBy: {
      field: "created_by",
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "employee_information",
        key: "id",
      },
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
    tableName: "report_configurations",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ["report_type"],
        name: "idx_report_configs_type",
      },
      {
        fields: ["config_name"],
        name: "idx_report_configs_name",
      },
      {
        fields: ["is_default"],
        name: "idx_report_configs_default",
      },
      {
        fields: ["created_by"],
        name: "idx_report_configs_creator",
      },
    ],
  }
);

export default ReportConfiguration;
