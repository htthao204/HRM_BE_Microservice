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
import salaryStructureTypeRouter from "./salaryStructureType";
import salaryStructureRouter from "./salaryStructureRoutes";
import employeePositionRouter from "./employeePositionHistoryRouter";
import workShiftRouter from "./workShiftRoutes";
import overTimeRouter from "./overtimeRuleRoutes";
import positionRouter from "./positionRoute";
import accountRouters from "./accountRoutes";
import attendanceLogRouter from "./attendanceLogRoutes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/accounts", authentication, accountRouters);
router.use("/employees", authentication, employeeRouters);
router.use("/departments", authentication, departmentRouters);
router.use("/leave-types", authentication, leaveTypeRouter);
router.use("/leaves", authentication, leaveRouter);
router.use("/attendance", authentication, attendanceRouter);
router.use("/work-shifts", authentication, workShiftRouter);
router.use("/overtime-rules", authentication, overTimeRouter);
router.use("/payrolls", authentication, payrollRouter);
router.use("/positions", authentication, positionRouter);
router.use("/salary-types", authentication, salaryTypeRouter);
router.use("/salary-structures", authentication, salaryStructureRouter);
router.use(
  "/salary-structure-types",
  authentication,
  salaryStructureTypeRouter
);
router.use(
  "/employee-position-histories",
  authentication,
  employeePositionRouter
);
router.use("/attendance=logs", authentication, attendanceLogRouter);
export default router;
