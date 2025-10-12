import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";
import { EmployeeInformation } from "./employeeModel";

interface AttendanceAttributes {
  id: number;
  employee_id: number;
  date: Date;
  start_time?: Date | null;
  start_status?: "NORMAL" | "FORGOT";
  end_time?: Date | null;
  end_status?: "NORMAL" | "FORGOT";
  working_hours?: number;
  created_at?: Date;
  updated_at?: Date;
}

interface AttendanceCreationAttributes
  extends Optional<
    AttendanceAttributes,
    | "id"
    | "start_time"
    | "start_status"
    | "end_time"
    | "end_status"
    | "working_hours"
    | "created_at"
    | "updated_at"
  > {}

export class Attendance
  extends Model<AttendanceAttributes, AttendanceCreationAttributes>
  implements AttendanceAttributes
{
  declare id: number;
  declare employee_id: number;
  declare date: Date;
  declare start_time?: Date | null;
  declare start_status?: "NORMAL" | "FORGOT";
  declare end_time?: Date | null;
  declare end_status?: "NORMAL" | "FORGOT";
  declare working_hours?: number;
  declare created_at?: Date;
  declare updated_at?: Date;
}

Attendance.init(
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
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    start_status: {
      type: DataTypes.ENUM("NORMAL", "FORGOT"),
      defaultValue: "NORMAL",
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    end_status: {
      type: DataTypes.ENUM("NORMAL", "FORGOT"),
      defaultValue: "NORMAL",
    },
    working_hours: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
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
    timestamps: false,
  }
);

// Quan hệ
Attendance.belongsTo(EmployeeInformation, {
  foreignKey: "employee_id",
  as: "employee",
});

export default Attendance;
