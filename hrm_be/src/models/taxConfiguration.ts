import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

interface TaxConfigurationAttributes {
  id: number;
  effectiveDate: Date;
  personalDeduction: number;
  dependentDeduction: number;
  regionMinSalary: number;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
}

interface TaxConfigurationCreationAttributes
  extends Optional<
    TaxConfigurationAttributes,
    | "id"
    | "personalDeduction"
    | "dependentDeduction"
    | "regionMinSalary"
    | "description"
    | "isActive"
    | "createdAt"
  > {}

export class TaxConfiguration
  extends Model<TaxConfigurationAttributes, TaxConfigurationCreationAttributes>
  implements TaxConfigurationAttributes
{
  public id!: number;
  public effectiveDate!: Date;
  public personalDeduction!: number;
  public dependentDeduction!: number;
  public regionMinSalary!: number;
  public description!: string | null;
  public isActive!: boolean;
  public readonly createdAt!: Date;
}

TaxConfiguration.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    effectiveDate: {
      field: "effective_date",
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
      },
    },
    personalDeduction: {
      field: "personal_deduction",
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 11000000,
      validate: {
        min: 0,
      },
    },
    dependentDeduction: {
      field: "dependent_deduction",
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 4400000,
      validate: {
        min: 0,
      },
    },
    regionMinSalary: {
      field: "region_min_salary",
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 4680000,
      validate: {
        min: 0,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      field: "is_active",
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    createdAt: {
      field: "created_at",
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "tax_configurations",
    timestamps: false,
    underscored: true,
    indexes: [
      {
        fields: ["effective_date"],
        name: "idx_tax_configs_effective_date",
      },
      {
        fields: ["is_active"],
        name: "idx_tax_configs_active",
      },
    ],
  }
);

export default TaxConfiguration;
