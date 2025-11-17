// src/services/notificationTemplateService.ts
import NotificationTemplate from "../models/NotificationTemplateModel";
import { Op } from "sequelize";

export const createTemplate = async (templateData: any) => {
  try {
    const existingTemplate = await NotificationTemplate.findOne({
      where: { template_code: templateData.template_code },
    });

    if (existingTemplate) {
      throw new Error("Mã template đã tồn tại");
    }

    const newTemplate = await NotificationTemplate.create(templateData);
    return newTemplate.get({ plain: true });
  } catch (err: any) {
    console.error(err);
    throw new Error("Tạo template thất bại");
  }
};

export const getTemplateById = async (id: number) => {
  try {
    const template = await NotificationTemplate.findByPk(id, {
      include: [
        {
          association: "creator",
          attributes: ["id", "employee_code", "full_name"],
        },
      ],
    });

    if (!template) {
      throw new Error("Template không tồn tại");
    }

    return template.get({ plain: true });
  } catch (err: any) {
    console.error(err);
    throw new Error("Lấy template thất bại");
  }
};

export const getTemplateByCode = async (templateCode: string) => {
  try {
    const template = await NotificationTemplate.findOne({
      where: { template_code: templateCode },
      include: [
        {
          association: "creator",
          attributes: ["id", "employee_code", "full_name"],
        },
      ],
    });

    if (!template) {
      throw new Error("Template không tồn tại");
    }

    return template.get({ plain: true });
  } catch (err: any) {
    console.error(err);
    throw new Error("Lấy template theo mã thất bại");
  }
};

export const getAllTemplates = async (includeInactive: boolean = false) => {
  try {
    const where: any = {};

    if (!includeInactive) {
      where.is_active = true;
    }

    const templates = await NotificationTemplate.findAll({
      where,
      include: [
        {
          association: "creator",
          attributes: ["id", "employee_code", "full_name"],
        },
      ],
      order: [["template_name", "ASC"]],
    });

    return templates.map((t) => t.get({ plain: true }));
  } catch (err: any) {
    console.error(err);
    throw new Error("Lấy danh sách template thất bại");
  }
};

export const updateTemplate = async (id: number, templateData: any) => {
  try {
    const [affectedRows] = await NotificationTemplate.update(templateData, {
      where: { id },
    });

    if (affectedRows === 0) {
      throw new Error("Template không tồn tại");
    }

    const updatedTemplate = await NotificationTemplate.findByPk(id);
    return updatedTemplate ? updatedTemplate.get({ plain: true }) : null;
  } catch (err: any) {
    console.error(err);
    throw new Error("Cập nhật template thất bại");
  }
};

export const deleteTemplate = async (id: number) => {
  try {
    const [affectedRows] = await NotificationTemplate.update(
      { is_active: false },
      { where: { id } }
    );

    if (affectedRows === 0) {
      throw new Error("Template không tồn tại");
    }

    return { message: "Template đã được vô hiệu hóa thành công" };
  } catch (err: any) {
    console.error(err);
    throw new Error("Xóa template thất bại");
  }
};

export const restoreTemplate = async (id: number) => {
  try {
    const [affectedRows] = await NotificationTemplate.update(
      { is_active: true },
      { where: { id } }
    );

    if (affectedRows === 0) {
      throw new Error("Template không tồn tại");
    }

    return { message: "Template đã được khôi phục thành công" };
  } catch (err: any) {
    console.error(err);
    throw new Error("Khôi phục template thất bại");
  }
};

export const searchTemplates = async (searchTerm: string) => {
  try {
    const templates = await NotificationTemplate.findAll({
      where: {
        [Op.or]: [
          { template_code: { [Op.iLike]: `%${searchTerm}%` } },
          { template_name: { [Op.iLike]: `%${searchTerm}%` } },
          { description: { [Op.iLike]: `%${searchTerm}%` } },
        ],
        is_active: true,
      },
      order: [["template_name", "ASC"]],
    });

    return templates.map((t) => t.get({ plain: true }));
  } catch (err: any) {
    console.error(err);
    throw new Error("Tìm kiếm template thất bại");
  }
};

export const renderTemplate = async (
  templateCode: string,
  data: Record<string, any>
) => {
  try {
    const template = await getTemplateByCode(templateCode);

    let renderedMessage = template.message_template;
    let renderedSubject = template.subject_template || "";

    // Thay thế các biến trong template
    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{{${key}}}`;
      renderedMessage = renderedMessage.replace(
        new RegExp(placeholder, "g"),
        String(value)
      );
      renderedSubject = renderedSubject.replace(
        new RegExp(placeholder, "g"),
        String(value)
      );
    }

    return {
      subject: renderedSubject,
      message: renderedMessage,
      template: template,
    };
  } catch (err: any) {
    console.error(err);
    throw new Error("Render template thất bại");
  }
};
