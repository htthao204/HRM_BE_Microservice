import { Router } from "express";
import {
  createLateEarlyRuleController,
  getAllLateEarlyRulesController,
  getLateEarlyRuleByIdController,
  updateLateEarlyRuleController,
  updateLateEarlyRuleStatusController,
  deleteLateEarlyRuleController,
  exportRulesToExcel,
  downloadRulesTemplate,
  importRulesFromExcel,
} from "../controllers/lateEarlyRuleController";
import { authentication } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/authorizeMiddleware";
import multer from "multer";
const lateEarlyRuleRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });
// 🔹 Lấy tất cả quy định
lateEarlyRuleRouter.get(
  "/filter",
  authentication,
  ////authorize("late_early_rule_view_all"),
  getAllLateEarlyRulesController
);
lateEarlyRuleRouter.get("/export-excel", exportRulesToExcel);
lateEarlyRuleRouter.post(
  "/import-excel",
  upload.single("file"),
  importRulesFromExcel
);
lateEarlyRuleRouter.get("/download-template", downloadRulesTemplate);
// 🔹 Lấy chi tiết theo ID
lateEarlyRuleRouter.get(
  "/:id",
  authentication,
  ////authorize("late_early_rule_view"),
  getLateEarlyRuleByIdController
);

// 🔹 Tạo mới
lateEarlyRuleRouter.post(
  "/",
  authentication,
  ////authorize("late_early_rule_create"),
  createLateEarlyRuleController
);

// 🔹 Cập nhật
lateEarlyRuleRouter.put(
  "/:id",
  authentication,
  ////authorize("late_early_rule_update"),
  updateLateEarlyRuleController
);

// 🔹 Cập nhật trạng thái
lateEarlyRuleRouter.patch(
  "/:id/status",
  authentication,
  ////authorize("late_early_rule_update_status"),
  updateLateEarlyRuleStatusController
);

// 🔹 Xóa
lateEarlyRuleRouter.delete(
  "/:id",
  authentication,
  ////authorize("late_early_rule_delete"),
  deleteLateEarlyRuleController
);

export default lateEarlyRuleRouter;
