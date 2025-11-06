import { Router } from "express";
import { authentication } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/authorizeMiddleware";
import {
  createWorkScheduleRuleController,
  updateWorkScheduleRuleController,
  deleteWorkScheduleRuleController,
  getWorkScheduleRuleByIdController,
  getAllWorkScheduleRuleController,
  getAllWorkScheduleRuleFilterController,
} from "../controllers/workScheduleRuleController";

const workScheduleRuleRouters = Router();

// 🟩 Lấy tất cả quy tắc (phân trang)
workScheduleRuleRouters.get(
  "/all/page",
  authentication,
  //authorize("work_schedule_rule_view_all"),
  getAllWorkScheduleRuleController
);

// 🟦 Lọc + phân trang
workScheduleRuleRouters.get(
  "/filter",
  authentication,
  //authorize("work_schedule_rule_view_all"),
  getAllWorkScheduleRuleFilterController
);

// 🟨 Lấy chi tiết theo ID
workScheduleRuleRouters.get(
  "/:id",
  authentication,
  //authorize("work_schedule_rule_view"),
  getWorkScheduleRuleByIdController
);

// 🟩 Tạo mới quy tắc
workScheduleRuleRouters.post(
  "/",
  authentication,
  //authorize("work_schedule_rule_create"),
  createWorkScheduleRuleController
);

// 🟦 Cập nhật quy tắc
workScheduleRuleRouters.put(
  "/:id",
  authentication,
  //authorize("work_schedule_rule_update"),
  updateWorkScheduleRuleController
);

// 🟥 Xóa quy tắc
workScheduleRuleRouters.delete(
  "/:id",
  authentication,
  //authorize("work_schedule_rule_delete"),
  deleteWorkScheduleRuleController
);

export default workScheduleRuleRouters;
