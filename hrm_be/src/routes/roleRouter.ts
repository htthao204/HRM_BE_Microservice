// routers/roleRouter.ts
import { Router } from "express";
import multer from "multer";
import { authentication } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/authorizeMiddleware";
import {
  createRoleController,
  deleteRoleController,
  getAllRolesController,
  getRoleByIdController,
  updateRoleController,
  getAllRolesSimpleController,
  checkRoleExistsController,
} from "../controllers/roleController";

const roleRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

// ===============================
// 🔹 BASIC CRUD ROUTES
// ===============================

// Lấy tất cả roles có phân trang
roleRouter.get(
  "/all",
  authentication,
  //authorize("role_view_all"),
  getAllRolesController
);

// Lấy danh sách roles đơn giản (không phân trang - cho dropdown)
roleRouter.get(
  "/simple",
  authentication,
  //authorize("role_view_simple"),
  getAllRolesSimpleController
);

// Kiểm tra role tồn tại
roleRouter.get(
  "/check",
  authentication,
  //authorize("role_check"),
  checkRoleExistsController
);

// Lấy role theo ID
roleRouter.get(
  "/:id",
  authentication,
  //authorize("role_view"),
  getRoleByIdController
);

// Tạo role mới
roleRouter.post(
  "/",
  authentication,
  //authorize("role_create"),
  createRoleController
);

// Cập nhật role
roleRouter.put(
  "/:id",
  authentication,
  //authorize("role_update"),
  updateRoleController
);

// Xóa role
roleRouter.delete(
  "/:id",
  authentication,
  //authorize("role_delete"),
  deleteRoleController
);

export default roleRouter;
