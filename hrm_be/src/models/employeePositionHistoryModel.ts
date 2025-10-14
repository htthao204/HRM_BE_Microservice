import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";
import { EmployeeInformation } from "./employeeModel";
import Position from "./positionModel";
import Department from "./departmentModel";

interface EmployeePositionHistoryAttributes {
  id: number;
  employee_id: number;
  position_id?: number;
  department_id?: number;
  start_date: Date;
  end_date?: Date;
  created_at?: Date;
  updated_at?: Date;
}

interface EmployeePositionHistoryCreationAttributes
  extends Optional<
    EmployeePositionHistoryAttributes,
    | "id"
    | "position_id"
    | "department_id"
    | "end_date"
    | "created_at"
    | "updated_at"
  > {}

class EmployeePositionHistory
  extends Model<
    EmployeePositionHistoryAttributes,
    EmployeePositionHistoryCreationAttributes
  >
  implements EmployeePositionHistoryAttributes
{
  declare id: number;
  declare employee_id: number;
  declare position_id?: number;
  declare department_id?: number;
  declare start_date: Date;
  declare end_date?: Date;
  declare created_at?: Date;
  declare updated_at?: Date;
}

EmployeePositionHistory.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "employee_information", key: "id" },
    },
    position_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "positions", key: "id" },
    },
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "departments", key: "id" },
    },
    start_date: { type: DataTypes.DATE, allowNull: false },
    end_date: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: "employee_position_history",
    timestamps: false,
  }
);

// Quan hệ
EmployeePositionHistory.belongsTo(EmployeeInformation, {
  foreignKey: "employee_id",
});
EmployeePositionHistory.belongsTo(Position, { foreignKey: "position_id" });
EmployeePositionHistory.belongsTo(Department, { foreignKey: "department_id" });

export default EmployeePositionHistory;
