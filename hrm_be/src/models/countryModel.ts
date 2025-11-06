// src/models/CountryModel.ts
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

interface CountryAttributes {
  id: number;
  name: string;
  country_code?: string | null;
}

interface CountryCreationAttributes
  extends Optional<CountryAttributes, "id" | "country_code"> {}

class Country
  extends Model<CountryAttributes, CountryCreationAttributes>
  implements CountryAttributes
{
  declare id: number;
  declare name: string;
  declare country_code?: string | null;
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
    },
    country_code: {
      type: DataTypes.STRING(3),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "countries",
    timestamps: false,
  }
);

export default Country;
