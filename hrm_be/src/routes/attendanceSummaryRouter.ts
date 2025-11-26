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
  getYearlySummaryForEmployeeController, // THÊM IMPORT NÀY
  testAttendanceSummaryController, // THÊM TEST ENDPOINT
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
  "/employee/:employeeId/year/:year", // THÊM ROUTE NÀY
  getYearlySummaryForEmployeeController
);
attendanceSummaryRouter.get(
  "/overview/:month",
  getAttendanceOverviewController
);
attendanceSummaryRouter.get(
  "/department-stats/:month",
  getDepartmentStatsController
);

// Test endpoint
attendanceSummaryRouter.get("/test", testAttendanceSummaryController);

export default attendanceSummaryRouter;
