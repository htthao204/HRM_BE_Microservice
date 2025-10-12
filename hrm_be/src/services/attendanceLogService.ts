import { Op } from "sequelize";
import AttendanceLog from "../models/attendanceLogModel";
import { EmployeeInformation } from "../models/employeeModel";

// Tạo một attendance log mới
export const createAttendanceLog = async (data: {
  employee_id: number;
  log_time: Date;
  action: "CHECKIN" | "CHECKOUT";
  source?: "DEVICE" | "FACE_RECOGNITION" | "MANUAL";
}) => {
  try {
    const log = await AttendanceLog.create(data);
    return log;
  } catch (error) {
    console.error("Error creating attendance log:", error);
    throw error;
  }
};

// Lấy tất cả attendance logs (có thể filter theo ngày)
export const getAllAttendanceLogs = async (filter?: {
  startDate?: Date;
  endDate?: Date;
}) => {
  try {
    const whereClause: any = {};
    if (filter?.startDate && filter?.endDate) {
      whereClause.log_time = {
        [Op.between]: [filter.startDate, filter.endDate],
      };
    } else if (filter?.startDate) {
      whereClause.log_time = {
        [Op.gte]: filter.startDate,
      };
    } else if (filter?.endDate) {
      whereClause.log_time = {
        [Op.lte]: filter.endDate,
      };
    }

    const logs = await AttendanceLog.findAll({
      where: whereClause,
      include: [
        {
          model: EmployeeInformation,
          as: "employee",
        },
      ],
      order: [["log_time", "DESC"]],
    });

    return logs;
  } catch (error) {
    console.error("Error fetching attendance logs:", error);
    throw error;
  }
};

// Lấy attendance log của một nhân viên cụ thể
export const getAttendanceLogsByEmployee = async (employee_id: number) => {
  try {
    const logs = await AttendanceLog.findAll({
      where: { employee_id },
      include: [
        {
          model: EmployeeInformation,
          as: "employee",
        },
      ],
      order: [["log_time", "DESC"]],
    });

    return logs;
  } catch (error) {
    console.error(`Error fetching logs for employee ${employee_id}:`, error);
    throw error;
  }
};

// Lấy log mới nhất của nhân viên
export const getLatestLogByEmployee = async (employee_id: number) => {
  try {
    const log = await AttendanceLog.findOne({
      where: { employee_id },
      order: [["log_time", "DESC"]],
    });
    return log;
  } catch (error) {
    console.error(
      `Error fetching latest log for employee ${employee_id}:`,
      error
    );
    throw error;
  }
};
