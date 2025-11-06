import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/db";
import EmployeeInformation from "./employeeModel";

// 1️⃣ Interface mô tả các cột trong bảng
interface AttendanceAdjustmentAttributes {
  id: number;
  employee_id: number;
  adjustment_date: Date;
  original_hours?: number;
  adjusted_hours?: number;
  adjustment_type:
    | "missing_checkin"
    | "missing_checkout"
    | "time_correction"
    | "manual_entry";
  reason: string;
  requested_by: number;
  status?: "pending" | "approved" | "rejected";
  approved_by?: number | null;
  approved_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

// 2️⃣ Interface cho dữ liệu khi tạo mới
interface AttendanceAdjustmentCreationAttributes
  extends Optional<
    AttendanceAdjustmentAttributes,
    | "id"
    | "original_hours"
    | "adjusted_hours"
    | "status"
    | "approved_by"
    | "approved_at"
    | "created_at"
    | "updated_at"
  > {}

// 3️⃣ Khai báo class model
export class AttendanceAdjustment
  extends Model<
    AttendanceAdjustmentAttributes,
    AttendanceAdjustmentCreationAttributes
  >
  implements AttendanceAdjustmentAttributes
{
  declare id: number;
  declare employee_id: number;
  declare adjustment_date: Date;
  declare original_hours?: number;
  declare adjusted_hours?: number;
  declare adjustment_type:
    | "missing_checkin"
    | "missing_checkout"
    | "time_correction"
    | "manual_entry";
  declare reason: string;
  declare requested_by: number;
  declare status?: "pending" | "approved" | "rejected";
  declare approved_by?: number | null;
  declare approved_at?: Date | null;
  declare readonly created_at?: Date;
  declare readonly updated_at?: Date;
}

// 4️⃣ Cấu hình Sequelize mapping với DB
AttendanceAdjustment.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    employee_id: { type: DataTypes.INTEGER, allowNull: false },
    adjustment_date: { type: DataTypes.DATEONLY, allowNull: false },
    original_hours: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    adjusted_hours: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    adjustment_type: {
      type: DataTypes.ENUM(
        "missing_checkin",
        "missing_checkout",
        "time_correction",
        "manual_entry"
      ),
      allowNull: false,
    },
    reason: { type: DataTypes.TEXT, allowNull: false },
    requested_by: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
    },
    approved_by: { type: DataTypes.INTEGER, allowNull: true },
    approved_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    tableName: "attendance_adjustments",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// 5️⃣ Định nghĩa các mối quan hệ (Associations)
AttendanceAdjustment.belongsTo(EmployeeInformation, {
  foreignKey: "employee_id",
  as: "employee",
  onDelete: "CASCADE",
});

AttendanceAdjustment.belongsTo(EmployeeInformation, {
  foreignKey: "requested_by",
  as: "requester",
  onDelete: "CASCADE",
});

AttendanceAdjustment.belongsTo(EmployeeInformation, {
  foreignKey: "approved_by",
  as: "approver",
  onDelete: "SET NULL",
});

export default AttendanceAdjustment;
