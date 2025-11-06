import { Router } from "express";
import { authentication } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/authorizeMiddleware";
import {
  getAllCalculationRulesController,
  getCalculationRuleByIdController,
  createCalculationRuleController,
  updateCalculationRuleController,
  deleteCalculationRuleController,
} from "../controllers/calculationRuleController";

const caculationRouter = Router();

// ==============================
// ROUTES
// ==============================

// Tạo mới quy tắc tính lương
caculationRouter.post(
  "/",
  authentication,
  // authorize("create_calculation_rule"),
  createCalculationRuleController
);

// Lấy tất cả quy tắc (có phân trang + filter)
caculationRouter.get(
  "/",
  authentication,
  // authorize("view_calculation_rule"),
  getAllCalculationRulesController
);

// Lấy theo ID
caculationRouter.get(
  "/:id",
  authentication,
  // authorize("view_calculation_rule"),
  getCalculationRuleByIdController
);

// Cập nhật quy tắc
caculationRouter.put(
  "/:id",
  authentication,
  // authorize("update_calculation_rule"),
  updateCalculationRuleController
);

// Xóa quy tắc
caculationRouter.delete(
  "/:id",
  authentication,
  // authorize("delete_calculation_rule"),
  deleteCalculationRuleController
);

export default caculationRouter;
