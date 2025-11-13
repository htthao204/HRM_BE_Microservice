import express from "express";
import {
  getOvertimeRequestsController,
  getOvertimeRequestByIdController,
  createOvertimeRequestController,
  updateOvertimeRequestController,
  deleteOvertimeRequestController,
  approveOvertimeRequestController,
  rejectOvertimeRequestController,
  completeOvertimeRequestController,
  approveOvertimeRequestWithTransactionController,
  approveMultipleOvertimeRequestsController,
  approveAllOvertimeRequestsController,
} from "../controllers/overtimeRequestController";

const overtimeRequestRouters = express.Router();

// ==============================
// 📌 Overtime Request Routes
// ==============================

// 🔹 Lấy danh sách / Phân trang / Filter
overtimeRequestRouters.get("/", getOvertimeRequestsController);

// 🔹 Tạo mới
overtimeRequestRouters.post("/", createOvertimeRequestController);

// 🔹 Cập nhật theo ID
overtimeRequestRouters.put("/:id", updateOvertimeRequestController);

// 🔹 Xóa theo ID
overtimeRequestRouters.delete("/:id", deleteOvertimeRequestController);

// ==============================
// 📌 PHÊ DUYỆT - Các endpoint mới
// ==============================

// 🔹 Phê duyệt đơn giản (chỉ cập nhật status)
overtimeRequestRouters.post("/:id/approve", approveOvertimeRequestController);

// 🔹 Phê duyệt với transaction (cập nhật tất cả bảng liên quan)
overtimeRequestRouters.post(
  "/:id/approve-with-transaction",
  approveOvertimeRequestWithTransactionController
);

// 🔹 Phê duyệt nhiều requests (batch approval)
overtimeRequestRouters.post(
  "/bulk-approve",
  approveMultipleOvertimeRequestsController
);

// 🔹 Phê duyệt tất cả requests đang chờ
overtimeRequestRouters.post(
  "/approve-all",
  approveAllOvertimeRequestsController
);

// 🔹 Từ chối
overtimeRequestRouters.post("/:id/reject", rejectOvertimeRequestController);

// 🔹 Đánh dấu hoàn thành
overtimeRequestRouters.post("/:id/complete", completeOvertimeRequestController);
// 🔹 Lấy chi tiết theo ID
overtimeRequestRouters.get("/:id", getOvertimeRequestByIdController);

export default overtimeRequestRouters;
