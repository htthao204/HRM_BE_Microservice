import express from "express";
import {
  getAttendancesController,
  getAttendanceByIdController,
  createAttendanceController,
  updateAttendanceController,
  deleteAttendanceController,
  getAttendancesByEmployeeIdController,
  importAttendancesController,
  exportAttendancesController,
  downloadTemplateController,
  updateAttendanceStatusController,
  bulkDeleteAttendancesController,
  bulkUpdateAttendanceStatusController,
  getAttendanceStatisticsController,
  recalculateAttendanceController,
  syncAttendanceFromLogsController,
  getEmployeesController,
  getWorkShiftsController,
} from "../controllers/attendanceController";
import { authentication } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/authorizeMiddleware";
import multer from "multer";
const attendanceDataRouter = express.Router();
const storage = multer.memoryStorage(); // Lưu file trong memory
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Giới hạn 10MB
  },
  fileFilter: (req, file, cb) => {
    // Chỉ cho phép file Excel
    if (
      file.mimetype === "application/vnd.ms-excel" ||
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file Excel (.xls, .xlsx)"));
    }
  },
});

// Lấy danh sách chấm công (có phân trang + filter)
attendanceDataRouter.get(
  "/",
  authentication,
  // authorize("attendance_view_all"),
  getAttendancesController
);

// Lấy thống kê chấm công
attendanceDataRouter.get(
  "/statistics/overview",
  authentication,
  // authorize("attendance_view_all"),
  getAttendanceStatisticsController
);

// Lấy danh sách chấm công theo employeeId
attendanceDataRouter.get(
  "/employee/:employeeId",
  authentication,
  // authorize("attendance_view_by_employee"),
  getAttendancesByEmployeeIdController
);

// Lấy chi tiết chấm công theo ID
attendanceDataRouter.get(
  "/:id",
  authentication,
  // authorize("attendance_view"),
  getAttendanceByIdController
);

// Tải template import
attendanceDataRouter.get(
  "/download/template",
  authentication,
  // authorize("attendance_import"),
  downloadTemplateController
);

// Lấy danh sách nhân viên
attendanceDataRouter.get(
  "/employees/list",
  authentication,
  // authorize("attendance_view_all"),
  getEmployeesController
);

// Lấy danh sách ca làm việc
attendanceDataRouter.get(
  "/work-shifts/list",
  authentication,
  // authorize("attendance_view_all"),
  getWorkShiftsController
);

// 🔹 POST ROUTES
// ==============================

// Tạo mới chấm công
attendanceDataRouter.post(
  "/",
  authentication,
  // authorize("attendance_create"),
  createAttendanceController
);

// Import dữ liệu chấm công từ Excel
attendanceDataRouter.post(
  "/import",
  authentication,
  upload.single("file"),
  // authorize("attendance_import"),
  importAttendancesController
);

// Export dữ liệu chấm công ra Excel
attendanceDataRouter.post(
  "/export",
  authentication,
  // authorize("attendance_export"),
  exportAttendancesController
);

// Cập nhật trạng thái chấm công
attendanceDataRouter.post(
  "/:id/status",
  authentication,
  // authorize("attendance_update"),
  updateAttendanceStatusController
);

// Đồng bộ dữ liệu từ attendance logs
attendanceDataRouter.post(
  "/sync-from-logs",
  authentication,
  // authorize("attendance_sync"),
  syncAttendanceFromLogsController
);

// Tính toán lại dữ liệu chấm công
attendanceDataRouter.post(
  "/recalculate",
  authentication,
  // authorize("attendance_recalculate"),
  recalculateAttendanceController
);

// Xóa hàng loạt
attendanceDataRouter.post(
  "/bulk-delete",
  authentication,
  // authorize("attendance_delete"),
  bulkDeleteAttendancesController
);

// Cập nhật trạng thái hàng loạt
attendanceDataRouter.post(
  "/bulk-status",
  authentication,
  // authorize("attendance_update"),
  bulkUpdateAttendanceStatusController
);

// 🔹 PUT ROUTES
// ==============================

// Cập nhật chấm công theo ID
attendanceDataRouter.put(
  "/:id",
  authentication,
  // authorize("attendance_update"),
  updateAttendanceController
);

// 🔹 DELETE ROUTES
// ==============================

// Xóa chấm công theo ID
attendanceDataRouter.delete(
  "/:id",
  authentication,
  // authorize("attendance_delete"),
  deleteAttendanceController
);

export default attendanceDataRouter;
