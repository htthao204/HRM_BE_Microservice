// src/controllers/notificationSettingController.ts
import { Request, Response, NextFunction } from "express";
import {
  getUserSettings,
  updateUserSettings,
  resetToDefault,
  canReceiveNotification,
  isQuietTime,
} from "../services/notificationSettingService";
import { ResultResponse } from "../dto/response/resultResponse";

// Lấy cài đặt thông báo của user
export const getUserSettingsController = async (
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

    const settings = await getUserSettings(employeeId);
    res.json(ResultResponse(true, 200, null, null, settings));
  } catch (err: any) {
    next(err);
  }
};

// Cập nhật cài đặt thông báo của user
export const updateUserSettingsController = async (
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

    const updatedSettings = await updateUserSettings(employeeId, req.body);
    res.json(
      ResultResponse(
        true,
        200,
        null,
        "Cập nhật cài đặt thành công",
        updatedSettings
      )
    );
  } catch (err: any) {
    next(err);
  }
};

// Reset cài đặt về mặc định
export const resetToDefaultController = async (
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

    const settings = await resetToDefault(employeeId);
    res.json(
      ResultResponse(
        true,
        200,
        null,
        "Reset cài đặt về mặc định thành công",
        settings
      )
    );
  } catch (err: any) {
    next(err);
  }
};

// Kiểm tra user có nhận loại thông báo nào không
export const canReceiveNotificationController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const employeeId = Number(req.params.employeeId);
    const notificationType = req.params.notificationType;

    if (!employeeId || !notificationType) {
      return res
        .status(400)
        .json(
          ResultResponse(
            false,
            400,
            "Employee ID và Notification Type không được để trống"
          )
        );
    }

    const canReceive = await canReceiveNotification(
      employeeId,
      notificationType
    );
    res.json(
      ResultResponse(true, 200, null, null, { can_receive: canReceive })
    );
  } catch (err: any) {
    next(err);
  }
};

// Kiểm tra thời gian không làm phiền
export const isQuietTimeController = async (
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

    const isQuiet = await isQuietTime(employeeId);
    res.json(ResultResponse(true, 200, null, null, { is_quiet_time: isQuiet }));
  } catch (err: any) {
    next(err);
  }
};
