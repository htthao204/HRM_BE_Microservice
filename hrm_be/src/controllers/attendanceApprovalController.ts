import { Request, Response, NextFunction } from "express";
import { ResultResponse } from "../dto/response/resultResponse";
import AttendanceApprovalService from "../services/attendanceApprovalService";

// ====================
// 🟨 Lấy tất cả approvals (có phân trang + filter)
// ====================
export const getAllAttendanceApprovalController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "10", 10);

    const filter = {
      employeeId: req.query.employeeId
        ? parseInt(req.query.employeeId as string, 10)
        : undefined,
      approverId: req.query.approverId
        ? parseInt(req.query.approverId as string, 10)
        : undefined,
      status: req.query.status as
        | "pending"
        | "approved"
        | "rejected"
        | undefined,
      type: req.query.type as "regular" | "overtime" | "adjustment" | undefined,
      dateFrom: req.query.dateFrom as string | undefined,
      dateTo: req.query.dateTo as string | undefined,
    };

    const { rows, count } = await AttendanceApprovalService.getAll(
      filter,
      page,
      limit
    );

    res.json(
      ResultResponse(true, 200, null, null, {
        data: rows,
        pagination: {
          totalItems: count,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
        },
      })
    );
  } catch (err: any) {
    next(err);
  }
};

// ====================
// 🟩 Lấy chi tiết approval
// ====================
export const getAttendanceApprovalByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json(ResultResponse(false, 400, null, "ID không hợp lệ"));
      return;
    }

    const approval = await AttendanceApprovalService.getById(id);
    if (!approval) {
      res
        .status(404)
        .json(
          ResultResponse(false, 404, null, "Yêu cầu phê duyệt không tồn tại")
        );
      return;
    }

    res.json(ResultResponse(true, 200, null, null, approval));
  } catch (err: any) {
    next(err);
  }
};

// ====================
// 🟧 Tạo yêu cầu phê duyệt
// ====================
export const createAttendanceApprovalController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      attendanceId,
      approverId,
      approvalType,
      oldData,
      newData,
      comments,
    } = req.body;

    if (!attendanceId || !approverId) {
      res
        .status(400)
        .json(
          ResultResponse(
            false,
            400,
            null,
            "attendanceId và approverId là bắt buộc"
          )
        );
      return;
    }

    const newApproval = await AttendanceApprovalService.create({
      attendanceId,
      approverId,
      approvalType,
      oldData,
      newData,
      comments,
    });

    res
      .status(201)
      .json(
        ResultResponse(
          true,
          201,
          null,
          "Tạo yêu cầu phê duyệt thành công",
          newApproval
        )
      );
  } catch (err: any) {
    next(err);
  }
};

// ====================
// 🟦 Cập nhật trạng thái approval (phê duyệt / từ chối)
// ====================
export const updateAttendanceApprovalStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json(ResultResponse(false, 400, null, "ID không hợp lệ"));
      return;
    }

    const { approvalStatus, comments, currentUserId } = req.body;
    if (!approvalStatus) {
      res
        .status(400)
        .json(ResultResponse(false, 400, null, "approvalStatus là bắt buộc"));
      return;
    }

    const updated = await AttendanceApprovalService.updateStatus(
      id,
      { approvalStatus, comments },
      currentUserId
    );

    if (!updated) {
      res
        .status(404)
        .json(ResultResponse(false, 404, null, "Không thể cập nhật phê duyệt"));
      return;
    }

    res.json(
      ResultResponse(true, 200, null, "Cập nhật trạng thái thành công", updated)
    );
  } catch (err: any) {
    next(err);
  }
};

// ====================
// 🟥 Xóa yêu cầu phê duyệt
// ====================
export const deleteAttendanceApprovalController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const { currentUserId } = req.body;

    if (isNaN(id)) {
      res.status(400).json(ResultResponse(false, 400, null, "ID không hợp lệ"));
      return;
    }

    const deleted = await AttendanceApprovalService.delete(id, currentUserId);

    if (!deleted) {
      res
        .status(404)
        .json(
          ResultResponse(false, 404, null, "Không thể xóa yêu cầu phê duyệt")
        );
      return;
    }

    res.json(
      ResultResponse(true, 200, null, "Xóa yêu cầu phê duyệt thành công")
    );
  } catch (err: any) {
    next(err);
  }
};

// ====================
// 🟪 Thống kê trạng thái approval
// ====================
export const getAttendanceApprovalStatsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const approverId = req.query.approverId
      ? parseInt(req.query.approverId as string, 10)
      : undefined;

    const stats = await AttendanceApprovalService.getStats(approverId);
    res.json(ResultResponse(true, 200, null, null, stats));
  } catch (err: any) {
    next(err);
  }
};
