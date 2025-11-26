import { Op } from "sequelize";
import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";
import AttendanceLog from "../models/attendanceLogModel";
import { EmployeeInformation } from "../models/employeeModel";

export interface AttendanceLogFilter {
  employeeName?: string;
  action?: "CHECKIN" | "CHECKOUT";
  status?: "SUCCESS" | "FAILED" | "LATE" | "EARLY";
  source?: "DEVICE" | "FACE_RECOGNITION" | "MANUAL" | "MOBILE";
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

/* =========================
 * 🟩 CREATE: Thêm bản ghi chấm công
 * ========================= */
export const createAttendanceLog = async (payload: any) => {
  const log = await AttendanceLog.create(payload);
  return log;
};

/* =========================
 * 🟨 UPDATE: Cập nhật bản ghi
 * ========================= */
export const updateAttendanceLog = async (id: number, payload: any) => {
  const log = await AttendanceLog.findByPk(id);
  if (!log) throw new Error("Attendance log not found");

  await log.update(payload);
  return log;
};

/* =========================
 * 🟥 DELETE: Xóa bản ghi
 * ========================= */
export const deleteAttendanceLog = async (id: number) => {
  const deletedCount = await AttendanceLog.destroy({ where: { id } });
  return deletedCount > 0;
};

/* =========================
 * 🟦 FILTER + PAGINATION
 * ========================= */
export const getFilteredAttendanceLogs = async (
  filter: AttendanceLogFilter
) => {
  const {
    employeeName,
    action,
    status,
    source,
    startDate,
    endDate,
    page = 1,
    pageSize = 10,
  } = filter;

  const where: any = {};

  if (action) where.action = action;
  if (status) where.status = status;
  if (source) where.source = source;
  if (startDate && endDate) {
    where.logTime = {
      [Op.between]: [new Date(startDate), new Date(endDate)],
    };
  }

  // JOIN với EmployeeInformation
  const include = [
    {
      model: EmployeeInformation,
      as: "logEmployee", //  đúng alias
      attributes: ["id", "fullName", "department_id"],
      where: employeeName
        ? {
            fullName: {
              [Op.like]: `%${employeeName}%`,
            },
          }
        : undefined,
      required: false,
    },
  ];

  const offset = (page - 1) * pageSize;

  const { rows, count } = await AttendanceLog.findAndCountAll({
    where,
    include,
    order: [["logTime", "DESC"]],
    offset,
    limit: pageSize,
  });

  return {
    data: rows,
    totalItems: count,
    totalPages: Math.ceil(count / pageSize),
    currentPage: page,
  };
};

/* =========================
 * 🟪 EXPORT EXCEL
 * ========================= */
export const exportAttendanceLogsToExcel = async (
  filter: AttendanceLogFilter
) => {
  const { data } = await getFilteredAttendanceLogs(filter);

  const formattedData = data.map((log: any) => ({
    ID: log.id,
    "Nhân viên": log.employee?.fullName || "N/A",
    "Thời gian": log.logTime,
    "Hành động": log.action,
    "Trạng thái": log.status,
    Nguồn: log.source,
    "Địa điểm": log.location || "",
    "Ghi chú": log.notes || "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Logs");

  const filePath = path.join(
    __dirname,
    `../../exports/attendance_logs_${Date.now()}.xlsx`
  );

  if (!fs.existsSync(path.dirname(filePath))) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }

  XLSX.writeFile(workbook, filePath);

  return filePath;
};
