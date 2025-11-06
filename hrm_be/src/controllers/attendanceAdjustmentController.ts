import { Request, Response, NextFunction } from "express";
import {
  getAllAttendanceAdjustments,
  getAttendanceAdjustmentById,
  getAttendanceAdjustmentsPage,
  createAttendanceAdjustment,
  updateAttendanceAdjustment,
  deleteAttendanceAdjustment,
  approveAdjustment,
  rejectAdjustment,
} from "../services/attendanceAdjustmentService";
import { ResultResponse } from "../dto/response/resultResponse";

// ==============================
// GET /attendance-adjustments
// GET all hoặc get page
// ==============================
export const getAttendanceAdjustmentsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit, employeeId, status, startDate, endDate } = req.query;

    if (page || limit || employeeId || status || startDate || endDate) {
      // Pagination + filter
      const result = await getAttendanceAdjustmentsPage(
        Number(page) || 1,
        Number(limit) || 10,
        {
          employeeId: employeeId ? Number(employeeId) : undefined,
          status: status as "pending" | "approved" | "rejected" | undefined,
          startDate: startDate as string | undefined,
          endDate: endDate as string | undefined,
        }
      );
      return res.json(
        ResultResponse(true, 200, null, null, result.data, result.total)
      );
    }

    // Lấy tất cả
    const adjustments = await getAllAttendanceAdjustments();
    return res.json(
      ResultResponse(true, 200, null, null, adjustments, adjustments.length)
    );
  } catch (err: any) {
    next(err);
  }
};

// ==============================
// GET /attendance-adjustments/:id
// ==============================
export const getAttendanceAdjustmentByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    const adjustment = await getAttendanceAdjustmentById(id);

    if (!adjustment) {
      return res
        .status(404)
        .json(ResultResponse(false, 404, "Không tìm thấy bản ghi"));
    }

    return res.json(ResultResponse(true, 200, null, null, adjustment));
  } catch (err: any) {
    next(err);
  }
};

// ==============================
// POST /attendance-adjustments
// ==============================
export const createAttendanceAdjustmentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body;
    const newAdjustment = await createAttendanceAdjustment(data);
    return res
      .status(201)
      .json(ResultResponse(true, 201, null, "Tạo thành công", newAdjustment));
  } catch (err: any) {
    next(err);
  }
};

// ==============================
// PUT /attendance-adjustments/:id
// ==============================
export const updateAttendanceAdjustmentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    const data = req.body;
    const updated = await updateAttendanceAdjustment(id, data);

    if (!updated) {
      return res
        .status(404)
        .json(ResultResponse(false, 404, "Không tìm thấy bản ghi để cập nhật"));
    }

    return res.json(
      ResultResponse(true, 200, null, "Cập nhật thành công", updated)
    );
  } catch (err: any) {
    next(err);
  }
};

// ==============================
// DELETE /attendance-adjustments/:id
// ==============================
export const deleteAttendanceAdjustmentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    const deletedCount = await deleteAttendanceAdjustment(id);

    if (deletedCount === 0) {
      return res
        .status(404)
        .json(ResultResponse(false, 404, "Không tìm thấy bản ghi để xóa"));
    }

    return res.json(ResultResponse(true, 200, null, "Xóa thành công"));
  } catch (err: any) {
    next(err);
  }
};

// ==============================
// POST /attendance-adjustments/:id/approve
// ==============================
export const approveAttendanceAdjustmentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    const approverId = Number(req.body.approverId);
    const updated = await approveAdjustment(id, approverId);

    if (!updated) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, "Không thể phê duyệt bản ghi này"));
    }

    return res.json(
      ResultResponse(true, 200, null, "Phê duyệt thành công", updated)
    );
  } catch (err: any) {
    next(err);
  }
};

// ==============================
// POST /attendance-adjustments/:id/reject
// ==============================
export const rejectAttendanceAdjustmentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    const approverId = Number(req.body.approverId);
    const updated = await rejectAdjustment(id, approverId);

    if (!updated) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, "Không thể từ chối bản ghi này"));
    }

    return res.json(
      ResultResponse(true, 200, null, "Từ chối thành công", updated)
    );
  } catch (err: any) {
    next(err);
  }
};
