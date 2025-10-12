import express from "express";
import {
  getOvertimeRulesController,
  getOvertimeRuleByIdController,
  createOvertimeRuleController,
  updateOvertimeRuleController,
  deleteOvertimeRuleController,
} from "../controllers/overtimeRuleController";
import { authentication } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/authorizeMiddleware";

const overTimeRuleRouter = express.Router();

// Lấy tất cả quy tắc tăng ca
overTimeRuleRouter.get(
  "/",
  authentication,
  authorize("overtime_rule_view_all"),
  getOvertimeRulesController
);

// Lấy chi tiết 1 quy tắc tăng ca
overTimeRuleRouter.get(
  "/:id",
  authentication,
  authorize("overtime_rule_view"),
  getOvertimeRuleByIdController
);

// Tạo quy tắc tăng ca mới
overTimeRuleRouter.post(
  "/",
  authentication,
  authorize("overtime_rule_create"),
  createOvertimeRuleController
);

// Cập nhật quy tắc tăng ca
overTimeRuleRouter.put(
  "/:id",
  authentication,
  authorize("overtime_rule_update"),
  updateOvertimeRuleController
);

// Xoá quy tắc tăng ca
overTimeRuleRouter.delete(
  "/:id",
  authentication,
  authorize("overtime_rule_delete"),
  deleteOvertimeRuleController
);

export default overTimeRuleRouter;
