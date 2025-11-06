import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";
import { EmployeeInformation } from "./employeeInformationModel";
import { Position } from "./positionModel";
import { Department } from "./departmentModel";

interface EmployeePositionHistoryAttributes {
  id: number;
  employeeId: number;
  positionId: number | null;
  departmentId: number | null;
  startDate: Date;
  endDate: Date | null;
  salaryBefore: number | null;
  salaryAfter: number | null;
  reason: string | null;
  createdBy: number | null;
  createdAt: Date;
  updatedAt: Date;
}

interface EmployeePositionHistoryCreationAttributes
  extends Optional<
    EmployeePositionHistoryAttributes,
    | "id"
    | "positionId"
    | "departmentId"
    | "endDate"
    | "salaryBefore"
    | "salaryAfter"
    | "reason"
    | "createdBy"
    | "createdAt"
    | "updatedAt"
  > {}

export class EmployeePositionHistory
  extends Model<
    EmployeePositionHistoryAttributes,
    EmployeePositionHistoryCreationAttributes
  >
  implements EmployeePositionHistoryAttributes
{
  public id!: number;
  public employeeId!: number;
  public positionId!: number | null;
  public departmentId!: number | null;
  public startDate!: Date;
  public endDate!: Date | null;
  public salaryBefore!: number | null;
  public salaryAfter!: number | null;
  public reason!: string | null;
  public createdBy!: number | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

EmployeePositionHistory.init(
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
    positionId: {
      field: "position_id",
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "positions",
        key: "id",
      },
    },
    departmentId: {
      field: "department_id",
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "departments",
        key: "id",
      },
    },
    startDate: {
      field: "start_date",
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
      },
    },
    endDate: {
      field: "end_date",
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: true,
        isAfterStartDate(value: Date | null) {
          if (value && value <= this.startDate) {
            throw new Error("End date must be after start date");
          }
        },
      },
    },
    salaryBefore: {
      field: "salary_before",
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    salaryAfter: {
      field: "salary_after",
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdBy: {
      field: "created_by",
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "employee_information",
        key: "id",
      },
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
    tableName: "employee_position_history",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ["employee_id"],
        name: "idx_emp_pos_history_employee",
      },
      {
        fields: ["position_id"],
        name: "idx_emp_pos_history_position",
      },
      {
        fields: ["department_id"],
        name: "idx_emp_pos_history_department",
      },
      {
        fields: ["start_date", "end_date"],
        name: "idx_emp_pos_history_date_range",
      },
    ],
  }
);

export default EmployeePositionHistory;
