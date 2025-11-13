// src/routers/employeeSalaryGradeRouter.ts
import { Router } from "express";
import { authentication } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/authorizeMiddleware";
import {
  assignGradeController,
  getCurrentGradeController,
  getHistoryController,
  searchAssignmentsController,
  getEmployeesByGradeController,
  terminateGradeController,
  getGradeUsageStatsController,
} from "../controllers/employeeSalaryGradeController";

const employeeSalaryGradeRouter = Router();

// Gán bậc lương mới cho nhân viên
employeeSalaryGradeRouter.post(
  "/assign",
  authentication,
  // authorize("salary_assign"),
  assignGradeController
);

// Lấy bậc lương hiện tại
employeeSalaryGradeRouter.get(
  "/current/:employee_id",
  authentication,
  // authorize("salary_view_current"),
  getCurrentGradeController
);

// Lấy lịch sử gán bậc lương
employeeSalaryGradeRouter.get(
  "/history/:employee_id",
  authentication,
  // authorize("salary_view_history"),
  getHistoryController
);

// Tìm kiếm toàn bộ lịch sử
employeeSalaryGradeRouter.get(
  "/search",
  authentication,
  // authorize("salary_search"),
  searchAssignmentsController
);

// Lấy danh sách nhân viên theo bậc lương
employeeSalaryGradeRouter.get(
  "/by-grade/:salary_grade_id",
  authentication,
  // authorize("salary_view_by_grade"),
  getEmployeesByGradeController
);

// Kết thúc bậc lương
employeeSalaryGradeRouter.patch(
  "/terminate/:id",
  authentication,
  // authorize("salary_terminate"),
  terminateGradeController
);

// Thống kê sử dụng bậc lương
employeeSalaryGradeRouter.get(
  "/stats/usage",
  authentication,
  // authorize("salary_stats"),
  getGradeUsageStatsController
);

export default employeeSalaryGradeRouter;
