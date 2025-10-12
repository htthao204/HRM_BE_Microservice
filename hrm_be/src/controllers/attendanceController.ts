import { NextFunction, Request, Response } from "express";
import {
  getAllAttendances,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendancesByEmployeeId,
} from "../services/attendanceService";
import { ResultResponse } from "../dto/response/resultResponse";

// Lấy danh sách chấm công có phân trang
export const getAttendancesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const result = await getAllAttendances(page, pageSize);
    res.json(
      ResultResponse(true, 200, null, null, result.data, result.totalItems)
    );
  } catch (err: any) {
    next(err);
  }
};

// Lấy chấm công theo ID
export const getAttendanceByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);
    const attendance = await getAttendanceById(id);
    res.json(ResultResponse(true, 200, null, null, attendance));
  } catch (err: any) {
    next(err);
  }
};

// Tạo mới chấm công
export const createAttendanceController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body;
    const newAttendance = await createAttendance(data);
    res.json(ResultResponse(true, 201, null, null, newAttendance));
  } catch (err: any) {
    next(err);
  }
};

// Cập nhật chấm công
export const updateAttendanceController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;
    console.log("Updated Attendance:", id);
    const updatedAttendance = await updateAttendance(id, data);

    res.json(ResultResponse(true, 200, null, null, updatedAttendance));
  } catch (err: any) {
    next(err);
  }
};

// Xóa chấm công
export const deleteAttendanceController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);
    await deleteAttendance(id);
    res.json(ResultResponse(true, 200, "Xóa chấm công thành công", null, null));
  } catch (err: any) {
    next(err);
  }
};

export const getAttendancesByEmployeeIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const employeeId = Number(req.params.employeeId); // lấy từ params
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const result = await getAttendancesByEmployeeId(employeeId, page, pageSize);

    res.status(200).json(
      ResultResponse(
        true,
        200,
        null,
        null,
        result.data, // dữ liệu rows
        result.totalItems // truyền totalItem vào response
      )
    );
  } catch (err: any) {
    next(err);
  }
};
