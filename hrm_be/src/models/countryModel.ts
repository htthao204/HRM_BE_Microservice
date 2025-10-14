// src/models/CountryModel.ts
import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

interface CountryAttributes {
  id: number;
  name: string;
}

interface CountryCreationAttributes extends Optional<CountryAttributes, "id"> {}

export class Country
  extends Model<CountryAttributes, CountryCreationAttributes>
  implements CountryAttributes
{
  declare id: number;
  declare name: string;
}

Country.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
  },
  {
    sequelize,
    tableName: "countries",
    timestamps: false,
  }
);

export default Country;
