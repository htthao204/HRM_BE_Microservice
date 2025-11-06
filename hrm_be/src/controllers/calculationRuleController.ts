import { Request, Response, NextFunction } from "express";
import {
  getAllCalculationRules,
  getCalculationRuleById,
  createCalculationRule,
  updateCalculationRule,
  deleteCalculationRule,
  CalculationRuleFilter,
} from "../services/calculationRuleService";
import { ResultResponse } from "../dto/response/resultResponse";

// ==========================
// Lấy tất cả (có phân trang + filter)
// ==========================
export const getAllCalculationRulesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const filters: CalculationRuleFilter = {
      ruleCode: req.query.ruleCode as string,
      name: req.query.name as string,
      ruleCategory: req.query.ruleCategory as string,
      ruleType: req.query.ruleType as string,
      isActive:
        req.query.isActive !== undefined
          ? req.query.isActive === "true"
          : undefined,
    };

    const result = await getAllCalculationRules(page, pageSize, filters);

    res
      .status(200)
      .json(
        ResultResponse(true, 200, null, null, result.data, result.totalItems)
      );
  } catch (error) {
    next(error);
  }
};

// ==========================
// Lấy theo ID
// ==========================
export const getCalculationRuleByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);
    const rule = await getCalculationRuleById(id);

    if (!rule) {
      return res
        .status(404)
        .json(ResultResponse(false, 404, "Không tìm thấy quy tắc tính lương"));
    }

    res.status(200).json(ResultResponse(true, 200, null, null, rule));
  } catch (error) {
    next(error);
  }
};

// ==========================
// Tạo mới
// ==========================
export const createCalculationRuleController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const newRule = await createCalculationRule(req.body);
    res.status(201).json(ResultResponse(true, 201, null, null, newRule));
  } catch (error) {
    next(error);
  }
};

// ==========================
// Cập nhật
// ==========================
export const updateCalculationRuleController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);
    const updatedRule = await updateCalculationRule(id, req.body);

    if (!updatedRule) {
      return res
        .status(404)
        .json(ResultResponse(false, 404, "Không tìm thấy quy tắc tính lương"));
    }

    res.status(200).json(ResultResponse(true, 200, null, null, updatedRule));
  } catch (error) {
    next(error);
  }
};

// ==========================
// Xóa
// ==========================
export const deleteCalculationRuleController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await deleteCalculationRule(id);

    if (!deleted) {
      return res
        .status(404)
        .json(ResultResponse(false, 404, "Không tìm thấy quy tắc tính lương"));
    }

    res.status(200).json(ResultResponse(true, 200, null, null, null));
  } catch (error) {
    next(error);
  }
};
