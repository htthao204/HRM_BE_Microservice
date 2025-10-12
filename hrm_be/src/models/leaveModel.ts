import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";
import { EmployeeInformation } from "./employeeModel";
import { LeaveType } from "./leaveTypeModel";

interface LeaveAttributes {
  id: number;
  employeeId: number;
  leaveTypeId: number;
  startDate: Date;
  endDate: Date;
  daysTaken?: number;
  reason?: string;
  status: "Pending" | "Approved" | "Rejected";
  createdAt?: Date;
  updatedAt?: Date;
}

interface LeaveCreationAttributes
  extends Optional<
    LeaveAttributes,
    "id" | "daysTaken" | "reason" | "createdAt" | "updatedAt"
  > {}

class Leave
  extends Model<LeaveAttributes, LeaveCreationAttributes>
  implements LeaveAttributes
{
  declare id: number;
  declare employeeId: number;
  declare leaveTypeId: number;
  declare startDate: Date;
  declare endDate: Date;
  declare daysTaken: number;
  declare reason?: string;
  declare status: "Pending" | "Approved" | "Rejected";

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Leave.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "employee_id",
      references: { model: EmployeeInformation, key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    leaveTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "leave_type_id",
      references: { model: LeaveType, key: "id" },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "start_date",
    },
    endDate: { type: DataTypes.DATEONLY, allowNull: false, field: "end_date" },
    daysTaken: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      field: "days_taken",
    },
    reason: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM("Pending", "Approved", "Rejected"),
      allowNull: false,
      defaultValue: "Pending",
    },
  },
  {
    sequelize,
    tableName: "leaves",
    timestamps: true,
    underscored: true,
  }
);

// Quan hệ
Leave.belongsTo(EmployeeInformation, {
  foreignKey: "employee_id",
  as: "employee",
});
Leave.belongsTo(LeaveType, { foreignKey: "leave_type_id", as: "leaveType" });

export { Leave, LeaveAttributes, LeaveCreationAttributes };
