import { Router } from "express";
import authRoutes from "./authRoutes";
import { authentication } from "../middlewares/authMiddleware";
import employeeRouters from "./employeeRoutes";
import departmentRouters from "./departmentRoutes";
import leaveTypeRouter from "./leaveTypeRoutes";
import leaveRouter from "./leaveRoutes";
import attendanceRouter from "./attendanceRoutes";
import payrollRouter from "./payrollRoutes";
import salaryTypeRouter from "./salaryTypeRoutes";
import employeePositionRouter from "./employeePositionHistoryRouter";
import workShiftRouter from "./workShiftRoutes";
import overTimeRouter from "./overtimeRuleRoutes";
import positionRouter from "./positionRoute";
import accountRouters from "./accountRoutes";
import attendanceLogRouter from "./attendanceLogRoutes";
import holidayRouter from "./holidayRouter";
import employeeShiftAssignmentRouter from "./employeeShiftAssignmentRoutes";
import caculationRouter from "./calculationRuleRouter";
import workScheduleRuleRouters from "./workScheduleRuleRouters";
import lateEarlyRuleRouter from "./lateEarlyRuleRouter";
import attendanceSummaryRouter from "./attendanceSummaryRouter";
import attendanceApprovalRouters from "./attendanceApprovalRoutes";
import employeeContractRouter from "./employeeContractRouter";
import attendanceAdjustmentRouters from "./attendanceAdjustmentRoutes";
import overtimeRequestRouters from "./overtimeRequestRouters";
import salaryGradeRouter from "./salaryGradeRouter";
import employeeSalaryGradeRouter from "./employeeSalaryGradeRouter";
import payrollRuleRouter from "./payrollRule.routes";
import taxRouter from "./taxRoutes";
import countryRouter from "./countryRouter";
import roleRouter from "./roleRouter";
import notificationIndexRouter from "./notificationIndexRouter";
import notificationRouter from "./notificationRoutes";
import notificationTemplateRouter from "./notificationTemplateRoutes";
import notificationSettingRouter from "./notificationSettingRoutes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/accounts", authentication, accountRouters);
router.use("/employees", authentication, employeeRouters);
router.use("/roles", authentication, roleRouter);
router.use("/departments", authentication, departmentRouters);
router.use("/leave-types", authentication, leaveTypeRouter);
router.use("/leaves", authentication, leaveRouter);
router.use("/attendance", authentication, attendanceRouter);
router.use("/work-shifts", authentication, workShiftRouter);
router.use("/overtime-rules", authentication, overTimeRouter);
router.use("/payrolls", authentication, payrollRouter);
router.use("/positions", authentication, positionRouter);
router.use("/salary-types", authentication, salaryTypeRouter);

router.use(
  "/employee-position-histories",
  authentication,
  employeePositionRouter
);
router.use("/attendance-logs", authentication, attendanceLogRouter);
router.use("/holidays", authentication, holidayRouter);
router.use(
  "/employee-shift-assignments",
  authentication,
  employeeShiftAssignmentRouter
);
router.use("/calculation-rules", authentication, caculationRouter);
router.use("/late-early", authentication, lateEarlyRuleRouter);
router.use("/attendance-summaries", authentication, attendanceSummaryRouter);
router.use("/attendance-approvals", authentication, attendanceApprovalRouters);
router.use("/employee-contracts", authentication, employeeContractRouter);
router.use(
  "/attendance-adjustments",
  authentication,
  attendanceAdjustmentRouters
);
router.use("/overtime-requests", authentication, overtimeRequestRouters);
router.use("/salary-grades", authentication, salaryGradeRouter);
router.use(
  "/employee-salary-grades",
  authentication,
  employeeSalaryGradeRouter
);
router.use("/payroll-rules", authentication, payrollRuleRouter);
router.use("/tax", authentication, taxRouter);
router.use("/countries", authentication, countryRouter);

// Thêm notification routes
router.use("/notifications", authentication, notificationRouter);
router.use(
  "/notification-templates",
  authentication,
  notificationTemplateRouter
);
router.use("/notification-settings", authentication, notificationSettingRouter);

export default router;
