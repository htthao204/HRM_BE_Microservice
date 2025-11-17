// src/services/notificationService.ts
import Notification from "../models/NotificationModel";
import NotificationReadStatus from "../models/NotificationReadStatusModel";
import { Op } from "sequelize";

export const createNotification = async (notificationData: any) => {
  try {
    const newNotification = await Notification.create({
      ...notificationData,
      status: "draft",
    });
    return newNotification.get({ plain: true });
  } catch (err: any) {
    console.error(err);
    throw new Error("Tạo thông báo thất bại");
  }
};

export const sendNotification = async (notificationId: number) => {
  try {
    const [affectedRows] = await Notification.update(
      {
        status: "sent",
        sent_at: new Date(),
      },
      {
        where: {
          id: notificationId,
          status: "draft",
        },
      }
    );

    if (affectedRows === 0) {
      throw new Error("Thông báo không tồn tại hoặc đã được gửi");
    }

    const updatedNotification = await Notification.findByPk(notificationId);
    return updatedNotification
      ? updatedNotification.get({ plain: true })
      : null;
  } catch (err: any) {
    console.error(err);
    throw new Error("Gửi thông báo thất bại");
  }
};

export const getNotificationById = async (id: number) => {
  try {
    const notification = await Notification.findByPk(id, {
      include: [
        {
          association: "sender",
          attributes: ["id", "employee_code", "full_name"],
        },
        {
          association: "creator",
          attributes: ["id", "employee_code", "full_name"],
        },
      ],
    });

    if (!notification) {
      throw new Error("Thông báo không tồn tại");
    }

    return notification.get({ plain: true });
  } catch (err: any) {
    console.error(err);
    throw new Error("Lấy thông báo thất bại");
  }
};

