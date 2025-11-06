import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/db";
import { EmployeeInformation } from "./employeeModel";

interface AttendanceLogAttributes {
  id: number;
  employeeId: number;
  logTime: Date;
  action: "CHECKIN" | "CHECKOUT";
  source?: "DEVICE" | "FACE_RECOGNITION" | "MANUAL" | "MOBILE";
  status?: "SUCCESS" | "FAILED" | "LATE" | "EARLY";
  location?: string | null;
  deviceId?: string | null;
  notes?: string | null;
  created_at?: Date;
}

interface AttendanceLogCreationAttributes
  extends Optional<
    AttendanceLogAttributes,
    | "id"
    | "source"
    | "status"
    | "location"
    | "deviceId"
    | "notes"
    | "created_at"
  > {}

export class AttendanceLog
  extends Model<AttendanceLogAttributes, AttendanceLogCreationAttributes>
  implements AttendanceLogAttributes
{
  declare id: number;
  declare employeeId: number;
  declare logTime: Date;
  declare action: "CHECKIN" | "CHECKOUT";
  declare source?: "DEVICE" | "FACE_RECOGNITION" | "MANUAL" | "MOBILE";
  declare status?: "SUCCESS" | "FAILED" | "LATE" | "EARLY";
  declare location?: string | null;
  declare deviceId?: string | null;
  declare notes?: string | null;
  declare created_at?: Date;
}

AttendanceLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "employee_id",
      references: {
        model: "employee_information",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    logTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "log_time",
    },
    action: {
      type: DataTypes.ENUM("CHECKIN", "CHECKOUT"),
      allowNull: false,
    },
    source: {
      type: DataTypes.ENUM("DEVICE", "FACE_RECOGNITION", "MANUAL", "MOBILE"),
      defaultValue: "FACE_RECOGNITION",
    },
    status: {
      type: DataTypes.ENUM("SUCCESS", "FAILED", "LATE", "EARLY"),
      defaultValue: "SUCCESS",
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    deviceId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "device_id",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "attendance_logs",
    timestamps: false, // vì chỉ có created_at, không có updated_at
    indexes: [
      {
        name: "idx_employee_log_time",
        fields: ["employee_id", "log_time"],
      },
    ],
  }
);

export default AttendanceLog;
