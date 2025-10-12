import { authorize } from "./../middlewares/authorizeMiddleware";
import { Router } from "express";
import { authentication } from "../middlewares/authMiddleware";
import {
  createDepartmentController,
  deleteDepartmentController,
  getAllDepartmentController,
  getDepartmentByIdController,
  updateDepartmentController,
} from "../controllers/departmentController";

const departmentRouters = Router();

// Lấy tất cả phòng ban (phân trang)
departmentRouters.get(
  "/all/page",
  authentication,
  authorize("department_view_all"),
  getAllDepartmentController
);

// Tạo phòng ban
departmentRouters.post(
  "/",
  authentication,
  authorize("department_create"),
  createDepartmentController
);

// Cập nhật phòng ban
departmentRouters.put(
  "/:id",
  authentication,
  authorize("department_update"),
  updateDepartmentController
);

// Xoá phòng ban
departmentRouters.delete(
  "/:id",
  authentication,
  authorize("department_delete"),
  deleteDepartmentController
);

// Lấy thông tin chi tiết theo id
departmentRouters.get(
  "/:id",
  authentication,
  authorize("department_view"),
  getDepartmentByIdController
);

export default departmentRouters;
