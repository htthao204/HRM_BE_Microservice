import { Request, Response, NextFunction } from "express";
import { ResultResponse } from "../dto/response/resultResponse";
import * as WorkScheduleRuleService from "../services/workScheduleRuleService";

// ===============================
// 🟩 Lấy tất cả quy định (có phân trang)
// ===============================
export const getAllWorkScheduleRuleController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt((req.query.page as string) || "1");
    const pageSize = parseInt((req.query.pageSize as string) || "10");

    const result = await WorkScheduleRuleService.getFilteredRules({
      page,
      pageSize,
    });

    res.json(
      ResultResponse(
        true,
        200,
        null,
        null,
        result.data,
        result.pagination.total
      )
    );
  } catch (err: any) {
    next(err);
  }
};

// ===============================
// 🟨 Tạo quy định mới
// ===============================
export const createWorkScheduleRuleController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, ruleType, value, description, isActive } = req.body;

    if (!name || !ruleType || !value) {
      res
        .status(400)
        .json(
          ResultResponse(
            false,
            400,
            null,
            "Thiếu thông tin bắt buộc (name, ruleType, value)"
          )
        );
      return;
    }

    const rule = await WorkScheduleRuleService.createRule({
      name,
      ruleType,
      value,
      description,
      isActive,
    });

    res
      .status(201)
      .json(ResultResponse(true, 201, null, "Tạo quy định thành công", rule));
  } catch (err: any) {
    next(err);
  }
};

// ===============================
// 🟦 Cập nhật quy định
// ===============================
export const updateWorkScheduleRuleController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);
    const { name, ruleType, value, description, isActive } = req.body;

    if (!id || isNaN(id)) {
      res
        .status(400)
        .json(ResultResponse(false, 400, null, "ID quy định không hợp lệ"));
      return;
    }

    const updated = await WorkScheduleRuleService.updateRule(id, {
      name,
      ruleType,
      value,
      description,
      isActive,
    });

    res
      .status(200)
      .json(
        ResultResponse(true, 200, null, "Cập nhật quy định thành công", updated)
      );
  } catch (err: any) {
    next(err);
  }
};

// ===============================
// 🟥 Xóa quy định
// ===============================
export const deleteWorkScheduleRuleController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);
    if (!id || isNaN(id)) {
      res
        .status(400)
        .json(ResultResponse(false, 400, null, "ID quy định không hợp lệ"));
      return;
    }

    await WorkScheduleRuleService.deleteRule(id);

    res
      .status(200)
      .json(ResultResponse(true, 200, null, "Xóa quy định thành công"));
  } catch (err: any) {
    next(err);
  }
};

// ===============================
// 🟪 Lấy quy định theo ID
// ===============================
export const getWorkScheduleRuleByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res
        .status(400)
        .json(ResultResponse(false, 400, null, "ID quy định không hợp lệ"));
      return;
    }

    const rule = await WorkScheduleRuleService.getRuleById(id);

    res
      .status(200)
      .json(ResultResponse(true, 200, null, "Lấy quy định thành công", rule));
  } catch (err: any) {
    next(err);
  }
};

// ===============================
// 🟧 Lọc & phân trang quy định
// ===============================
export const getAllWorkScheduleRuleFilterController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt((req.query.page as string) || "1");
    const pageSize = parseInt((req.query.pageSize as string) || "10");

    const filters = {
      name: (req.query.name as string)?.trim(),
      ruleType: (req.query.ruleType as string)?.trim(),
      isActive:
        req.query.isActive !== undefined && req.query.isActive !== ""
          ? req.query.isActive === "true"
          : undefined,
      page,
      pageSize,
    };

    const result = await WorkScheduleRuleService.getFilteredRules(filters);

    res.json(
      ResultResponse(
        true,
        200,
        null,
        null,
        result.data,
        result.pagination.total
      )
    );
  } catch (err: any) {
    next(err);
  }
};
