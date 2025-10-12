// controllers/leaveController.ts
import { Request, Response, NextFunction } from "express";
import {
  createLeave,
  getLeaveById,
  getAllLeaves,
  updateLeave,
  deleteLeave,
  getLeavesPaginated,
} from "../services/leaveService";
import { ResultResponse } from "../dto/response/resultResponse";

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
