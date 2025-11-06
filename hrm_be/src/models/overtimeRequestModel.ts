import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/db";

import { WorkShift } from "./workShiftModel";
import EmployeeInformation from "./employeeModel";

// 1️⃣ Interface mô tả các cột trong bảng
interface OvertimeRequestAttributes {
  id: number;
  employeeId: number;
  workShiftId: number;
  overtimeDate: Date;
  startTime: string;
  endTime: string;
  totalHours: number;
  reason: string | null;
  status: "pending" | "approved" | "rejected" | "completed";
  approvedBy: number | null;
  approvedAt: Date | null;
  actualHours: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// 2️⃣ Interface cho dữ liệu khi tạo mới
interface OvertimeRequestCreationAttributes
  extends Optional<
    OvertimeRequestAttributes,
    | "id"
    | "reason"
    | "status"
    | "approvedBy"
    | "approvedAt"
    | "actualHours"
    | "notes"
    | "createdAt"
    | "updatedAt"
  > {}

// 3️⃣ Khai báo model class
export class OvertimeRequest
  extends Model<OvertimeRequestAttributes, OvertimeRequestCreationAttributes>
  implements OvertimeRequestAttributes
{
  public id!: number;
  public employeeId!: number;
  public workShiftId!: number;
  public overtimeDate!: Date;
  public startTime!: string;
  public endTime!: string;
  public totalHours!: number;
  public reason!: string | null;
  public status!: "pending" | "approved" | "rejected" | "completed";
  public approvedBy!: number | null;
  public approvedAt!: Date | null;
  public actualHours!: number | null;
  public notes!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// 4️⃣ Cấu hình Sequelize - FIXED
OvertimeRequest.init(
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
    },
    workShiftId: {
      field: "work_shift_id",
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "work_shifts",
        key: "id",
      },
    },
    overtimeDate: {
      field: "overtime_date",
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    startTime: {
      field: "start_time",
      type: DataTypes.TIME,
      allowNull: false,
    },
    endTime: {
      field: "end_time",
      type: DataTypes.TIME,
      allowNull: false,
    },
    totalHours: {
      field: "total_hours",
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      validate: {
        min: 0,
        max: 24,
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
        isIn: [["pending", "approved", "rejected", "completed"]], // ✅ Validation thay cho ENUM
      },
    },
    approvedBy: {
      field: "approved_by",
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "employee_information",
        key: "id",
      },
    },
    approvedAt: {
      field: "approved_at",
      type: DataTypes.DATE,
      allowNull: true,
    },
    actualHours: {
      field: "actual_hours",
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 24,
      },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    tableName: "overtime_requests",
    timestamps: true,
    underscored: true, // ✅ Tự động convert camelCase to snake_case
    indexes: [
      {
        fields: ["employee_id"],
        name: "idx_overtime_requests_employee",
      },
      {
        fields: ["overtime_date"],
        name: "idx_overtime_requests_date",
      },
      {
        fields: ["status"],
        name: "idx_overtime_requests_status",
      },
      {
        fields: ["approved_by"],
        name: "idx_overtime_requests_approver",
      },
    ],
  }
);

export default OvertimeRequest;
