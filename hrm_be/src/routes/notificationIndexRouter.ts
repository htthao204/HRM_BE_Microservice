// src/routes/notificationIndexRoutes.ts
import { Router } from "express";
import notificationRouter from "./notificationRoutes";
import notificationTemplateRouter from "./notificationTemplateRoutes";
import notificationSettingRouter from "./notificationSettingRoutes";

const notificationIndexRouter = Router();

// Mount các router con
notificationIndexRouter.use("/notifications", notificationRouter);
notificationIndexRouter.use(
  "/notification-templates",
  notificationTemplateRouter
);
notificationIndexRouter.use(
  "/notification-settings",
  notificationSettingRouter
);

export default notificationIndexRouter;
