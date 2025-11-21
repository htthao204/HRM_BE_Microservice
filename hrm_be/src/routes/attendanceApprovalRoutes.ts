import { Router } from "express";
import { authentication } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/authorizeMiddleware";
import {
  createAttendanceApprovalController,
  createAttendanceAdjustmentController, // 🆕 THÊM
  deleteAttendanceApprovalController,
  getAllAttendanceApprovalController,
  getAttendanceApprovalByIdController,
  getAttendanceApprovalStatsController,
  updateAttendanceApprovalStatusController,
} from "../controllers/attendanceApprovalController";

const attendanceApprovalRouters = Router();

// 🟨 Lấy danh sách yêu cầu phê duyệt (lọc + phân trang)
attendanceApprovalRouters.get(
  "/",
  authentication,
  // authorize(["attendance_read", "attendance_approve"]), // 🆕 CẬP NHẬT PERMISSIONS
  getAllAttendanceApprovalController
);

// 🟩 Tạo yêu cầu điều chỉnh công + phê duyệt (all-in-one)
attendanceApprovalRouters.post(
  "/adjustments",
  authentication,
  // authorize(["attendance_create"]), // 🆕 PERMISSION MỚI
  createAttendanceAdjustmentController
);

// 🟦 Tạo yêu cầu phê duyệt mới (cho các loại khác)
attendanceApprovalRouters.post(
  "/",
  authentication,
  // authorize(["attendance_create", "attendance_update"]), // 🆕 CẬP NHẬT PERMISSIONS
  createAttendanceApprovalController
);

// 🟧 Cập nhật trạng thái phê duyệt (approved / rejected)
attendanceApprovalRouters.put(
  "/:id/status",
  authentication,
  // authorize(["attendance_approve"]), // 🆕 PERMISSION CHUYÊN BIỆT
  updateAttendanceApprovalStatusController
);

// 🟪 Lấy chi tiết một approval theo ID
attendanceApprovalRouters.get(
  "/:id",
  authentication,
  //authorize(["attendance_read", "attendance_approve"]), // 🆕 CẬP NHẬT PERMISSIONS
  getAttendanceApprovalByIdController
);

// 🟥 Xóa yêu cầu phê duyệt (chỉ khi pending)
attendanceApprovalRouters.delete(
  "/:id",
  authentication,
  //authorize(["attendance_delete"]), // 🆕 PERMISSION CHUYÊN BIỆT
  deleteAttendanceApprovalController
);

// 🟦 Thống kê trạng thái (pending, approved, rejected)
attendanceApprovalRouters.get(
  "/stats/status",
  authentication,
  // authorize(["attendance_read", "attendance_approve"]), // 🆕 CẬP NHẬT PERMISSIONS
  getAttendanceApprovalStatsController
);

// 🆕 THÊM ROUTES CHO ADJUSTMENT MANAGEMENT
// ====================
// 🟩 ADJUSTMENT-SPECIFIC ROUTES
// ====================

// Lấy danh sách điều chỉnh công của nhân viên
attendanceApprovalRouters.get(
  "/adjustments/my-requests",
  authentication,
  // authorize(["attendance_read"]),
  async (req, res, next) => {
    // Controller cho điều chỉnh của user hiện tại
    // Cần implement trong controller
  }
);

// Lấy danh sách điều chỉnh công chờ duyệt (cho manager)
attendanceApprovalRouters.get(
  "/adjustments/pending",
  authentication,
  //authorize(["attendance_approve"]),
  async (req, res, next) => {
    // Controller cho điều chỉnh chờ duyệt
    // Cần implement trong controller
  }
);

export default attendanceApprovalRouters;
