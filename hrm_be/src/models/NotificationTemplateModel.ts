// src/models/NotificationTemplateModel.ts
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

interface NotificationTemplateAttributes {
  id: number;
  template_code: string;
  template_name: string;
  template_type: string;
  subject_template?: string;
  message_template: string;
  variables: object;
  is_active: boolean;
  description?: string;
  created_by: number;
  updated_by?: number;
  created_at?: Date;
  updated_at?: Date;
}

interface NotificationTemplateCreationAttributes
  extends Optional<
    NotificationTemplateAttributes,
    | "id"
    | "subject_template"
    | "description"
    | "updated_by"
    | "created_at"
    | "updated_at"
  > {}

class NotificationTemplate
  extends Model<
    NotificationTemplateAttributes,
    NotificationTemplateCreationAttributes
  >
  implements NotificationTemplateAttributes
{
  declare id: number;
  declare template_code: string;
  declare template_name: string;
  declare template_type: string;
  declare subject_template?: string;
  declare message_template: string;
  declare variables: object;
  declare is_active: boolean;
  declare description?: string;
  declare created_by: number;
  declare updated_by?: number;
  declare created_at?: Date;
  declare updated_at?: Date;
}

NotificationTemplate.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    template_code: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    template_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    template_type: {
      type: DataTypes.ENUM("email", "system", "sms", "mobile_push"),
      allowNull: false,
      defaultValue: "system",
    },
    subject_template: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    message_template: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    variables: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    tableName: "notification_templates",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        fields: ["template_code"],
      },
      {
        fields: ["is_active"],
      },
    ],
  }
);

export default NotificationTemplate;
