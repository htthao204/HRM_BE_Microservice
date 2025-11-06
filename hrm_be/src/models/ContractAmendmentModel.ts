// models/ContractAmendment.ts
import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/db";

interface ContractAmendmentAttributes {
  id: number;
  contractId: number;
  amendmentNumber: string;
  amendmentDate: Date;
  amendmentType?: string;
  changeDescription: string;
  oldData?: object | null;
  newData?: object | null;
  effectiveDate: Date;
  status?: string;
  amendmentFilePath?: string | null;
  createdBy: number;
  approvedBy?: number | null;
  created_at?: Date;
  updated_at?: Date;
}

interface ContractAmendmentCreationAttributes
  extends Optional<
    ContractAmendmentAttributes,
    | "id"
    | "amendmentType"
    | "oldData"
    | "newData"
    | "status"
    | "amendmentFilePath"
    | "approvedBy"
    | "created_at"
    | "updated_at"
  > {}

export class ContractAmendment
  extends Model<
    ContractAmendmentAttributes,
    ContractAmendmentCreationAttributes
  >
  implements ContractAmendmentAttributes
{
  declare id: number;
  declare contractId: number;
  declare amendmentNumber: string;
  declare amendmentDate: Date;
  declare amendmentType?: string;
  declare changeDescription: string;
  declare oldData?: object | null;
  declare newData?: object | null;
  declare effectiveDate: Date;
  declare status?: string;
  declare amendmentFilePath?: string | null;
  declare createdBy: number;
  declare approvedBy?: number | null;
  declare created_at?: Date;
  declare updated_at?: Date;
}

ContractAmendment.init(
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
    amendmentNumber: {
      field: "amendment_number",
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    amendmentDate: {
      field: "amendment_date",
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    amendmentType: {
      field: "amendment_type",
      type: DataTypes.ENUM(
        "salary_adjustment",
        "position_change",
        "extension",
        "other"
      ),
      defaultValue: "other",
    },
    changeDescription: {
      field: "change_description",
      type: DataTypes.TEXT,
      allowNull: false,
    },
    oldData: {
      field: "old_data",
      type: DataTypes.JSONB,
      allowNull: true,
    },
    newData: {
      field: "new_data",
      type: DataTypes.JSONB,
      allowNull: true,
    },
    effectiveDate: {
      field: "effective_date",
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("draft", "active", "cancelled"),
      defaultValue: "draft",
    },
    amendmentFilePath: {
      field: "amendment_file_path",
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    createdBy: {
      field: "created_by",
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    approvedBy: {
      field: "approved_by",
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "contract_amendments",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default ContractAmendment;
