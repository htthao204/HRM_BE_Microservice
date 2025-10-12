import { Request, Response, NextFunction } from "express";
import {
  getAllLeaveTypes,
  getLeaveTypeById,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
} from "../services/leaveTypeService";
import { ResultResponse } from "../dto/response/resultResponse";

// Lấy tất cả (có phân trang + search)
export const getAllLeaveTypesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const search = (req.query.search as string) || "";

    const result = await getAllLeaveTypes(page, pageSize, search);

    res
      .status(200)
      .json(
        ResultResponse(true, 200, null, null, result.data, result.totalItems)
      );
  } catch (error) {
    next(error);
  }
};

// Lấy theo ID
export const getLeaveTypeByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);
    const leaveType = await getLeaveTypeById(id);

    if (!leaveType) {
      return res
        .status(404)
        .json(ResultResponse(false, 404, "Không tìm thấy loại nghỉ phép"));
    }

    res.status(200).json(ResultResponse(true, 200, null, null, leaveType));
  } catch (error) {
    next(error);
  }
};

// Tạo mới
export const createLeaveTypeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const newLeaveType = await createLeaveType(req.body);

    res.status(201).json(ResultResponse(true, 201, null, null, newLeaveType));
  } catch (error) {
    next(error);
  }
};

// Cập nhật
export const updateLeaveTypeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);
    const updatedLeaveType = await updateLeaveType(id, req.body);

    if (!updatedLeaveType) {
      return res
        .status(404)
        .json(ResultResponse(false, 404, "Không tìm thấy loại nghỉ phép"));
    }

    res
      .status(200)
      .json(ResultResponse(true, 200, null, null, updatedLeaveType));
  } catch (error) {
    next(error);
  }
};

// Xóa
export const deleteLeaveTypeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await deleteLeaveType(id);

    if (deleted === 0) {
      return res
        .status(404)
        .json(ResultResponse(false, 404, "Không tìm thấy loại nghỉ phép"));
    }

    res.status(200).json(ResultResponse(true, 200, null, null, null));
  } catch (error) {
    next(error);
  }
};
