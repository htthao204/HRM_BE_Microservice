import { Router } from "express";
import { authentication } from "./../middlewares/authMiddleware";
import { authorize } from "./../middlewares/authorizeMiddleware";

import {
  createLeaveController,
  getLeaveByIdController,
  getAllLeavesController,
  updateLeaveController,
  deleteLeaveController,
  getLeavesByEmployeeIdController,
  getLeavesByLeaveTypeController,
  getLeavesByDateRangeController,
  getLeavesByFilterController,
} from "../controllers/leaveController";

const leaveRouter = Router();

// Tạo mới đơn nghỉ
leaveRouter.post("/", authentication, createLeaveController);

// Lấy tất cả đơn nghỉ
leaveRouter.get("/", authentication, getAllLeavesController);

// Lấy đơn nghỉ theo ID
leaveRouter.get("/:id", authentication, getLeaveByIdController);

// Cập nhật đơn nghỉ
leaveRouter.put("/:id", authentication, updateLeaveController);

// Xóa đơn nghỉ
leaveRouter.delete("/:id", authentication, deleteLeaveController);

// Lấy đơn nghỉ theo employeeId
leaveRouter.get(
  "/employee/:employeeId",
  authentication,
  getLeavesByEmployeeIdController
);

// Lấy đơn nghỉ theo leaveTypeId
leaveRouter.get(
  "/type/:leaveTypeId",
  authentication,
  getLeavesByLeaveTypeController
);

// Lấy đơn nghỉ theo khoảng ngày
leaveRouter.get("/daterange", authentication, getLeavesByDateRangeController);

// Lấy đơn nghỉ theo filter tổng hợp (employeeId, leaveTypeId, startDate, endDate)
leaveRouter.get("/filter", authentication, getLeavesByFilterController);

export default leaveRouter;
