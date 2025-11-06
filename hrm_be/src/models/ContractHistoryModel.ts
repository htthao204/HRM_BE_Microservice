// models/ContractHistory.ts
import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/db";

interface ContractHistoryAttributes {
  id: number;
  contractId: number;
  action: string;
  changeDescription?: string | null;
  oldValues?: object | null;
  newValues?: object | null;
  changedBy: number;
  changed_at?: Date;
}

interface ContractHistoryCreationAttributes
  extends Optional<
    ContractHistoryAttributes,
    "id" | "changeDescription" | "oldValues" | "newValues" | "changed_at"
  > {}

export class ContractHistory
  extends Model<ContractHistoryAttributes, ContractHistoryCreationAttributes>
  implements ContractHistoryAttributes
{
  declare id: number;
  declare contractId: number;
  declare action: string;
  declare changeDescription?: string | null;
  declare oldValues?: object | null;
  declare newValues?: object | null;
  declare changedBy: number;
  declare changed_at?: Date;
}

ContractHistory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    contractId: {
      field: "contract_id",
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    action: {
      type: DataTypes.ENUM(
        "created",
        "updated",
        "extended",
        "terminated",
        "amended"
      ),
      allowNull: false,
    },
    changeDescription: {
      field: "change_description",
      type: DataTypes.TEXT,
      allowNull: true,
    },
    oldValues: {
      field: "old_values",
      type: DataTypes.JSONB,
      allowNull: true,
    },
    newValues: {
      field: "new_values",
      type: DataTypes.JSONB,
      allowNull: true,
    },
    changedBy: {
      field: "changed_by",
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "contract_history",
    timestamps: true,
    createdAt: "changed_at",
    updatedAt: false, // This table only has created_at
  }
);

export default ContractHistory;
