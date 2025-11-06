// models/lateEarlyRuleModel.ts
import { DataTypes } from "sequelize";
import sequelize from "../config/db";

const LateEarlyRule = sequelize.define(
  "LateEarlyRule",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    ruleType: {
      field: "rule_type",
      type: DataTypes.ENUM("late", "early", "both"),
      allowNull: false,
    },
    applicableTo: {
      field: "applicable_to",
      type: DataTypes.ENUM("all", "department", "position", "individual"),
      defaultValue: "all",
    },
    departmentId: {
      field: "department_id",
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    positionId: {
      field: "position_id",
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    employeeId: {
      field: "employee_id",
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    gracePeriod: {
      field: "grace_period",
      type: DataTypes.INTEGER,
      defaultValue: 5,
    },
    deductionType: {
      field: "deduction_type",
      type: DataTypes.ENUM("salary", "leave", "warning", "none"),
      defaultValue: "none",
    },
    deductionAmount: {
      field: "deduction_amount",
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    maxOccurrences: {
      field: "max_occurrences",
      type: DataTypes.INTEGER,
      defaultValue: 3,
    },
    periodType: {
      field: "period_type",
      type: DataTypes.ENUM("day", "week", "month", "quarter", "year"),
      defaultValue: "month",
    },
    isActive: {
      field: "is_active",
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    effectiveFrom: {
      field: "effective_from",
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    effectiveTo: {
      field: "effective_to",
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    createdBy: {
      field: "created_by",
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    updatedBy: {
      field: "updated_by",
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    createdAt: {
      field: "created_at",
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      field: "updated_at",
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "late_early_rules",
    timestamps: false,
  }
);

export default LateEarlyRule;
