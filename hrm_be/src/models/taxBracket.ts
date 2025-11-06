import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

interface TaxBracketAttributes {
  id: number;
  minAmount: number;
  maxAmount: number | null;
  taxRate: number;
  deductionAmount: number;
  effectiveYear: number;
  description: string | null;
  createdAt: Date;
}

interface TaxBracketCreationAttributes
  extends Optional<
    TaxBracketAttributes,
    "id" | "maxAmount" | "deductionAmount" | "description" | "createdAt"
  > {}

export class TaxBracket
  extends Model<TaxBracketAttributes, TaxBracketCreationAttributes>
  implements TaxBracketAttributes
{
  public id!: number;
  public minAmount!: number;
  public maxAmount!: number | null;
  public taxRate!: number;
  public deductionAmount!: number;
  public effectiveYear!: number;
  public description!: string | null;
  public readonly createdAt!: Date;
}

TaxBracket.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    minAmount: {
      field: "min_amount",
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    maxAmount: {
      field: "max_amount",
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      validate: {
        min: 0,
        isGreaterThanMin(value: number | null) {
          if (value !== null && value <= this.minAmount) {
            throw new Error("Max amount must be greater than min amount");
          }
        },
      },
    },
    taxRate: {
      field: "tax_rate",
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      validate: {
        min: 0,
        max: 1,
      },
    },
    deductionAmount: {
      field: "deduction_amount",
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    effectiveYear: {
      field: "effective_year",
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 2000,
        max: 2100,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    tableName: "tax_brackets",
    timestamps: false,
    underscored: true,
    indexes: [
      {
        fields: ["effective_year"],
        name: "idx_tax_brackets_year",
      },
      {
        fields: ["min_amount", "max_amount"],
        name: "idx_tax_brackets_amount_range",
      },
    ],
  }
);

export default TaxBracket;
