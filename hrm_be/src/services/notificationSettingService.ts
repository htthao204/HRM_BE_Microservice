// src/services/notificationSettingService.ts
import NotificationSetting from "../models/NotificationSettingModel";

export const getUserSettings = async (employeeId: number) => {
  try {
    let settings = await NotificationSetting.findOne({
      where: { employee_id: employeeId },
      include: [
        {
          association: "employee",
          attributes: ["id", "employee_code", "full_name"],
        },
      ],
    });

    // Nếu chưa có settings, tạo mới với giá trị mặc định
    if (!settings) {
      settings = await NotificationSetting.create({
        employee_id: employeeId,
      });
    }

    return settings.get({ plain: true });
  } catch (err: any) {
    console.error(err);
    throw new Error("Lấy cài đặt thông báo thất bại");
  }
};

export const updateUserSettings = async (
  employeeId: number,
  settingData: any
) => {
  try {
    const [affectedRows] = await NotificationSetting.update(settingData, {
      where: { employee_id: employeeId },
    });

    if (affectedRows === 0) {
      // Nếu chưa có settings, tạo mới
      await NotificationSetting.create({
        employee_id: employeeId,
        ...settingData,
      });
    }

    const updatedSettings = await getUserSettings(employeeId);
    return updatedSettings;
  } catch (err: any) {
    console.error(err);
    throw new Error("Cập nhật cài đặt thông báo thất bại");
  }
};

export const resetToDefault = async (employeeId: number) => {
  try {
    const defaultSettings = {
      receive_system_notifications: true,
      receive_attendance_notifications: true,
      receive_payroll_notifications: true,
      receive_leave_notifications: true,
      receive_overtime_notifications: true,
      receive_contract_notifications: true,
      receive_announcements: true,
      receive_email: false,
      receive_sms: false,
      receive_push_mobile: true,
      receive_system_inbox: true,
      digest_frequency: "realtime",
    };

    return await updateUserSettings(employeeId, defaultSettings);
  } catch (err: any) {
    console.error(err);
    throw new Error("Reset cài đặt thất bại");
  }
};

export const canReceiveNotification = async (
  employeeId: number,
  notificationType: string
): Promise<boolean> => {
  try {
    const settings = await getUserSettings(employeeId);

    const typeMapping: Record<string, string> = {
      system: "receive_system_notifications",
      attendance: "receive_attendance_notifications",
      payroll: "receive_payroll_notifications",
      leave: "receive_leave_notifications",
      overtime: "receive_overtime_notifications",
      contract: "receive_contract_notifications",
      announcement: "receive_announcements",
    };

    const settingKey = typeMapping[notificationType];
    return settingKey
      ? Boolean(settings[settingKey as keyof typeof settings])
      : true;
  } catch (err: any) {
    console.error(err);
    return true;
  }
};

export const isQuietTime = async (employeeId: number): Promise<boolean> => {
  try {
    const settings = await getUserSettings(employeeId);

    if (!settings.quiet_hours_start || !settings.quiet_hours_end) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const startTime = timeToMinutes(settings.quiet_hours_start);
    const endTime = timeToMinutes(settings.quiet_hours_end);

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      return currentTime >= startTime || currentTime <= endTime;
    }
  } catch (err: any) {
    console.error(err);
    return false;
  }
};

// Helper function
const timeToMinutes = (timeString: string): number => {
  const [hours, minutes] = timeString.split(":").map(Number);
  return hours * 60 + minutes;
};
