import { Router } from "express";
import {
  getAllAttendanceLogsController,
  getAttendanceLogsByEmployeeController,
  getLatestLogByEmployeeController,
  createAttendanceLogController,
} from "../controllers/attendanceLogController";

const router = Router();

// Lấy tất cả log
router.get("/attendance", getAllAttendanceLogsController);

// Lấy log của 1 nhân viên
router.get("/attendance/:employeeId", getAttendanceLogsByEmployeeController);

// Lấy log mới nhất
router.get("/attendance/latest/:employeeId", getLatestLogByEmployeeController);

// Tạo log mới
router.post("/attendance", createAttendanceLogController);

export default router;
