// src/controllers/notificationController.ts
import { Request, Response, NextFunction } from "express";
import {
  createNotification,
  sendNotification,
  getNotificationById,
  getAllNotifications,
  getUserNotifications,
  getUnreadUserNotifications,
  markAsRead,
  markAllAsRead,
  updateNotification,
  deleteNotification,
  getUnreadCount,
  sendSystemNotification,
} from "../services/notificationService";
import { ResultResponse } from "../dto/response/resultResponse";

// Tạo thông báo mới
export const createNotificationController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const newNotification = await createNotification(req.body);
    res
      .status(201)
      .json(
        ResultResponse(
          true,
          201,
          null,
          "Tạo thông báo thành công",
          newNotification
        )
      );
  } catch (err: any) {
    next(err);
  }
};

// Gửi thông báo
export const sendNotificationController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, "ID không được để trống"));
    }

    const sentNotification = await sendNotification(id);
    res.json(
      ResultResponse(
        true,
        200,
        null,
        "Gửi thông báo thành công",
        sentNotification
      )
    );
  } catch (err: any) {
    next(err);
  }
};

// Lấy thông báo theo ID
export const getNotificationByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, "ID không được để trống"));
    }

    const notification = await getNotificationById(id);
    res.json(ResultResponse(true, 200, null, null, notification));
  } catch (err: any) {
    next(err);
  }
};

// Lấy tất cả thông báo
export const getAllNotificationsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const filter = req.query;
    const notifications = await getAllNotifications(filter);
    res.json(
      ResultResponse(true, 200, null, null, notifications, notifications.length)
    );
  } catch (err: any) {
    next(err);
  }
};

// Lấy thông báo của user
export const getUserNotificationsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const employeeId = Number(req.params.employeeId);
    if (!employeeId) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, "Employee ID không được để trống"));
    }

    const filter = req.query;
    const notifications = await getUserNotifications(employeeId, filter);
    res.json(
      ResultResponse(true, 200, null, null, notifications, notifications.length)
    );
  } catch (err: any) {
    next(err);
  }
};

// Lấy thông báo chưa đọc của user
export const getUnreadUserNotificationsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const employeeId = Number(req.params.employeeId);
    if (!employeeId) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, "Employee ID không được để trống"));
    }

    const notifications = await getUnreadUserNotifications(employeeId);
    res.json(
      ResultResponse(true, 200, null, null, notifications, notifications.length)
    );
  } catch (err: any) {
    next(err);
  }
};

// Đánh dấu thông báo là đã đọc
export const markAsReadController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const notificationId = Number(req.params.notificationId);
    const employeeId = Number(req.params.employeeId);

    if (!notificationId || !employeeId) {
      return res
        .status(400)
        .json(
          ResultResponse(
            false,
            400,
            "Notification ID và Employee ID không được để trống"
          )
        );
    }

    const result = await markAsRead(notificationId, employeeId);
    res.json(ResultResponse(true, 200, null, result.message, result));
  } catch (err: any) {
    next(err);
  }
};

// Đánh dấu tất cả thông báo là đã đọc
export const markAllAsReadController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const employeeId = Number(req.params.employeeId);
    if (!employeeId) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, "Employee ID không được để trống"));
    }

    const result = await markAllAsRead(employeeId);
    res.json(ResultResponse(true, 200, null, result.message, result));
  } catch (err: any) {
    next(err);
  }
};

// Cập nhật thông báo
export const updateNotificationController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, "ID không được để trống"));
    }

    const updatedNotification = await updateNotification(id, req.body);
    res.json(
      ResultResponse(
        true,
        200,
        null,
        "Cập nhật thông báo thành công",
        updatedNotification
      )
    );
  } catch (err: any) {
    next(err);
  }
};

// Xóa thông báo
export const deleteNotificationController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, "ID không được để trống"));
    }

    const result = await deleteNotification(id);
    res.json(ResultResponse(true, 200, null, result.message, null));
  } catch (err: any) {
    next(err);
  }
};

// Lấy số lượng thông báo chưa đọc
export const getUnreadCountController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const employeeId = Number(req.params.employeeId);
    if (!employeeId) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, "Employee ID không được để trống"));
    }

    const count = await getUnreadCount(employeeId);
    res.json(ResultResponse(true, 200, null, null, { unread_count: count }));
  } catch (err: any) {
    next(err);
  }
};

// Gửi thông báo hệ thống
export const sendSystemNotificationController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, message, recipient_type, recipient_id, priority } = req.body;

    if (!title || !message) {
      return res
        .status(400)
        .json(
          ResultResponse(false, 400, "Title và Message không được để trống")
        );
    }

    const notification = await sendSystemNotification(
      title,
      message,
      recipient_type,
      recipient_id,
      priority
    );

    res
      .status(201)
      .json(
        ResultResponse(
          true,
          201,
          null,
          "Gửi thông báo hệ thống thành công",
          notification
        )
      );
  } catch (err: any) {
    next(err);
  }
};
