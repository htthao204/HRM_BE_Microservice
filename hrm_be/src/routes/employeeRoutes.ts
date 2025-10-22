import { Router } from "express";
import { authentication } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/authorizeMiddleware";

import {
  getAllEmployeeInforController,
  createEmployeeController,
  updateEmployeeController,
  getEmployeeByIdController,
  getEmployeeByDepartmentIdController,
  deleteEmployeeController,
} from "../controllers/employeeController";

const employeeRouters = Router();

// Lấy danh sách nhân viên có phân trang
employeeRouters.get(
  "/all/page",
  authentication,
  // authorize("view_all_users"),
  getAllEmployeeInforController
);

// Tạo nhân viên mới
employeeRouters.post(
  "/",
  authentication,
  // authorize("employee_create"),
  createEmployeeController
);

// Cập nhật nhân viên
employeeRouters.put(
  "/:id",
  authentication,
  // authorize("employee_update"),
  updateEmployeeController
);

// Lấy nhân viên theo ID
employeeRouters.get(
  "/:id",
  authentication,
  // authorize("employee_view"),
  getEmployeeByIdController
);

// Lấy nhân viên theo phòng ban
employeeRouters.get(
  "/department/:departmentId",
  authentication,
  // authorize("employee_view"),
  getEmployeeByDepartmentIdController
);

// Xóa nhân viên (cập nhật isDelete = true)
employeeRouters.delete(
  "/:id",
  authentication,
  // authorize("employee_delete"),
  deleteEmployeeController
);

export default employeeRouters;
