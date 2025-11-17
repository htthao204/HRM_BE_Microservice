// src/routes/notificationTemplateRoutes.ts
import { Router } from "express";
import { authentication } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/authorizeMiddleware";
import {
  createTemplateController,
  getTemplateByIdController,
  getTemplateByCodeController,
  getAllTemplatesController,
  updateTemplateController,
  deleteTemplateController,
  restoreTemplateController,
  searchTemplatesController,
  renderTemplateController,
} from "../controllers/notificationTemplateController";

const notificationTemplateRouter = Router();

// Lấy tất cả template
notificationTemplateRouter.get(
  "/all",
  authentication,
  authorize("notification_template_view_all"),
  getAllTemplatesController
);

// Tìm kiếm template
notificationTemplateRouter.get(
  "/search",
  authentication,
  authorize("notification_template_view"),
  searchTemplatesController
);

// Lấy chi tiết template theo ID
notificationTemplateRouter.get(
  "/:id",
  authentication,
  authorize("notification_template_view"),
  getTemplateByIdController
);

// Lấy chi tiết template theo mã
notificationTemplateRouter.get(
  "/code/:code",
  authentication,
  authorize("notification_template_view"),
  getTemplateByCodeController
);

// Tạo mới template
notificationTemplateRouter.post(
  "/",
  authentication,
  authorize("notification_template_create"),
  createTemplateController
);

// Cập nhật template
notificationTemplateRouter.put(
  "/:id",
  authentication,
  authorize("notification_template_update"),
  updateTemplateController
);

// Xoá template (soft delete)
notificationTemplateRouter.delete(
  "/:id",
  authentication,
  authorize("notification_template_delete"),
  deleteTemplateController
);

// Khôi phục template
notificationTemplateRouter.post(
  "/:id/restore",
  authentication,
  authorize("notification_template_update"),
  restoreTemplateController
);

// Render template với dữ liệu
notificationTemplateRouter.post(
  "/:code/render",
  authentication,
  authorize("notification_template_view"),
  renderTemplateController
);

export default notificationTemplateRouter;
