import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/db";
import { EmployeeInformation } from "./employeeModel";
import { WorkShift } from "./workShiftModel";

// 1️⃣ Interface các thuộc tính của bảng
interface AttendanceAttributes {
  id: number;
  employeeId: number;
  date: Date;
  workShiftId?: number | null;
  expectedHours?: number;
  actualHours?: number;
  checkinTime?: Date | null;
  checkoutTime?: Date | null;
  lateMinutes?: number;
  earlyMinutes?: number;
  overtimeHours?: number;
  status?: "present" | "absent" | "late" | "half_day" | "holiday" | "leave";
  notes?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

// 2️⃣ Interface cho việc tạo mới (id auto, timestamps optional)
interface AttendanceCreationAttributes
  extends Optional<
    AttendanceAttributes,
    | "id"
    | "workShiftId"
    | "expectedHours"
    | "actualHours"
    | "checkinTime"
    | "checkoutTime"
    | "lateMinutes"
    | "earlyMinutes"
    | "overtimeHours"
    | "status"
    | "notes"
    | "created_at"
    | "updated_at"
  > {}

// 3️⃣ Model định nghĩa
export class Attendance
  extends Model<AttendanceAttributes, AttendanceCreationAttributes>
  implements AttendanceAttributes
{
  declare id: number;
  declare employeeId: number;
  declare date: Date;
  declare workShiftId?: number | null;
  declare expectedHours?: number;
  declare actualHours?: number;
  declare checkinTime?: Date | null;
  declare checkoutTime?: Date | null;
  declare lateMinutes?: number;
  declare earlyMinutes?: number;
  declare overtimeHours?: number;
  declare status?:
    | "present"
    | "absent"
    | "late"
    | "half_day"
    | "holiday"
    | "leave";
  declare notes?: string | null;
  declare created_at?: Date;
  declare updated_at?: Date;
}

// 4️⃣ Init Sequelize model
Attendance.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    employeeId: {
      field: "employee_id",
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "employee_information",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    workShiftId: {
      field: "work_shift_id",
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "work_shifts",
        key: "id",
      },
      onDelete: "SET NULL",
    },
    expectedHours: {
      field: "expected_hours",
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
    },
    actualHours: {
      field: "actual_hours",
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
    },
    checkinTime: {
      field: "checkin_time",
      type: DataTypes.DATE,
      allowNull: true,
    },
    checkoutTime: {
      field: "checkout_time",
      type: DataTypes.DATE,
      allowNull: true,
    },
    lateMinutes: {
      field: "late_minutes",
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    earlyMinutes: {
      field: "early_minutes",
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    overtimeHours: {
      field: "overtime_hours",
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM(
        "present",
        "absent",
        "late",
        "half_day",
        "holiday",
        "leave"
      ),
      defaultValue: "present",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "attendances",
    timestamps: false, // dùng created_at, updated_at thủ công
    indexes: [
      {
        name: "idx_date_status",
        fields: ["date", "status"],
      },
    ],
  }
);

// 5️⃣ Associations
Attendance.belongsTo(EmployeeInformation, {
  foreignKey: "employeeId",
  as: "employee",
});

Attendance.belongsTo(WorkShift, {
  foreignKey: "workShiftId",
  as: "workShift",
});

export default Attendance;
