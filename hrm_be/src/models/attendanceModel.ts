import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";
import { EmployeeInformation } from "./employeeModel";

interface AttendanceAttributes {
  id: number;
  employee_id: number;
  date: Date;
  working_hours?: number;
  total_checkin?: number;
  total_checkout?: number;
  created_at?: Date;
  updated_at?: Date;
}

interface AttendanceCreationAttributes
  extends Optional<
    AttendanceAttributes,
    | "id"
    | "working_hours"
    | "total_checkin"
    | "total_checkout"
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
  declare working_hours?: number;
  declare total_checkin?: number;
  declare total_checkout?: number;
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
    working_hours: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
    },
    total_checkin: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    total_checkout: {
      type: DataTypes.INTEGER,
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
