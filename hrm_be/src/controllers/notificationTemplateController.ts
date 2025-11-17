// src/controllers/notificationTemplateController.ts
import { Request, Response, NextFunction } from "express";
import {
  createTemplate,
  getTemplateById,
  getTemplateByCode,
  getAllTemplates,
  updateTemplate,
  deleteTemplate,
  restoreTemplate,
  searchTemplates,
  renderTemplate,
} from "../services/notificationTemplateService";
import { ResultResponse } from "../dto/response/resultResponse";

// Tạo template mới
export const createTemplateController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const newTemplate = await createTemplate(req.body);
    res
      .status(201)
      .json(
        ResultResponse(true, 201, null, "Tạo template thành công", newTemplate)
      );
  } catch (err: any) {
    next(err);
  }
};

// Lấy template theo ID
export const getTemplateByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, "ID không được để trống"));
    }

    const template = await getTemplateById(id);
    res.json(ResultResponse(true, 200, null, null, template));
  } catch (err: any) {
    next(err);
  }
};

// Lấy template theo mã
export const getTemplateByCodeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const templateCode = req.params.code;
    if (!templateCode) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, "Template code không được để trống"));
    }

    const template = await getTemplateByCode(templateCode);
    res.json(ResultResponse(true, 200, null, null, template));
  } catch (err: any) {
    next(err);
  }
};

// Lấy tất cả template
export const getAllTemplatesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const templates = await getAllTemplates(includeInactive);
    res.json(
      ResultResponse(true, 200, null, null, templates, templates.length)
    );
  } catch (err: any) {
    next(err);
  }
};

// Cập nhật template
export const updateTemplateController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, "ID không được để trống"));
    }

    const updatedTemplate = await updateTemplate(id, req.body);
    res.json(
      ResultResponse(
        true,
        200,
        null,
        "Cập nhật template thành công",
        updatedTemplate
      )
    );
  } catch (err: any) {
    next(err);
  }
};

// Xóa template
export const deleteTemplateController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, "ID không được để trống"));
    }

    const result = await deleteTemplate(id);
    res.json(ResultResponse(true, 200, null, result.message, null));
  } catch (err: any) {
    next(err);
  }
};

// Khôi phục template
export const restoreTemplateController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, "ID không được để trống"));
    }

    const result = await restoreTemplate(id);
    res.json(ResultResponse(true, 200, null, result.message, null));
  } catch (err: any) {
    next(err);
  }
};

// Tìm kiếm template
export const searchTemplatesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const searchTerm = req.query.q as string;
    if (!searchTerm) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, "Search term không được để trống"));
    }

    const templates = await searchTemplates(searchTerm);
    res.json(
      ResultResponse(true, 200, null, null, templates, templates.length)
    );
  } catch (err: any) {
    next(err);
  }
};

// Render template với dữ liệu
export const renderTemplateController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const templateCode = req.params.code;
    const data = req.body;

    if (!templateCode) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, "Template code không được để trống"));
    }

    const rendered = await renderTemplate(templateCode, data);
    res.json(
      ResultResponse(true, 200, null, "Render template thành công", rendered)
    );
  } catch (err: any) {
    next(err);
  }
};
