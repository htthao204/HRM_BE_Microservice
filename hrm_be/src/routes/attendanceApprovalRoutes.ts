import { Router } from "express";
import { authentication } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/authorizeMiddleware";
import {
  createAttendanceApprovalController,
  deleteAttendanceApprovalController,
  getAllAttendanceApprovalController,
  getAttendanceApprovalByIdController,
  getAttendanceApprovalStatsController,
  updateAttendanceApprovalStatusController,
} from "../controllers/attendanceApprovalController";

const attendanceApprovalRouters = Router();

// 🟩 Lấy danh sách yêu cầu phê duyệt (lọc + phân trang)
attendanceApprovalRouters.get(
  "/all/page",
  authentication,
  //authorize("attendance_approval_view_all"),
  getAllAttendanceApprovalController
);

// 🟦 Tạo yêu cầu phê duyệt mới
attendanceApprovalRouters.post(
  "/",
  authentication,
  //authorize("attendance_approval_create"),
  createAttendanceApprovalController
);

// 🟨 Cập nhật trạng thái phê duyệt (approved / rejected)
attendanceApprovalRouters.put(
  "/:id/status",
  authentication,
  //authorize("attendance_approval_update_status"),
  updateAttendanceApprovalStatusController
);

// 🟧 Lấy chi tiết một approval theo ID
attendanceApprovalRouters.get(
  "/:id",
  authentication,
  //authorize("attendance_approval_view"),
  getAttendanceApprovalByIdController
);

// 🟥 Xóa yêu cầu phê duyệt (chỉ khi pending)
attendanceApprovalRouters.delete(
  "/:id",
  authentication,
  //authorize("attendance_approval_delete"),
  deleteAttendanceApprovalController
);

// 🟪 Thống kê trạng thái (pending, approved, rejected)
attendanceApprovalRouters.get(
  "/stats",
  authentication,
  //authorize("attendance_approval_stats"),
  getAttendanceApprovalStatsController
);

export default attendanceApprovalRouters;
