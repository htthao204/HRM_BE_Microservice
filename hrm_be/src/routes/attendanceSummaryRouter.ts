// attendanceSummaryRoutes.ts
import express from "express";
import {
  getAllAttendanceSummaryController,
  createAttendanceSummaryController,
  updateAttendanceSummaryController,
  deleteAttendanceSummaryController,
  getAttendanceSummaryByIdController,
  getAttendanceSummaryByEmployeeAndMonthController,
  getAttendanceOverviewController,
  getDepartmentStatsController,
} from "../controllers/attendanceSummaryController";

const attendanceSummaryRouter = express.Router();

// CRUD routes
attendanceSummaryRouter.get("/filter", getAllAttendanceSummaryController);
attendanceSummaryRouter.post("/", createAttendanceSummaryController);
attendanceSummaryRouter.put("/:id", updateAttendanceSummaryController);
attendanceSummaryRouter.delete("/:id", deleteAttendanceSummaryController);
attendanceSummaryRouter.get("/:id", getAttendanceSummaryByIdController);

// Special routes
attendanceSummaryRouter.get(
  "/employee/:employeeId/month/:month",
  getAttendanceSummaryByEmployeeAndMonthController
);
attendanceSummaryRouter.get(
  "/overview/:month",
  getAttendanceOverviewController
);
attendanceSummaryRouter.get(
  "/department-stats/:month",
  getDepartmentStatsController
);

export default attendanceSummaryRouter;
