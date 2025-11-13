// src/routes/tax.routes.ts
import express from "express";
import TaxCalculationController from "../controllers/TaxCalculationController";
import { authentication } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/authorizeMiddleware";
import multer from "multer";

const taxRouter = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ===============================
// CẤU HÌNH THUẾ (Giảm trừ gia cảnh, lương tối thiểu)
// ===============================
taxRouter.get(
  "/configs",
  authentication,
  // authorize("tax_config_view_all"),
  TaxCalculationController.getAllConfigs
);

taxRouter.get(
  "/configs/:id",
  authentication,
  // authorize("tax_config_view"),
  TaxCalculationController.getConfigById
);

taxRouter.post(
  "/configs",
  authentication,
  // authorize("tax_config_create"),
  TaxCalculationController.createConfig
);

taxRouter.put(
  "/configs/:id",
  authentication,
  // authorize("tax_config_update"),
  TaxCalculationController.updateConfig
);

taxRouter.delete(
  "/configs/:id",
  authentication,
  // authorize("tax_config_delete"),
  TaxCalculationController.deleteConfig
);

// ===============================
// BẢNG THUẾ LŨY TIẾN (7 bậc)
// ===============================
taxRouter.get(
  "/brackets",
  authentication,
  // authorize("tax_bracket_view"),
  TaxCalculationController.getBrackets
);

taxRouter.post(
  "/brackets",
  authentication,
  // authorize("tax_bracket_create"),
  TaxCalculationController.createBracket
);

taxRouter.put(
  "/brackets/:id",
  authentication,
  // authorize("tax_bracket_update"),
  TaxCalculationController.updateBracket
);

taxRouter.delete(
  "/brackets/:id",
  authentication,
  // authorize("tax_bracket_delete"),
  TaxCalculationController.deleteBracket
);

// ===============================
// TÍNH THUẾ TNCN (PREVIEW + QUICK)
// ===============================
taxRouter.post(
  "/preview",
  authentication,
  // authorize("payroll_preview_tax"),
  TaxCalculationController.previewTax
);

taxRouter.get(
  "/quick",
  authentication,
  // authorize("payroll_preview_tax"),
  TaxCalculationController.quickTax
);

// ===============================
// EXPORT & IMPORT & TEMPLATE
// ===============================
taxRouter.get(
  "/export",
  authentication,
  // authorize("tax_export"),
  TaxCalculationController.exportTaxConfig
);

taxRouter.get(
  "/template",
  authentication,
  // authorize("tax_template"),
  TaxCalculationController.downloadTemplate
);

// Nếu bạn muốn import cấu hình thuế từ Excel (tùy chọn)
// taxRouter.post(
//   "/import",
//   authentication,
//   // authorize("tax_import"),
//   upload.single("file"),
//   TaxCalculationController.importConfig // ← cần thêm hàm trong controller nếu dùng
// );

export default taxRouter;
