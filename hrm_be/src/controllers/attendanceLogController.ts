import { NextFunction, Request, Response } from "express";
import {
  getAllAttendanceLogs,
  getAttendanceLogsByEmployee,
  getLatestLogByEmployee,
  createAttendanceLog,
} from "../services/attendanceLogService";
import { ResultResponse } from "../dto/response/resultResponse";

// 🟩 Lấy tất cả log chấm công (có thể lọc theo ngày)
export const getAllAttendanceLogsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate } = req.query;

    const filter: any = {};
    if (startDate) filter.startDate = new Date(startDate as string);
    if (endDate) filter.endDate = new Date(endDate as string);

    const logs = await getAllAttendanceLogs(filter);
    res.json(ResultResponse(true, 200, null, null, logs));
  } catch (err: any) {
    next(err);
  }
};

// 🟦 Lấy log chấm công của 1 nhân viên
export const getAttendanceLogsByEmployeeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const employeeId = Number(req.params.employeeId);
    const logs = await getAttendanceLogsByEmployee(employeeId);
    res.json(ResultResponse(true, 200, null, null, logs));
  } catch (err: any) {
    next(err);
  }
};

// 🟨 Lấy log mới nhất của 1 nhân viên
export const getLatestLogByEmployeeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const employeeId = Number(req.params.employeeId);
    const log = await getLatestLogByEmployee(employeeId);
    res.json(ResultResponse(true, 200, null, null, log));
  } catch (err: any) {
    next(err);
  }
};

// 🟩 Tạo log chấm công mới
export const createAttendanceLogController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body; // { employee_id, log_time, action, source }
    const newLog = await createAttendanceLog(data);
    res.json(
      ResultResponse(true, 201, "Tạo log chấm công thành công", null, newLog)
    );
  } catch (err: any) {
    next(err);
  }
};
