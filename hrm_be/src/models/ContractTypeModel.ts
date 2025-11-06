// models/ContractType.ts
import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/db";

interface ContractTypeAttributes {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  durationMonths?: number | null;
  isRenewable?: boolean;
  isActive?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

interface ContractTypeCreationAttributes
  extends Optional<
    ContractTypeAttributes,
    | "id"
    | "description"
    | "durationMonths"
    | "isRenewable"
    | "isActive"
    | "created_at"
    | "updated_at"
  > {}

export class ContractType
  extends Model<ContractTypeAttributes, ContractTypeCreationAttributes>
  implements ContractTypeAttributes
{
  declare id: number;
  declare name: string;
  declare code: string;
  declare description?: string | null;
  declare durationMonths?: number | null;
  declare isRenewable?: boolean;
  declare isActive?: boolean;
  declare created_at?: Date;
  declare updated_at?: Date;
}

ContractType.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    durationMonths: {
      field: "duration_months",
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    isRenewable: {
      field: "is_renewable",
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isActive: {
      field: "is_active",
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: "contract_types",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default ContractType;
