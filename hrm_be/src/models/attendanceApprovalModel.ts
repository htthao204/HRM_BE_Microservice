import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/db";

// 1️⃣ Interface định nghĩa các cột trong bảng
interface AttendanceApprovalAttributes {
  id: number;
  attendanceId: number;
  approverId: number;
  approvalType: "regular" | "overtime" | "adjustment";
  oldData: object | null;
  newData: object | null;
  approvalStatus: "pending" | "approved" | "rejected";
  requestDate: Date;
  approvalDate: Date | null;
  comments: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// 2️⃣ Interface khi tạo mới bản ghi
interface AttendanceApprovalCreationAttributes
  extends Optional<
    AttendanceApprovalAttributes,
    | "id"
    | "approvalType"
    | "oldData"
    | "newData"
    | "approvalStatus"
    | "requestDate"
    | "approvalDate"
    | "comments"
    | "createdAt"
    | "updatedAt"
  > {}

// 3️⃣ Khai báo class model
export class AttendanceApproval
  extends Model<
    AttendanceApprovalAttributes,
    AttendanceApprovalCreationAttributes
  >
  implements AttendanceApprovalAttributes
{
  public id!: number;
  public attendanceId!: number;
  public approverId!: number;
  public approvalType!: "regular" | "overtime" | "adjustment";
  public oldData!: object | null;
  public newData!: object | null;
  public approvalStatus!: "pending" | "approved" | "rejected";
  public requestDate!: Date;
  public approvalDate!: Date | null;
  public comments!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// 4️⃣ Cấu hình Sequelize mapping với database - FIXED
AttendanceApproval.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    attendanceId: {
      field: "attendance_id",
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "attendances",
        key: "id",
      },
    },
    approverId: {
      field: "approver_id",
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "employee_information",
        key: "id",
      },
    },
    approvalType: {
      field: "approval_type",
      type: DataTypes.STRING(20), // ✅ Khớp với VARCHAR(20) trong database
      allowNull: false,
      defaultValue: "regular",
      validate: {
        isIn: [["regular", "overtime", "adjustment"]], // ✅ Validation thay cho ENUM
      },
    },
    oldData: {
      field: "old_data",
      type: DataTypes.JSONB, // ✅ Dùng JSONB cho PostgreSQL (tốt hơn JSON)
      allowNull: true,
    },
    newData: {
      field: "new_data",
      type: DataTypes.JSONB, // ✅ Dùng JSONB cho PostgreSQL
      allowNull: true,
    },
    approvalStatus: {
      field: "approval_status",
      type: DataTypes.STRING(20), // ✅ Khớp với VARCHAR(20) trong database
      allowNull: false,
      defaultValue: "pending",
      validate: {
        isIn: [["pending", "approved", "rejected"]], // ✅ Validation thay cho ENUM
      },
    },
    requestDate: {
      field: "request_date",
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    approvalDate: {
      field: "approval_date",
      type: DataTypes.DATE,
      allowNull: true,
    },
    comments: {
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
    tableName: "attendance_approvals",
    timestamps: true,
    underscored: true, // ✅ Tự động convert camelCase to snake_case
    indexes: [
      {
        fields: ["attendance_id"],
        name: "idx_attendance_approvals_attendance",
      },
      {
        fields: ["approver_id"],
        name: "idx_attendance_approvals_approver",
      },
      {
        fields: ["approval_status"],
        name: "idx_attendance_approvals_status",
      },
      {
        fields: ["approval_type"],
        name: "idx_attendance_approvals_type",
      },
      {
        fields: ["request_date"],
        name: "idx_attendance_approvals_request_date",
      },
    ],
  }
);

export default AttendanceApproval;
