import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

// 1️⃣ Interface mô tả thuộc tính bảng
interface LeaveTypeAttributes {
  id: number;
  name: string;
  code?: string | null;
  description?: string | null;
  defaultDays?: number;
  isPaid?: boolean;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// 2️⃣ Interface cho tạo mới
interface LeaveTypeCreationAttributes
  extends Optional<
    LeaveTypeAttributes,
    | "id"
    | "code"
    | "description"
    | "defaultDays"
    | "isPaid"
    | "isActive"
    | "createdAt"
    | "updatedAt"
  > {}

// 3️⃣ Định nghĩa Model
class LeaveType
  extends Model<LeaveTypeAttributes, LeaveTypeCreationAttributes>
  implements LeaveTypeAttributes
{
  declare id: number;
  declare name: string;
  declare code?: string | null;
  declare description?: string | null;
  declare defaultDays?: number;
  declare isPaid?: boolean;
  declare isActive?: boolean;
  declare createdAt?: Date;
  declare updatedAt?: Date;
}

// 4️⃣ Khởi tạo Sequelize Model (ĐÃ SỬA)
LeaveType.init(
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
      allowNull: true,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    defaultDays: {
      field: "default_days",
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isPaid: {
      field: "is_paid",
      type: DataTypes.BOOLEAN,
      allowNull: false, // ✅ THÊM
      defaultValue: true,
    },
    isActive: {
      field: "is_active",
      type: DataTypes.BOOLEAN,
      allowNull: false, // ✅ THÊM
      defaultValue: true,
    },
    // ✅ XÓA created_at, updated_at khai báo thủ công
  },
  {
    sequelize,
    tableName: "leave_types",
    timestamps: true, // ✅ ĐỔI thành true
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export { LeaveType, LeaveTypeAttributes, LeaveTypeCreationAttributes };
