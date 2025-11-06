import { Request, Response, NextFunction } from "express";
import {
  createAttendanceLog,
  updateAttendanceLog,
  deleteAttendanceLog,
  getFilteredAttendanceLogs,
  exportAttendanceLogsToExcel,
} from "../services/attendanceLogService";

/* =========================
 * 🟦 GET: Lọc + phân trang
 * ========================= */
export const getAttendanceLogsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const filter = {
      employeeName: req.query.employeeName as string,
      action: req.query.action as any,
      status: req.query.status as any,
      source: req.query.source as any,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      pageSize: req.query.pageSize
        ? parseInt(req.query.pageSize as string)
        : 10,
    };

    const result = await getFilteredAttendanceLogs(filter);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

/* =========================
 * 🟩 POST: Thêm mới
 * ========================= */
export const createAttendanceLogController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const log = await createAttendanceLog(req.body);
    res.status(201).json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
};

/* =========================
 * 🟨 PUT: Cập nhật
 * ========================= */
export const updateAttendanceLogController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await updateAttendanceLog(id, req.body);
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

/* =========================
 * 🟥 DELETE: Xóa bản ghi
 * ========================= */
export const deleteAttendanceLogController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await deleteAttendanceLog(id);
    if (!deleted)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy bản ghi" });
    res.status(200).json({ success: true, message: "Xóa thành công" });
  } catch (error) {
    next(error);
  }
};

/* =========================
 * 🟪 EXPORT: Xuất Excel
 * ========================= */
export const exportAttendanceLogController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const filter = {
      employeeName: req.query.employeeName as string,
      action: req.query.action as any,
      status: req.query.status as any,
      source: req.query.source as any,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    };

    const filePath = await exportAttendanceLogsToExcel(filter);
    res.download(filePath);
  } catch (error) {
    next(error);
  }
};
