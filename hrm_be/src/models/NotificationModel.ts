// src/models/NotificationModel.ts
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

interface NotificationAttributes {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  recipient_type: string;
  recipient_id?: number;
  priority: string;
  status: string;
  action_url?: string;
  action_label?: string;
  metadata?: object;
  scheduled_at?: Date;
  sent_at?: Date;
  expires_at?: Date;
  sender_id?: number;
  created_by: number;
  updated_by?: number;
  created_at?: Date;
  updated_at?: Date;
}

interface NotificationCreationAttributes
  extends Optional<
    NotificationAttributes,
    | "id"
    | "recipient_id"
    | "action_url"
    | "action_label"
    | "metadata"
    | "scheduled_at"
    | "sent_at"
    | "expires_at"
    | "sender_id"
    | "updated_by"
    | "created_at"
    | "updated_at"
  > {}

class Notification
  extends Model<NotificationAttributes, NotificationCreationAttributes>
  implements NotificationAttributes
{
  declare id: number;
  declare title: string;
  declare message: string;
  declare notification_type: string;
  declare recipient_type: string;
  declare recipient_id?: number;
  declare priority: string;
  declare status: string;
  declare action_url?: string;
  declare action_label?: string;
  declare metadata?: object;
  declare scheduled_at?: Date;
  declare sent_at?: Date;
  declare expires_at?: Date;
  declare sender_id?: number;
  declare created_by: number;
  declare updated_by?: number;
  declare created_at?: Date;
  declare updated_at?: Date;
}

Notification.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    notification_type: {
      type: DataTypes.ENUM(
        "system",
        "attendance",
        "payroll",
        "leave",
        "overtime",
        "contract",
        "warning",
        "reminder",
        "announcement",
        "task"
      ),
      allowNull: false,
      defaultValue: "system",
    },
    recipient_type: {
      type: DataTypes.ENUM("all", "department", "role", "individual"),
      allowNull: false,
      defaultValue: "individual",
    },
    recipient_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    priority: {
      type: DataTypes.ENUM("low", "medium", "high", "urgent"),
      allowNull: false,
      defaultValue: "medium",
    },
    status: {
      type: DataTypes.ENUM("draft", "sent", "read", "archived"),
      allowNull: false,
      defaultValue: "draft",
    },
    action_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    action_label: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    scheduled_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    sender_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "employee_information",
        key: "id",
      },
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "employee_information",
        key: "id",
      },
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "employee_information",
        key: "id",
      },
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
    tableName: "notifications",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default Notification;
