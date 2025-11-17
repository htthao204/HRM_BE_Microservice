// src/routes/notificationSettingRoutes.ts
import { Router } from "express";
import { authentication } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/authorizeMiddleware";
import {
  getUserSettingsController,
  updateUserSettingsController,
  resetToDefaultController,
  canReceiveNotificationController,
  isQuietTimeController,
} from "../controllers/notificationSettingController";

const notificationSettingRouter = Router();

// Lấy cài đặt thông báo của user
notificationSettingRouter.get(
  "/user/:employeeId",
  authentication,
  getUserSettingsController
);

// Cập nhật cài đặt thông báo của user
notificationSettingRouter.put(
  "/user/:employeeId",
  authentication,
  updateUserSettingsController
);

// Reset cài đặt về mặc định
notificationSettingRouter.post(
  "/user/:employeeId/reset",
  authentication,
  resetToDefaultController
);

// Kiểm tra user có nhận loại thông báo nào không
notificationSettingRouter.get(
  "/user/:employeeId/can-receive/:notificationType",
  authentication,
  canReceiveNotificationController
);

// Kiểm tra thời gian không làm phiền
notificationSettingRouter.get(
  "/user/:employeeId/quiet-time",
  authentication,
  isQuietTimeController
);

export default notificationSettingRouter;
