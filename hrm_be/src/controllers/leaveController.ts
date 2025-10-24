// controllers/leaveController.ts
import { Request, Response, NextFunction } from "express";
import {
  createLeave,
  getLeaveById,
  getAllLeaves,
  updateLeave,
  deleteLeave,
  getLeavesPaginated,
  getLeavesByLeaveType,
  getLeavesByEmployeeId,
  getLeavesByDateRange,
  getLeavesByFilter,
} from "../services/leaveService";
import { ResultResponse } from "../dto/response/resultResponse";
import { LeaveSearchDTO } from "../dto/search/LeaveSearchDTO";

// Tạo mới đơn xin nghỉ
export const createLeaveController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const newLeave = await createLeave(req.body);
    res.status(201).json(ResultResponse(true, 201, null, null, newLeave));
  } catch (err: any) {
    next(err);
  }
};

// Lấy đơn xin nghỉ theo ID
export const getLeaveByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const leave = await getLeaveById(Number(req.params.id));
    if (!leave) {
      return res
        .status(404)
        .json(ResultResponse(false, 404, "Không tìm thấy đơn xin nghỉ"));
    }
    res.status(200).json(ResultResponse(true, 200, null, null, leave));
  } catch (err: any) {
    next(err);
  }
};

// Lấy tất cả đơn xin nghỉ
export const getAllLeavesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const leaves = await getAllLeaves();
    res
      .status(200)
      .json(ResultResponse(true, 200, null, null, leaves, leaves.length));
  } catch (err: any) {
    next(err);
  }
};
// Lấy tất cả đơn xin nghỉ (có phân trang + search)
export const getLeavesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const search = (req.query.search as string) || "";

    const result = await getLeavesPaginated(page, pageSize, search);

    res
      .status(200)
      .json(
        ResultResponse(true, 200, null, null, result.data, result.totalItems)
      );
  } catch (err: any) {
    next(err);
  }
};

// Cập nhật đơn xin nghỉ
export const updateLeaveController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const updatedLeave = await updateLeave(Number(req.params.id), req.body);
    if (!updatedLeave) {
      return res
        .status(404)
        .json(ResultResponse(false, 404, "Không tìm thấy đơn xin nghỉ"));
    }
    res.status(200).json(ResultResponse(true, 200, null, null, updatedLeave));
  } catch (err: any) {
    next(err);
  }
};

// Xóa đơn xin nghỉ
export const deleteLeaveController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const deleted = await deleteLeave(Number(req.params.id));
    if (!deleted) {
      return res
        .status(404)
        .json(ResultResponse(false, 404, "Không tìm thấy đơn xin nghỉ"));
    }
    res.status(200).json(ResultResponse(true, 200, null, null, null));
  } catch (err: any) {
    next(err);
  }
};
// Lấy đơn nghỉ theo employeeId
export const getLeavesByEmployeeIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const employeeId = Number(req.params.employeeId);
    const leaves = await getLeavesByEmployeeId(employeeId);
    res.status(200).json(ResultResponse(true, 200, null, null, leaves));
  } catch (err: any) {
    next(err);
  }
};

// Lấy đơn nghỉ theo leaveTypeId
export const getLeavesByLeaveTypeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const leaveTypeId = Number(req.params.leaveTypeId);
    const leaves = await getLeavesByLeaveType(leaveTypeId);
    res.status(200).json(ResultResponse(true, 200, null, null, leaves));
  } catch (err: any) {
    next(err);
  }
};

// Lấy đơn nghỉ theo khoảng thời gian
export const getLeavesByDateRangeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const startDate = new Date(req.query.startDate as string);
    const endDate = new Date(req.query.endDate as string);
    const leaves = await getLeavesByDateRange(startDate, endDate);
    res.status(200).json(ResultResponse(true, 200, null, null, leaves));
  } catch (err: any) {
    next(err);
  }
};

// Lấy đơn nghỉ theo nhiều filter (employeeId, leaveTypeId, startDate, endDate)
export const getLeavesByFilterController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const filter: LeaveSearchDTO = {
      employeeId: req.query.employeeId
        ? Number(req.query.employeeId)
        : undefined,
      employeeName: req.query.employeeName
        ? String(req.query.employeeName)
        : undefined,
      leaveTypeId: req.query.leaveTypeId
        ? Number(req.query.leaveTypeId)
        : undefined,
      leaveTypeName: req.query.leaveTypeName
        ? String(req.query.leaveTypeName)
        : undefined,
      reason: req.query.reason ? String(req.query.reason) : undefined,
      status: req.query.status
        ? (String(req.query.status) as "Pending" | "Approved" | "Rejected")
        : undefined,
      startDateFrom: req.query.startDateFrom
        ? String(req.query.startDateFrom)
        : undefined,
      startDateTo: req.query.startDateTo
        ? String(req.query.startDateTo)
        : undefined,
      endDateFrom: req.query.endDateFrom
        ? String(req.query.endDateFrom)
        : undefined,
      endDateTo: req.query.endDateTo ? String(req.query.endDateTo) : undefined,
    };

    const leaves = await getLeavesByFilter(page, pageSize, filter);

    res.status(200).json(ResultResponse(true, 200, null, null, leaves));
  } catch (err: any) {
    next(err);
  }
};
