import express from "express";
import {
  getPayrollsController,
  getPayrollByIdController,
  createPayrollController,
  updatePayrollController,
  deletePayrollController,
} from "../controllers/payrollController";
import { authentication } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/authorizeMiddleware";

const payrollRouter = express.Router();

// Lấy danh sách bảng lương
payrollRouter.get(
  "/",
  authentication,
  authorize("payroll_view_all"),
  getPayrollsController
);

// Lấy chi tiết bảng lương theo ID
payrollRouter.get(
  "/:id",
  authentication,
  authorize("payroll_view"),
  getPayrollByIdController
);

// Tạo mới bảng lương
payrollRouter.post(
  "/",
  authentication,
  authorize("payroll_create"),
  createPayrollController
);

// Cập nhật bảng lương
payrollRouter.put(
  "/:id",
  authentication,
  authorize("payroll_update"),
  updatePayrollController
);

// Xoá bảng lương
payrollRouter.delete(
  "/:id",
  authentication,
  authorize("payroll_delete"),
  deletePayrollController
);

export default payrollRouter;
