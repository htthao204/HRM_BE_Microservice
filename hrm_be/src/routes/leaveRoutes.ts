import { Router } from "express";
import { authentication } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/authorizeMiddleware";
import {
  createLeaveController,
  getLeaveByIdController,
  updateLeaveController,
  deleteLeaveController,
  getLeavesByFilterController,
  exportExcelController,
  importLeavesFromExcelController,
  uploadFile,
  downloadLeaveTemplateController,
  getLeaveBalanceController,
  getMyLeaveBalanceController,
} from "../controllers/leaveController";

const leaveRouter = Router();

// ==============================
// ROUTES
// ==============================

// Tạo mới đơn nghỉ
leaveRouter.post("/", authentication, createLeaveController);

// // Lấy tất cả đơn nghỉ
leaveRouter.get("/", authentication, getLeavesByFilterController);
leaveRouter.get("/export-excel", exportExcelController);
leaveRouter.post("/import-excel", uploadFile, importLeavesFromExcelController);
leaveRouter.get("/template", downloadLeaveTemplateController);
// Lấy đơn nghỉ theo filter tổng hợp
leaveRouter.get("/filter", authentication, getLeavesByFilterController);
leaveRouter.get("/employee/:employeeId/balance", getLeaveBalanceController);
leaveRouter.get("/my/balance", getMyLeaveBalanceController);
// Lấy đơn nghỉ theo employeeId
leaveRouter.get(
  "/employee/:employeeId",
  authentication,
  getLeaveByIdController
);

// Lấy đơn nghỉ theo ID
leaveRouter.get("/:id", authentication, getLeaveByIdController);

// Cập nhật đơn nghỉ
leaveRouter.put("/:id", authentication, updateLeaveController);

// Xóa đơn nghỉ
leaveRouter.delete("/:id", authentication, deleteLeaveController);

export default leaveRouter;
