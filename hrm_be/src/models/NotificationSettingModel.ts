// src/models/NotificationSettingModel.ts
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

interface NotificationSettingAttributes {
  id: number;
  employee_id: number;
  receive_system_notifications: boolean;
  receive_attendance_notifications: boolean;
  receive_payroll_notifications: boolean;
  receive_leave_notifications: boolean;
  receive_overtime_notifications: boolean;
  receive_contract_notifications: boolean;
  receive_announcements: boolean;
  receive_email: boolean;
  receive_sms: boolean;
  receive_push_mobile: boolean;
  receive_system_inbox: boolean;
  digest_frequency: string;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface NotificationSettingCreationAttributes
  extends Optional<
    NotificationSettingAttributes,
    | "id"
    | "receive_system_notifications"
    | "receive_attendance_notifications"
    | "receive_payroll_notifications"
    | "receive_leave_notifications"
    | "receive_overtime_notifications"
    | "receive_contract_notifications"
    | "receive_announcements"
    | "receive_email"
    | "receive_sms"
    | "receive_push_mobile"
    | "receive_system_inbox"
    | "digest_frequency"
    | "quiet_hours_start"
    | "quiet_hours_end"
    | "created_at"
    | "updated_at"
  > {}

class NotificationSetting
  extends Model<
    NotificationSettingAttributes,
    NotificationSettingCreationAttributes
  >
  implements NotificationSettingAttributes
{
  declare id: number;
  declare employee_id: number;
  declare receive_system_notifications: boolean;
  declare receive_attendance_notifications: boolean;
  declare receive_payroll_notifications: boolean;
  declare receive_leave_notifications: boolean;
  declare receive_overtime_notifications: boolean;
  declare receive_contract_notifications: boolean;
  declare receive_announcements: boolean;
  declare receive_email: boolean;
  declare receive_sms: boolean;
  declare receive_push_mobile: boolean;
  declare receive_system_inbox: boolean;
  declare digest_frequency: string;
  declare quiet_hours_start?: string;
  declare quiet_hours_end?: string;
  declare created_at?: Date;
  declare updated_at?: Date;
}

NotificationSetting.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: "employee_information",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    receive_system_notifications: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    receive_attendance_notifications: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    receive_payroll_notifications: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    receive_leave_notifications: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    receive_overtime_notifications: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    receive_contract_notifications: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    receive_announcements: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    receive_email: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    receive_sms: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    receive_push_mobile: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    receive_system_inbox: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    digest_frequency: {
      type: DataTypes.ENUM("realtime", "daily", "weekly"),
      allowNull: false,
      defaultValue: "realtime",
    },
    quiet_hours_start: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    quiet_hours_end: {
      type: DataTypes.TIME,
      allowNull: true,
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
    tableName: "notification_settings",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        fields: ["employee_id"],
      },
    ],
  }
);

export default NotificationSetting;
