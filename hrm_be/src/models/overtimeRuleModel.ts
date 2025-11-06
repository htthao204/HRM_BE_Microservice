import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/db";

// 1️⃣ Interface mô tả các cột trong bảng
interface OvertimeRuleAttributes {
  id: number;
  name: string;
  multiplier: number;
  startTime: string;
  endTime: string;
  applyDays?: string; // '1,2,3,4,5,6,7'
  minHours?: number;
  description?: string | null;
  isActive?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

// 2️⃣ Interface cho dữ liệu khi tạo mới
interface OvertimeRuleCreationAttributes
  extends Optional<
    OvertimeRuleAttributes,
    | "id"
    | "applyDays"
    | "minHours"
    | "description"
    | "isActive"
    | "created_at"
    | "updated_at"
  > {}

// 3️⃣ Khai báo model class
export class OvertimeRule
  extends Model<OvertimeRuleAttributes, OvertimeRuleCreationAttributes>
  implements OvertimeRuleAttributes
{
  declare id: number;
  declare name: string;
  declare multiplier: number;
  declare startTime: string;
  declare endTime: string;
  declare applyDays?: string;
  declare minHours?: number;
  declare description?: string | null;
  declare isActive?: boolean;
  declare readonly created_at?: Date;
  declare readonly updated_at?: Date;
}

// 4️⃣ Cấu hình Sequelize
OvertimeRule.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    multiplier: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
    startTime: { field: "start_time", type: DataTypes.TIME, allowNull: false },
    endTime: { field: "end_time", type: DataTypes.TIME, allowNull: false },
    applyDays: {
      field: "apply_days",
      type: DataTypes.STRING(20),
      defaultValue: "1,2,3,4,5,6,7",
    },
    minHours: {
      field: "min_hours",
      type: DataTypes.DECIMAL(4, 2),
      defaultValue: 1.0,
    },
    description: { type: DataTypes.TEXT, allowNull: true },
    isActive: {
      field: "is_active",
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: "overtime_rules",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default OvertimeRule;