export const getAllNotifications = async (filter: any = {}) => {
  try {
    const where: any = {};

    if (filter.notification_type) {
      where.notification_type = filter.notification_type;
    }

    if (filter.priority) {
      where.priority = filter.priority;
    }

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.recipient_type) {
      where.recipient_type = filter.recipient_type;
    }

    if (filter.recipient_id) {
      where.recipient_id = filter.recipient_id;
    }

    if (filter.start_date || filter.end_date) {
      where.created_at = {};
      if (filter.start_date) {
        where.created_at[Op.gte] = filter.start_date;
      }
      if (filter.end_date) {
        where.created_at[Op.lte] = filter.end_date;
      }
    }

    const notifications = await Notification.findAll({
      where,
      include: [
        {
          association: "sender",
          attributes: ["id", "employee_code", "full_name"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return notifications.map((n) => n.get({ plain: true }));
  } catch (err: any) {
    console.error(err);
    throw new Error("Lấy danh sách thông báo thất bại");
  }
};

export const getUserNotifications = async (
  employeeId: number,
  filter: any = {}
) => {
  try {
    const notificationWhere: any = {
      status: "sent",
      [Op.or]: [
        { recipient_type: "all" },
        {
          recipient_type: "individual",
          recipient_id: employeeId,
        },
      ],
    };

    if (filter.notification_type) {
      notificationWhere.notification_type = filter.notification_type;
    }

    if (filter.priority) {
      notificationWhere.priority = filter.priority;
    }

    const notifications = await Notification.findAll({
      where: notificationWhere,
      include: [
        {
          association: "sender",
          attributes: ["id", "employee_code", "full_name"],
        },
        {
          association: "readStatuses",
          where: { employee_id: employeeId },
          required: false,
        },
      ],
      order: [["created_at", "DESC"]],
    });

    // Format response với trạng thái đọc
    const result = notifications.map((notification) => {
      const plainNotification = notification.get({ plain: true });
      const readStatus = plainNotification.readStatuses?.[0];

      return {
        ...plainNotification,
        is_read: readStatus?.is_read || false,
        read_at: readStatus?.read_at || null,
        read_status_id: readStatus?.id || null,
      };
    });

    // Filter theo trạng thái đọc nếu có
    if (filter.is_read !== undefined) {
      return result.filter((noti) => noti.is_read === filter.is_read);
    }

    return result;
  } catch (err: any) {
    console.error(err);
    throw new Error("Lấy thông báo người dùng thất bại");
  }
};

export const getUnreadUserNotifications = async (employeeId: number) => {
  try {
    return await getUserNotifications(employeeId, { is_read: false });
  } catch (err: any) {
    console.error(err);
    throw new Error("Lấy thông báo chưa đọc thất bại");
  }
};

export const markAsRead = async (
  notificationId: number,
  employeeId: number
) => {
  try {
    const [readStatus, created] = await NotificationReadStatus.findOrCreate({
      where: {
        notification_id: notificationId,
        employee_id: employeeId,
      },
      defaults: {
        is_read: true,
        read_at: new Date(),
      },
    });

    if (!created) {
      await NotificationReadStatus.update(
        {
          is_read: true,
          read_at: new Date(),
        },
        {
          where: {
            notification_id: notificationId,
            employee_id: employeeId,
          },
        }
      );
    }

    return {
      message: "Đã đánh dấu thông báo là đã đọc",
      notification_id: notificationId,
      employee_id: employeeId,
    };
  } catch (err: any) {
    console.error(err);
    throw new Error("Đánh dấu đã đọc thất bại");
  }
};

export const markAllAsRead = async (employeeId: number) => {
  try {
    const unreadNotifications = await getUnreadUserNotifications(employeeId);

    const notificationIds = unreadNotifications.map((noti) => noti.id);

    if (notificationIds.length === 0) {
      return { message: "Không có thông báo nào để đánh dấu đã đọc" };
    }

    for (const notificationId of notificationIds) {
      await markAsRead(notificationId, employeeId);
    }

    return {
      message: `Đã đánh dấu ${notificationIds.length} thông báo là đã đọc`,
      marked_count: notificationIds.length,
    };
  } catch (err: any) {
    console.error(err);
    throw new Error("Đánh dấu tất cả đã đọc thất bại");
  }
};

export const updateNotification = async (id: number, notificationData: any) => {
  try {
    const [affectedRows] = await Notification.update(notificationData, {
      where: {
        id,
        status: "draft",
      },
    });

    if (affectedRows === 0) {
      throw new Error("Thông báo không tồn tại hoặc không thể cập nhật");
    }

    const updatedNotification = await Notification.findByPk(id);
    return updatedNotification
      ? updatedNotification.get({ plain: true })
      : null;
  } catch (err: any) {
    console.error(err);
    throw new Error("Cập nhật thông báo thất bại");
  }
};

export const deleteNotification = async (id: number) => {
  try {
    const deletedCount = await Notification.destroy({
      where: {
        id,
        status: "draft",
      },
    });

    if (deletedCount === 0) {
      throw new Error("Thông báo không tồn tại hoặc không thể xóa");
    }

    return { message: "Thông báo đã được xóa thành công" };
  } catch (err: any) {
    console.error(err);
    throw new Error("Xóa thông báo thất bại");
  }
};

export const getUnreadCount = async (employeeId: number) => {
  try {
    const unreadNotifications = await getUnreadUserNotifications(employeeId);
    return unreadNotifications.length;
  } catch (err: any) {
    console.error(err);
    throw new Error("Lấy số lượng thông báo chưa đọc thất bại");
  }
};

export const sendSystemNotification = async (
  title: string,
  message: string,
  recipientType: string = "all",
  recipientId?: number,
  priority: string = "medium"
) => {
  try {
    const notification = await createNotification({
      title,
      message,
      notification_type: "system",
      recipient_type: recipientType,
      recipient_id: recipientId,
      priority,
      created_by: 1,
    });

    await sendNotification(notification.id);

    return notification;
  } catch (err: any) {
    console.error(err);
    throw new Error("Gửi thông báo hệ thống thất bại");
  }
};
