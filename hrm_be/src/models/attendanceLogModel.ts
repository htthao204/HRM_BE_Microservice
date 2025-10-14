import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";
import { EmployeeInformation } from "./employeeModel";

interface AttendanceLogAttributes {
  id: number;
  employee_id: number;
  log_time: Date;
  action: "CHECKIN" | "CHECKOUT";
  source?: "DEVICE" | "FACE_RECOGNITION" | "MANUAL";
  status?: "SUCCESS" | "FAILED";
  created_at?: Date;
}

interface AttendanceLogCreationAttributes
  extends Optional<
    AttendanceLogAttributes,
    "id" | "source" | "status" | "created_at"
  > {}

export class AttendanceLog
  extends Model<AttendanceLogAttributes, AttendanceLogCreationAttributes>
  implements AttendanceLogAttributes
{
  declare id: number;
  declare employee_id: number;
  declare log_time: Date;
  declare action: "CHECKIN" | "CHECKOUT";
  declare source?: "DEVICE" | "FACE_RECOGNITION" | "MANUAL";
  declare status?: "SUCCESS" | "FAILED";
  declare created_at?: Date;
}

AttendanceLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "employee_information",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    log_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    action: {
      type: DataTypes.ENUM("CHECKIN", "CHECKOUT"),
      allowNull: false,
    },
    source: {
      type: DataTypes.ENUM("DEVICE", "FACE_RECOGNITION", "MANUAL"),
      defaultValue: "FACE_RECOGNITION",
    },
    status: {
      type: DataTypes.ENUM("SUCCESS", "FAILED"),
      defaultValue: "SUCCESS",
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "attendance_logs",
    timestamps: false,
  }
);

// Thiết lập quan hệ
AttendanceLog.belongsTo(EmployeeInformation, {
  foreignKey: "employee_id",
  as: "employee",
});

export default AttendanceLog;
