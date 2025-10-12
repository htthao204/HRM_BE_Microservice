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

attendanceRouter.get(
  "/",
  authentication,
  authorize("attendance_view_all"),
  getAttendancesController
);

attendanceRouter.get(
  "/employee/:employeeId",
  authentication,
  authorize("attendance_view_by_employee"),
  getAttendancesByEmployeeIdController
);

attendanceRouter.get(
  "/:id",
  authentication,
  authorize("attendance_view"),
  getAttendanceByIdController
);

attendanceRouter.post(
  "/",
  authentication,
  authorize("attendance_create"),
  createAttendanceController
);

attendanceRouter.put(
  "/:id",
  authentication,
  authorize("attendance_update"),
  updateAttendanceController
);

attendanceRouter.delete(
  "/:id",
  authentication,
  authorize("attendance_delete"),
  deleteAttendanceController
);

export default attendanceRouter;
