// src/routes/payrollRule.routes.ts
import express from "express";
import PayrollRuleController from "../controllers/payrollRuleController";
import { authentication } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/authorizeMiddleware";
import multer from "multer";

const payrollRuleRouter = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ===============================
// LẤY DANH SÁCH + TÌM KIẾM + PHÂN TRANG
// ===============================
payrollRuleRouter.get(
  "/rules",
  authentication,
  // authorize("payroll_rule_view_all"),
  PayrollRuleController.getAll
);

// ===============================
// LẤY CẤU HÌNH LƯƠNG (TAX, BH, NGÀY CÔNG...)
// ===============================
payrollRuleRouter.get(
  "/rules/config",
  authentication,
  // authorize("payroll_config_view"),
  PayrollRuleController.getConfig
);

// ===============================
// DROPDOWN QUY TẮC ACTIVE
// ===============================
payrollRuleRouter.get(
  "/rules/dropdown",
  authentication,
  PayrollRuleController.getForDropdown
);

// ===============================
// LẤY THEO ID
// ===============================
payrollRuleRouter.get(
  "/rules/:id",
  authentication,
  // authorize("payroll_rule_view"),
  PayrollRuleController.getById
);

// ===============================
// TẠO MỚI QUY TẮC
// ===============================
payrollRuleRouter.post(
  "/rules",
  authentication,
  // authorize("payroll_rule_create"),
  PayrollRuleController.create
);

// ===============================
// CẬP NHẬT QUY TẮC
// ===============================
payrollRuleRouter.put(
  "/rules/:id",
  authentication,
  // authorize("payroll_rule_update"),
  PayrollRuleController.update
);

// ===============================
// TOGGLE TRẠNG THÁI (BẬT/TẮT QUY TẮC)
// ===============================
payrollRuleRouter.patch(
  "/rules/:id/toggle",
  authentication,
  // authorize("payroll_rule_update"),
  PayrollRuleController.toggleStatus
);

// ===============================
// XÓA QUY TẮC
// ===============================
payrollRuleRouter.delete(
  "/rules/:id",
  authentication,
  // authorize("payroll_rule_delete"),
  PayrollRuleController.delete
);

// ===============================
// TÍNH LƯƠNG PREVIEW (SIÊU MẠNH - FE DÙNG NHIỀU NHẤT)
// ===============================
payrollRuleRouter.post(
  "/rules/calculate",
  authentication,
  // authorize("payroll_calculate"),
  PayrollRuleController.calculate
);

// ===============================
// XUẤT EXCEL DANH SÁCH QUY TẮC
// ===============================
payrollRuleRouter.get(
  "/rules/export",
  authentication,
  // authorize("payroll_rule_export"),
  PayrollRuleController.export
);

export default payrollRuleRouter;
