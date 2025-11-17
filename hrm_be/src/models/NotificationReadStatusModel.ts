// src/models/NotificationReadStatusModel.ts
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

interface NotificationReadStatusAttributes {
  id: number;
  notification_id: number;
  employee_id: number;
  is_read: boolean;
  read_at?: Date;
  is_action_taken: boolean;
  action_taken_at?: Date;
  action_note?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface NotificationReadStatusCreationAttributes
  extends Optional<
    NotificationReadStatusAttributes,
    | "id"
    | "is_read"
    | "read_at"
    | "is_action_taken"
    | "action_taken_at"
    | "action_note"
    | "created_at"
    | "updated_at"
  > {}

class NotificationReadStatus
  extends Model<
    NotificationReadStatusAttributes,
    NotificationReadStatusCreationAttributes
  >
  implements NotificationReadStatusAttributes
{
  declare id: number;
  declare notification_id: number;
  declare employee_id: number;
  declare is_read: boolean;
  declare read_at?: Date;
  declare is_action_taken: boolean;
  declare action_taken_at?: Date;
  declare action_note?: string;
  declare created_at?: Date;
  declare updated_at?: Date;
}

NotificationReadStatus.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    notification_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "notifications",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "employee_information",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    is_action_taken: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    action_taken_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    action_note: {
      type: DataTypes.TEXT,
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
    tableName: "notification_read_status",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        unique: true,
        fields: ["notification_id", "employee_id"],
      },
      {
        fields: ["employee_id", "is_read"],
      },
      {
        fields: ["notification_id", "is_read"],
      },
    ],
  }
);

export default NotificationReadStatus;
