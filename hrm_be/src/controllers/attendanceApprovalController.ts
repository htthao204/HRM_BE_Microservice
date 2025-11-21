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
    const currentUserId = req.user?.id; // 🆕 Lấy từ authentication

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
      limit,
      currentUserId // 🆕 Truyền currentUserId
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
    const currentUserId = req.user?.id; // 🆕 Lấy từ authentication

    if (isNaN(id)) {
      res.status(400).json(ResultResponse(false, 400, null, "ID không hợp lệ"));
      return;
    }

    const approval = await AttendanceApprovalService.getById(id, currentUserId);
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
// 🟧 Tạo yêu cầu phê duyệt (CẬP NHẬT LỚN)
// ====================
export const createAttendanceApprovalController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      attendanceId,
      adjustmentId, // 🆕 THÊM adjustmentId
      approverId,
      approvalType = "regular", // 🆕 Mặc định là regular
      oldData,
      newData,
      comments,
    } = req.body;

    // 🆕 KIỂM TRA ĐIỀU KIỆN MỚI
    if (!approverId) {
      res
        .status(400)
        .json(ResultResponse(false, 400, null, "approverId là bắt buộc"));
      return;
    }

    // 🆕 KIỂM TRA LOẠI PHÊ DUYỆT
    if (approvalType === "adjustment" && !adjustmentId) {
      res
        .status(400)
        .json(
          ResultResponse(
            false,
            400,
            null,
            "adjustmentId là bắt buộc cho loại adjustment"
          )
        );
      return;
    }

    if (approvalType !== "adjustment" && !attendanceId) {
      res
        .status(400)
        .json(
          ResultResponse(
            false,
            400,
            null,
            "attendanceId là bắt buộc cho loại regular/overtime"
          )
        );
      return;
    }

    const newApproval = await AttendanceApprovalService.create({
      attendanceId,
      adjustmentId, // 🆕 TRUYỀN adjustmentId
      approverId,
      approvalType,
      oldData,
      newData,
      comments,
    });

    if (!newApproval) {
      res
        .status(400)
        .json(
          ResultResponse(
            false,
            400,
            null,
            "Không thể tạo yêu cầu phê duyệt. Có thể đã tồn tại yêu cầu chờ duyệt."
          )
        );
      return;
    }

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
// 🟦 Cập nhật trạng thái approval (phê duyệt / từ chối) - CẬP NHẬT
// ====================
export const updateAttendanceApprovalStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const currentUserId = req.user?.id; // 🆕 Lấy từ authentication thay vì body

    if (isNaN(id)) {
      res.status(400).json(ResultResponse(false, 400, null, "ID không hợp lệ"));
      return;
    }

    if (!currentUserId) {
      res
        .status(401)
        .json(
          ResultResponse(false, 401, null, "Không xác định được người dùng")
        );
      return;
    }

    const { approvalStatus, comments } = req.body;

    if (!approvalStatus) {
      res
        .status(400)
        .json(ResultResponse(false, 400, null, "approvalStatus là bắt buộc"));
      return;
    }

    if (!["approved", "rejected"].includes(approvalStatus)) {
      res
        .status(400)
        .json(
          ResultResponse(
            false,
            400,
            null,
            "approvalStatus phải là 'approved' hoặc 'rejected'"
          )
        );
      return;
    }

    const updated = await AttendanceApprovalService.updateStatus(
      id,
      { approvalStatus, comments },
      currentUserId // 🆕 Sử dụng currentUserId từ authentication
    );

    if (!updated) {
      res
        .status(404)
        .json(
          ResultResponse(
            false,
            404,
            null,
            "Không thể cập nhật phê duyệt. Có thể yêu cầu không tồn tại, đã được xử lý, hoặc bạn không có quyền."
          )
        );
      return;
    }

    const message =
      approvalStatus === "approved"
        ? "Phê duyệt thành công"
        : "Từ chối thành công";

    res.json(ResultResponse(true, 200, null, message, updated));
  } catch (err: any) {
    next(err);
  }
};

