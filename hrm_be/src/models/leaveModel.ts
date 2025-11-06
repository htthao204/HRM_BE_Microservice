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
  daysTaken: number;
  reason: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  approvedBy: number | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface LeaveCreationAttributes
  extends Optional<
    LeaveAttributes,
    | "id"
    | "daysTaken"
    | "reason"
    | "status"
    | "approvedBy"
    | "approvedAt"
    | "createdAt"
    | "updatedAt"
  > {}

class Leave
  extends Model<LeaveAttributes, LeaveCreationAttributes>
  implements LeaveAttributes
{
  public id!: number;
  public employeeId!: number;
  public leaveTypeId!: number;
  public startDate!: Date;
  public endDate!: Date;
  public daysTaken!: number;
  public reason!: string | null;
  public status!: "pending" | "approved" | "rejected" | "cancelled";
  public approvedBy!: number | null;
  public approvedAt!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Leave.init(
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
        model: "employee_information", // ✅ Dùng table name thay vì model class
        key: "id",
      },
    },
    leaveTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "leave_type_id",
      references: {
        model: "leave_types", // ✅ Dùng table name thay vì model class
        key: "id",
      },
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "start_date",
      validate: {
        isDate: true,
      },
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "end_date",
      validate: {
        isDate: true,
        isAfterStartDate(value: Date) {
          if (value < this.startDate) {
            throw new Error("End date must be after start date");
          }
        },
      },
    },
    daysTaken: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      field: "days_taken",
      validate: {
        min: 0,
        max: 365,
      },
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20), // ✅ Khớp với VARCHAR(20) trong database
      allowNull: false,
      defaultValue: "pending",
      validate: {
        isIn: [["pending", "approved", "rejected", "cancelled"]], // ✅ Validation thay cho ENUM
      },
    },
    approvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "approved_by",
      references: {
        model: "employee_information", // ✅ Dùng table name thay vì model class
        key: "id",
      },
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "approved_at",
    },
    createdAt: {
      field: "created_at",
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      field: "updated_at",
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "leaves",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ["employee_id"],
        name: "idx_leaves_employee",
      },
      {
        fields: ["leave_type_id"],
        name: "idx_leaves_leave_type",
      },
      {
        fields: ["status"],
        name: "idx_leaves_status",
      },
      {
        fields: ["start_date", "end_date"],
        name: "idx_leaves_date_range",
      },
      {
        fields: ["approved_by"],
        name: "idx_leaves_approver",
      },
    ],
  }
);

export { Leave, LeaveAttributes, LeaveCreationAttributes };
