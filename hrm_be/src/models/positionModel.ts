import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

// Khai báo thuộc tính của Position
interface PositionAttributes {
  id: number;
  name: string;
  description?: string;
}

// Khi tạo mới, `id` có thể bỏ qua vì autoIncrement
interface PositionCreationAttributes
  extends Optional<PositionAttributes, "id"> {}

class Position
  extends Model<PositionAttributes, PositionCreationAttributes>
  implements PositionAttributes
{
  declare id: number;
  declare name: string;
  declare description?: string;
}

Position.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "positions",
    timestamps: false,
  }
);

export default Position;