// ====================
// 🟥 Xóa yêu cầu phê duyệt - CẬP NHẬT
// ====================
export const deleteAttendanceApprovalController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const currentUserId = req.user?.id; // 🆕 Lấy từ authentication

    if (isNaN(id)) {
      res.status(400).json(ResultResponse(false, 400, null, "ID không hợp lệ"));
      return;
    }

    if (!currentUserId) {
      res
        .status(401)
        .json(
          ResultResponse(false, 401, null, "Không xác định được người dùng")
        );
      return;
    }

    const deleted = await AttendanceApprovalService.delete(id, currentUserId);

    if (!deleted) {
      res
        .status(404)
        .json(
          ResultResponse(
            false,
            404,
            null,
            "Không thể xóa yêu cầu phê duyệt. Có thể yêu cầu không tồn tại, đã được xử lý, hoặc bạn không có quyền."
          )
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
// 🟪 Thống kê trạng thái approval - CẬP NHẬT
// ====================
export const getAttendanceApprovalStatsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const approverId = req.query.approverId
      ? parseInt(req.query.approverId as string, 10)
      : req.user?.id; // 🆕 Mặc định là user hiện tại

    const stats = await AttendanceApprovalService.getStats(approverId);
    res.json(ResultResponse(true, 200, null, null, stats));
  } catch (err: any) {
    next(err);
  }
};

// 🆕 THÊM CONTROLLER MỚI: Tạo yêu cầu điều chỉnh công
// ====================
// 🟩 Tạo yêu cầu điều chỉnh công
// ====================
export const createAttendanceAdjustmentController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      employeeId,
      adjustmentDate,
      originalHours = 0,
      adjustedHours,
      checkinTime,
      checkoutTime,
      adjustmentType,
      reason,
      approverId, // 🆕 Người sẽ phê duyệt
    } = req.body;

    const requestedBy = req.user?.id; // Người tạo yêu cầu

    if (
      !employeeId ||
      !adjustmentDate ||
      !adjustedHours ||
      !adjustmentType ||
      !reason ||
      !approverId
    ) {
      res
        .status(400)
        .json(
          ResultResponse(
            false,
            400,
            null,
            "employeeId, adjustmentDate, adjustedHours, adjustmentType, reason, approverId là bắt buộc"
          )
        );
      return;
    }

    // 🆕 TẠO ADJUSTMENT TRƯỚC
    const adjustment = await AttendanceAdjustmentService.create({
      employeeId,
      adjustmentDate,
      originalHours,
      adjustedHours,
      checkinTime,
      checkoutTime,
      adjustmentType,
      reason,
      requestedBy,
    });

    if (!adjustment) {
      res
        .status(400)
        .json(
          ResultResponse(false, 400, null, "Không thể tạo yêu cầu điều chỉnh")
        );
      return;
    }

    // 🆕 TẠO APPROVAL CHO ADJUSTMENT
    const approval = await AttendanceApprovalService.create({
      adjustmentId: adjustment.id,
      approverId,
      approvalType: "adjustment",
      oldData: { originalHours, status: "pending" },
      newData: { adjustedHours, status: "approved" },
      comments: `Yêu cầu điều chỉnh công: ${reason}`,
    });

    if (!approval) {
      // Rollback adjustment nếu không tạo được approval
      await AttendanceAdjustmentService.delete(adjustment.id, requestedBy);
      res
        .status(400)
        .json(
          ResultResponse(false, 400, null, "Không thể tạo yêu cầu phê duyệt")
        );
      return;
    }

    res
      .status(201)
      .json(
        ResultResponse(
          true,
          201,
          null,
          "Tạo yêu cầu điều chỉnh công thành công và đã gửi phê duyệt",
          { adjustment, approval }
        )
      );
  } catch (err: any) {
    next(err);
  }
};
