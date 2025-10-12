import { NextFunction, Request, Response } from "express";
import * as overtimeRuleService from "../services/overtimeRuleService";
import { ResultResponse } from "../dto/response/resultResponse";

// Lấy danh sách quy tắc tăng ca (có phân trang)
export const getOvertimeRulesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const result = await overtimeRuleService.getAllOvertimeRules(
      page,
      pageSize
    );

    return res.json(
      ResultResponse(true, 200, null, null, result.data, result.totalItems)
    );
  } catch (err: any) {
    next(err);
  }
};

// Lấy quy tắc tăng ca theo ID
export const getOvertimeRuleByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);
    const rule = await overtimeRuleService.getOvertimeRuleById(id);

    return res.json(ResultResponse(true, 200, null, null, rule));
  } catch (err: any) {
    next(err);
  }
};

// Tạo mới quy tắc tăng ca
export const createOvertimeRuleController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body;
    const newRule = await overtimeRuleService.createOvertimeRule(data);
    return res.json(ResultResponse(true, 201, null, null, newRule));
  } catch (err: any) {
    next(err);
  }
};

// Cập nhật quy tắc tăng ca
export const updateOvertimeRuleController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;
    const updatedRule = await overtimeRuleService.updateOvertimeRule(id, data);

    return res.json(ResultResponse(true, 200, null, null, updatedRule));
  } catch (err: any) {
    next(err);
  }
};

// Xóa quy tắc tăng ca
export const deleteOvertimeRuleController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);
    await overtimeRuleService.deleteOvertimeRule(id);

    return res.json(
      ResultResponse(true, 200, null, null, {
        message: "Xóa quy tắc tăng ca thành công",
      })
    );
  } catch (err: any) {
    next(err);
  }
};
