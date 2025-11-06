import { Router } from "express";
import { authentication } from "../middlewares/authMiddleware";
import {
  getAllEmployeesController,
  createEmployeeController,
  updateEmployeeController,
  getEmployeeByIdController,
  deleteEmployeeController,
  getEmployeeDependentsController,
  getEmployeeJobInfoController,
  exportExcelController,
  importEmployeesFromExcelController,
  uploadFile,
  downloadEmployeeTemplateController,
} from "../controllers/employeeController";

const employeeRouters = Router();

// 🔹 Danh sách nhân viên
employeeRouters.get("/", authentication, getAllEmployeesController);
employeeRouters.get("/export-excel", exportExcelController);
employeeRouters.post(
  "/import-excel",
  uploadFile,
  importEmployeesFromExcelController
);
employeeRouters.get("/template", downloadEmployeeTemplateController);
// 🔹 Lấy thông tin công việc (chỉ phần cơ bản)
employeeRouters.get(
  "/:id/job-info",
  authentication,
  getEmployeeJobInfoController
);

// 🔹 Lấy chi tiết đầy đủ nhân viên
employeeRouters.get("/:id", authentication, getEmployeeByIdController);

// 🔹 Tạo nhân viên mới
employeeRouters.post("/", authentication, createEmployeeController);
// 🔹 Lấy danh sách người phụ thuộc
employeeRouters.get(
  "/:employeeId/dependents",
  authentication,
  getEmployeeDependentsController
);

// 🔹 Cập nhật nhân viên
employeeRouters.put("/:id", authentication, updateEmployeeController);

// 🔹 Xóa nhân viên
employeeRouters.delete("/:id", authentication, deleteEmployeeController);

export default employeeRouters;
