import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/db";
import { EmployeeInformation } from "./employeeModel";
import { WorkShift } from "./workShiftModel";

interface EmployeeShiftAssignmentAttributes {
  id: number;
  employeeId: number;
  workShiftId: number;
  assignmentDate: Date;
  assignmentType: "regular" | "overtime" | "special";
  approvedBy: number | null;
  status: "scheduled" | "confirmed" | "cancelled";
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface EmployeeShiftAssignmentCreationAttributes
  extends Optional<
    EmployeeShiftAssignmentAttributes,
    | "id"
    | "createdAt"
    | "updatedAt"
    | "assignmentType"
    | "status"
    | "approvedBy"
    | "notes"
  > {}

export class EmployeeShiftAssignment
  extends Model<
    EmployeeShiftAssignmentAttributes,
    EmployeeShiftAssignmentCreationAttributes
  >
  implements EmployeeShiftAssignmentAttributes
{
  public id!: number;
  public employeeId!: number;
  public workShiftId!: number;
  public assignmentDate!: Date;
  public assignmentType!: "regular" | "overtime" | "special";
  public approvedBy!: number | null;
  public status!: "scheduled" | "confirmed" | "cancelled";
  public notes!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

EmployeeShiftAssignment.init(
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
    assignmentDate: {
      field: "assignment_date",
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    assignmentType: {
      field: "assignment_type",
      type: DataTypes.STRING(10), // ✅ Khớp với VARCHAR(10) trong database
      allowNull: false,
      defaultValue: "regular",
      validate: {
        isIn: [["regular", "overtime", "special"]], // ✅ Validation thay cho ENUM
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
    status: {
      type: DataTypes.STRING(20), // ✅ Khớp với VARCHAR(20) trong database
      allowNull: false,
      defaultValue: "scheduled",
      validate: {
        isIn: [["scheduled", "confirmed", "cancelled"]], // ✅ Validation thay cho ENUM
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
    tableName: "employee_shift_assignments",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["employee_id", "assignment_date", "work_shift_id"],
        name: "unique_employee_shift_date_workshift",
      },

      {
        fields: ["employee_id"],
        name: "idx_employee_shift_employee",
      },
      {
        fields: ["work_shift_id"],
        name: "idx_employee_shift_workshift",
      },
      {
        fields: ["assignment_date"],
        name: "idx_employee_shift_date",
      },
    ],
  }
);

export default EmployeeShiftAssignment;
