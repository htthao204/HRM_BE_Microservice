import express from "express";
import {
  getEmployeePositionHistoriesController,
  getEmployeePositionHistoryByIdController,
  createEmployeePositionHistoryController,
  updateEmployeePositionHistoryController,
  deleteEmployeePositionHistoryController,
} from "../controllers/employeePositionHistoryController";
import { authentication } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/authorizeMiddleware";

const employeePositionRouter = express.Router();

//  Xem tất cả lịch sử chức vụ
employeePositionRouter.get(
  "/",
  authentication,
  ////authorize("employee_position_history_view_all"),
  getEmployeePositionHistoriesController
);

// Xem chi tiết lịch sử chức vụ theo ID
employeePositionRouter.get(
  "/:id",
  authentication,
  ////authorize("employee_position_history_view"),
  getEmployeePositionHistoryByIdController
);

//  Thêm mới lịch sử chức vụ
employeePositionRouter.post(
  "/",
  authentication,
  ////authorize("employee_position_history_create"),
  createEmployeePositionHistoryController
);

// Cập nhật lịch sử chức vụ
employeePositionRouter.put(
  "/:id",
  authentication,
  // //authorize("employee_position_history_update"),
  updateEmployeePositionHistoryController
);

//  Xóa lịch sử chức vụ
employeePositionRouter.delete(
  "/:id",
  authentication,
  ////authorize("employee_position_history_delete"),
  deleteEmployeePositionHistoryController
);

export default employeePositionRouter;
