// routers/attendanceAdjustmentRouter.ts
import express from "express";
import {
  getAttendanceAdjustmentsController,
  getAttendanceAdjustmentByIdController,
  createAttendanceAdjustmentController,
  updateAttendanceAdjustmentController,
  deleteAttendanceAdjustmentController,
  approveAttendanceAdjustmentController,
  rejectAttendanceAdjustmentController,
  bulkApproveAttendanceAdjustmentsController,
  bulkRejectAttendanceAdjustmentsController,
  bulkDeleteAttendanceAdjustmentsController,
  approveAttendanceAdjustmentWithTransactionController,
  bulkApproveAttendanceAdjustmentsWithTransactionController,
  getAdjustmentApprovalImpactController,
  getAdjustmentStatsController,
  rollbackAttendanceAdjustmentController,
  exportAttendanceAdjustmentsController,
  validateCreateAdjustment,
  validateBulkAction,
} from "../controllers/attendanceAdjustmentController";

const attendanceAdjustmentRouters = express.Router();

// 🔹 GET ROUTES
// ==============================

// Lấy danh sách adjustments (có phân trang + filter)
attendanceAdjustmentRouters.get("/", getAttendanceAdjustmentsController);

// Lấy chi tiết 1 adjustment theo ID
attendanceAdjustmentRouters.get("/:id", getAttendanceAdjustmentByIdController);

// Xem ảnh hưởng khi phê duyệt
attendanceAdjustmentRouters.get(
  "/:id/approval-impact",
  getAdjustmentApprovalImpactController
);

// Lấy thống kê adjustments
attendanceAdjustmentRouters.get("/stats/all", getAdjustmentStatsController);

// Export dữ liệu adjustments
attendanceAdjustmentRouters.get(
  "/export/data",
  exportAttendanceAdjustmentsController
);

// 🔹 POST ROUTES
// ==============================

// Tạo mới adjustment
attendanceAdjustmentRouters.post(
  "/",
  validateCreateAdjustment,
  createAttendanceAdjustmentController
);

// Phê duyệt adjustment (đơn giản)
attendanceAdjustmentRouters.post(
  "/:id/approve",
  approveAttendanceAdjustmentController
);

// Phê duyệt adjustment với transaction
attendanceAdjustmentRouters.post(
  "/:id/approve-with-transaction",
  approveAttendanceAdjustmentWithTransactionController
);

// Từ chối adjustment
attendanceAdjustmentRouters.post(
  "/:id/reject",
  rejectAttendanceAdjustmentController
);

// Rollback adjustment (khẩn cấp)
attendanceAdjustmentRouters.post(
  "/:id/rollback",
  rollbackAttendanceAdjustmentController
);

// Phê duyệt hàng loạt (đơn giản)
attendanceAdjustmentRouters.post(
  "/bulk/approve",
  validateBulkAction,
  bulkApproveAttendanceAdjustmentsController
);

// Phê duyệt hàng loạt với transaction
attendanceAdjustmentRouters.post(
  "/bulk/approve-with-transaction",
  validateBulkAction,
  bulkApproveAttendanceAdjustmentsWithTransactionController
);

// Từ chối hàng loạt
attendanceAdjustmentRouters.post(
  "/bulk/reject",
  validateBulkAction,
  bulkRejectAttendanceAdjustmentsController
);

// Xóa hàng loạt
attendanceAdjustmentRouters.post(
  "/bulk/delete",
  bulkDeleteAttendanceAdjustmentsController
);

// 🔹 PUT ROUTES
// ==============================

// Cập nhật adjustment theo ID
attendanceAdjustmentRouters.put("/:id", updateAttendanceAdjustmentController);

// 🔹 DELETE ROUTES
// ==============================

// Xóa adjustment theo ID
attendanceAdjustmentRouters.delete(
  "/:id",
  deleteAttendanceAdjustmentController
);

export default attendanceAdjustmentRouters;
