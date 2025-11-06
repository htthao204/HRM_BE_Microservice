import express from "express";
import {
  getAttendancesController,
  getAttendanceByIdController,
  createAttendanceController,
  updateAttendanceController,
  deleteAttendanceController,
  getAttendancesByEmployeeIdController,
} from "../controllers/attendanceController";
import { authentication } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/authorizeMiddleware";

const attendanceRouter = express.Router();

// ==============================
// 📘 Lấy danh sách chấm công (có phân trang)
// ==============================
attendanceRouter.get(
  "/",
  authentication,
  // authorize("attendance_view_all"),
  getAttendancesController
);

// ==============================
// 📘 Lấy danh sách chấm công theo employeeId
// ==============================
attendanceRouter.get(
  "/employee/:employeeId",
  authentication,
  // authorize("attendance_view_by_employee"),
  getAttendancesByEmployeeIdController
);

// ==============================
// 📘 Lấy chấm công theo ID (đặt sau /employee để tránh xung đột route)
// ==============================
attendanceRouter.get(
  "/:id",
  authentication,
  // authorize("attendance_view"),
  getAttendanceByIdController
);

// ==============================
// 📘 Tạo mới chấm công
// ==============================
attendanceRouter.post(
  "/",
  authentication,
  // authorize("attendance_create"),
  createAttendanceController
);

// ==============================
// 📘 Cập nhật chấm công
// ==============================
attendanceRouter.put(
  "/:id",
  authentication,
  // authorize("attendance_update"),
  updateAttendanceController
);

// ==============================
// 📘 Xóa chấm công
// ==============================
attendanceRouter.delete(
  "/:id",
  authentication,
  // authorize("attendance_delete"),
  deleteAttendanceController
);

export default attendanceRouter;
