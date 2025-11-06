import { Request, Response, NextFunction } from "express";
import {
  createLateEarlyRule,
  getAllLateEarlyRules,
  getLateEarlyRuleById,
  updateLateEarlyRule,
  deleteLateEarlyRule,
  updateLateEarlyRuleStatus,
  createLateEarlyRulesTemplate,
  importLateEarlyRulesFromExcel,
  exportLateEarlyRulesToExcelBuffer,
} from "../services/lateEarlyRuleService";
import { ResultResponse } from "../dto/response/resultResponse";

// 🟢 Tạo quy định đi muộn/về sớm
export const createLateEarlyRuleController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const newRule = await createLateEarlyRule(req.body);
    res
      .status(201)
      .json(
        ResultResponse(
          true,
          201,
          null,
          "Tạo quy định đi muộn/về sớm thành công",
          newRule
        )
      );
  } catch (err: any) {
    next(err);
  }
};

// 🟢 Lấy tất cả quy định
export const getAllLateEarlyRulesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const rules = await getAllLateEarlyRules();
    res.json(ResultResponse(true, 200, null, null, rules, rules.length));
  } catch (err: any) {
    next(err);
  }
};

// 🟢 Lấy quy định theo ID
export const getLateEarlyRuleByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    if (!id)
      return res
        .status(400)
        .json(ResultResponse(false, 400, "ID không được để trống"));

    const rule = await getLateEarlyRuleById(id);
    res.json(ResultResponse(true, 200, null, null, rule));
  } catch (err: any) {
    next(err);
  }
};

// 🟢 Cập nhật quy định
export const updateLateEarlyRuleController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    if (!id)
      return res
        .status(400)
        .json(ResultResponse(false, 400, "ID không được để trống"));

    const updated = await updateLateEarlyRule(id, req.body);
    res.json(
      ResultResponse(true, 200, null, "Cập nhật quy định thành công", updated)
    );
  } catch (err: any) {
    next(err);
  }
};

// 🟢 Cập nhật trạng thái hoạt động
export const updateLateEarlyRuleStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    const { isActive } = req.body;
    if (!id)
      return res
        .status(400)
        .json(ResultResponse(false, 400, "ID không được để trống"));

    const updated = await updateLateEarlyRuleStatus(id, isActive);
    res.json(
      ResultResponse(true, 200, null, "Cập nhật trạng thái thành công", updated)
    );
  } catch (err: any) {
    next(err);
  }
};

// 🔴 Xóa quy định
export const deleteLateEarlyRuleController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    if (!id)
      return res
        .status(400)
        .json(ResultResponse(false, 400, "ID không được để trống"));

    const deletedCount = await deleteLateEarlyRule(id);
    if (deletedCount === 0) {
      return res
        .status(404)
        .json(ResultResponse(false, 404, "Không tìm thấy quy định để xóa"));
    }

    res.json(ResultResponse(true, 200, null, "Xóa quy định thành công", null));
  } catch (err: any) {
    next(err);
  }
};
// 🟪 Xuất Excel
export const exportRulesToExcel = async (req: Request, res: Response) => {
  try {
    const { query, ruleType, isActive } = req.query;

    const filter = {
      query: query as string,
      ruleType: ruleType as string,
      isActive:
        isActive === "true" ? true : isActive === "false" ? false : undefined,
    };

    const buffer = await exportLateEarlyRulesToExcelBuffer(filter);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="quy-dinh-di-muon-ve-som-${
        new Date().toISOString().split("T")[0]
      }.xlsx"`
    );

    res.send(buffer);
  } catch (error: any) {
    console.error("Lỗi xuất Excel:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi xuất file Excel",
      error: error.message,
    });
  }
};

// 🟪 Nhập Excel
export const importRulesFromExcel = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn file Excel để nhập",
      });
    }

    const results = await importLateEarlyRulesFromExcel(req.file.buffer);

    res.json({
      success: true,
      message: `Nhập file thành công: ${results.success} bản ghi mới, ${results.updated} bản ghi cập nhật`,
      data: results,
    });
  } catch (error: any) {
    console.error("Lỗi nhập Excel:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi nhập file Excel",
      error: error.message,
    });
  }
};

// 🟪 Download template
export const downloadRulesTemplate = async (req: Request, res: Response) => {
  try {
    const buffer = await createLateEarlyRulesTemplate();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=template-quy-dinh-di-muon-ve-som.xlsx"
    );

    res.send(buffer);
  } catch (error: any) {
    console.error("Lỗi tạo template:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi tạo template",
      error: error.message,
    });
  }
};
