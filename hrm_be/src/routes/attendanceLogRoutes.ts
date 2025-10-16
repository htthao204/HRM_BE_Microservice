import express from "express";
import {
  getAllAttendanceLogsController,
  getAttendanceLogsByEmployeeController,
  getLatestLogByEmployeeController,
  createAttendanceLogController,
} from "../controllers/attendanceLogController";

const attendanceLogRouter = express.Router();

attendanceLogRouter.get("/", getAllAttendanceLogsController);
attendanceLogRouter.get(
  "/employee/:employeeId",
  getAttendanceLogsByEmployeeController
);
attendanceLogRouter.get(
  "/employee/:employeeId/latest",
  getLatestLogByEmployeeController
);
attendanceLogRouter.post("/", createAttendanceLogController);

export default attendanceLogRouter;
