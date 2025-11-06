import express from "express";
import {
  getAttendanceLogsController,
  createAttendanceLogController,
  updateAttendanceLogController,
  deleteAttendanceLogController,
  exportAttendanceLogController,
} from "../controllers/attendanceLogController";

const router = express.Router();

// Lấy danh sách + filter
router.get("/filter", getAttendanceLogsController);

// Tạo mới
router.post("/", createAttendanceLogController);

// Cập nhật
router.put("/:id", updateAttendanceLogController);

// Xóa
router.delete("/:id", deleteAttendanceLogController);

// Xuất Excel
router.get("/export/excel", exportAttendanceLogController);

export default router;
