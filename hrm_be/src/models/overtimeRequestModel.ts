// models/overtimeRequestModel.ts
import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db";

class OvertimeRequest extends Model {}

OvertimeRequest.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    employee_id: { type: DataTypes.INTEGER, allowNull: false },
    work_shift_id: { type: DataTypes.INTEGER, allowNull: false },
    overtime_date: { type: DataTypes.DATEONLY, allowNull: false }, // ✅ Đúng với DB
    start_time: { type: DataTypes.TIME, allowNull: false },
    end_time: { type: DataTypes.TIME, allowNull: false },
    total_hours: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
    reason: { type: DataTypes.TEXT },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "pending",
    },
    approved_by: { type: DataTypes.INTEGER },
    approved_at: { type: DataTypes.DATE },
    actual_hours: { type: DataTypes.DECIMAL(5, 2) },
    notes: { type: DataTypes.TEXT },
  },
  {
    sequelize,
    modelName: "OvertimeRequest",
    tableName: "overtime_requests",
    timestamps: false,
  }
);

export default OvertimeRequest;
