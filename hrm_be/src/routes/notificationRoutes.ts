// src/routes/notificationRoutes.ts
import { Router } from "express";
import { authentication } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/authorizeMiddleware";
import {
  createNotificationController,
  sendNotificationController,
  getNotificationByIdController,
  getAllNotificationsController,
  getUserNotificationsController,
  getUnreadUserNotificationsController,
  markAsReadController,
  markAllAsReadController,
  updateNotificationController,
  deleteNotificationController,
  getUnreadCountController,
  sendSystemNotificationController,
} from "../controllers/notificationController";

const notificationRouter = Router();

// Lấy tất cả thông báo (cho admin/quản lý)
notificationRouter.get(
  "/all",
  authentication,
  authorize("notification_view_all"),
  getAllNotificationsController
);

// Lấy chi tiết 1 thông báo
notificationRouter.get(
  "/:id",
  authentication,
  authorize("notification_view"),
  getNotificationByIdController
);

// Tạo mới thông báo
notificationRouter.post(
  "/",
  authentication,
  authorize("notification_create"),
  createNotificationController
);

// Gửi thông báo
notificationRouter.post(
  "/:id/send",
  authentication,
  authorize("notification_send"),
  sendNotificationController
);

// Cập nhật thông báo
notificationRouter.put(
  "/:id",
  authentication,
  authorize("notification_update"),
  updateNotificationController
);

// Xoá thông báo
notificationRouter.delete(
  "/:id",
  authentication,
  authorize("notification_delete"),
  deleteNotificationController
);

// Gửi thông báo hệ thống
notificationRouter.post(
  "/system/send",
  authentication,
  authorize("notification_send_system"),
  sendSystemNotificationController
);

// ==================== USER NOTIFICATION ROUTES ====================

// Lấy thông báo của user
notificationRouter.get(
  "/user/:employeeId",
  authentication,
  getUserNotificationsController
);

// Lấy thông báo chưa đọc của user
notificationRouter.get(
  "/user/:employeeId/unread",
  authentication,
  getUnreadUserNotificationsController
);

// Lấy số lượng thông báo chưa đọc của user
notificationRouter.get(
  "/user/:employeeId/unread-count",
  authentication,
  getUnreadCountController
);

// Đánh dấu thông báo là đã đọc
notificationRouter.post(
  "/:notificationId/read/:employeeId",
  authentication,
  markAsReadController
);

// Đánh dấu tất cả thông báo là đã đọc
notificationRouter.post(
  "/user/:employeeId/read-all",
  authentication,
  markAllAsReadController
);

export default notificationRouter;
