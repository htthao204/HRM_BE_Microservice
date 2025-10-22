import { Op } from "sequelize";
import AttendanceLog from "../models/attendanceLogModel";
import { EmployeeInformation } from "../models/employeeModel";
import {
  AttendanceLogRequest,
  createAttendanceLogRequest,
} from "../dto/request/attendanceLogRequest";

// Tạo một attendance log mới
export const createAttendanceLog = async (data: AttendanceLogRequest) => {
  try {
    // dùng factory để đảm bảo đúng định dạng
    const logRequest = createAttendanceLogRequest(data);
    const log = await AttendanceLog.create(logRequest);
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
// Cập nhật attendance log
export const updateAttendanceLog = async (
  id: number,
  data: AttendanceLogRequest
) => {
  try {
    const logRequest = createAttendanceLogRequest(data);
    const [updated] = await AttendanceLog.update(logRequest, {
      where: { id },
    });

    if (updated === 0) {
      throw new Error(`Attendance log with id ${id} not found`);
    }

    const updatedLog = await AttendanceLog.findByPk(id);
    return updatedLog;
  } catch (error) {
    console.error(`Error updating attendance log with id ${id}:`, error);
    throw error;
  }
};
export const getAttendanceLogsByEmployeePaginated = async (
  employee_id: number,
  page: number = 1,
  pageSize: number = 10,
  startDate?: Date,
  endDate?: Date
) => {
  try {
    const offset = (page - 1) * pageSize;
    const whereClause: any = { employee_id };

    if (startDate && endDate) {
      whereClause.log_time = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      whereClause.log_time = { [Op.gte]: startDate };
    } else if (endDate) {
      whereClause.log_time = { [Op.lte]: endDate };
    }

    const { count, rows } = await AttendanceLog.findAndCountAll({
      where: whereClause,
      include: [{ model: EmployeeInformation, as: "employee" }],
      limit: pageSize,
      offset,
      order: [["log_time", "DESC"]],
    });

    return {
      totalItems: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: page,
      data: rows,
    };
  } catch (error) {
    console.error(
      `Error fetching paginated logs for employee ${employee_id}:`,
      error
    );
    throw error;
  }
};
