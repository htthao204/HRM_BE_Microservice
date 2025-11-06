import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";
import { EmployeeInformation } from "./employeeModel";

interface ReportConfigurationAttributes {
  id: number;
  report_type: "attendance" | "payroll" | "overtime" | "summary";
  config_name: string;
  config_data: object;
  is_default?: boolean;
  created_by: number;
  created_at?: Date;
  updated_at?: Date;
}

interface ReportConfigurationCreationAttributes
  extends Optional<
    ReportConfigurationAttributes,
    "id" | "is_default" | "created_at" | "updated_at"
  > {}

class ReportConfiguration
  extends Model<
    ReportConfigurationAttributes,
    ReportConfigurationCreationAttributes
  >
  implements ReportConfigurationAttributes
{
  declare id: number;
  declare report_type: "attendance" | "payroll" | "overtime" | "summary";
  declare config_name: string;
  declare config_data: object;
  declare is_default?: boolean;
  declare created_by: number;
  declare readonly created_at?: Date;
  declare readonly updated_at?: Date;
}

ReportConfiguration.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    report_type: {
      type: DataTypes.ENUM("attendance", "payroll", "overtime", "summary"),
      allowNull: false,
    },
    config_name: { type: DataTypes.STRING(100), allowNull: false },
    config_data: { type: DataTypes.JSON, allowNull: false },
    is_default: { type: DataTypes.BOOLEAN, defaultValue: false },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "employee_information", key: "id" },
      onDelete: "CASCADE",
    },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: "report_configurations",
    timestamps: false,
  }
);

export default ReportConfiguration;
