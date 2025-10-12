import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/db"; // sửa path theo project của bạn

// 1. Interface cho các thuộc tính của bảng
interface WorkShiftAttributes {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  totalHours: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// 2. Interface cho tạo mới (id, createdAt, updatedAt optional)
interface WorkShiftCreationAttributes
  extends Optional<WorkShiftAttributes, "id" | "createdAt" | "updatedAt"> {}

// 3. Class model
class WorkShift
  extends Model<WorkShiftAttributes, WorkShiftCreationAttributes>
  implements WorkShiftAttributes
{
  declare id: number;
  declare name: string;
  declare startTime: string;
  declare endTime: string;
  declare totalHours: number;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

// 4. Init model
WorkShift.init(
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
    startTime: {
      type: DataTypes.TIME,
      allowNull: false,
      field: "start_time",
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: false,
      field: "end_time",
    },
    totalHours: {
      type: DataTypes.FLOAT,
      allowNull: false,
      field: "total_hours",
    },
  },
  {
    sequelize,
    tableName: "work_shifts",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export { WorkShift, WorkShiftAttributes, WorkShiftCreationAttributes };
