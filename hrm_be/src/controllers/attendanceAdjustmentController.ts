// controllers/attendanceAdjustmentController.ts
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
  rejectManyAdjustments,
  approveManyAdjustments,
  deleteManyAttendanceAdjustments,
  approveAdjustmentWithTransaction,
  approveManyAdjustmentsWithTransaction,
  getAdjustmentStats,
  rollbackAdjustment,
} from "../services/attendanceAdjustmentService";
import { ResultResponse } from "../dto/response/resultResponse";

// ==============================
// GET /attendance-adjustments
// ==============================
export const getAttendanceAdjustmentsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      page,
      limit,
      employeeId,
      status,
      startDate,
      endDate,
      adjustmentType,
    } = req.query;

    // 🎯 FIX: Kiểm tra có query parameters không
    const hasQueryParams =
      page ||
      limit ||
      employeeId ||
      status ||
      startDate ||
      endDate ||
      adjustmentType;

    if (hasQueryParams) {
      // Pagination + filter
      const result = await getAttendanceAdjustmentsPage(
        Number(page) || 1,
        Number(limit) || 10,
        {
          employeeId: employeeId ? Number(employeeId) : undefined,
          status: status as "pending" | "approved" | "rejected" | undefined,
          startDate: startDate as string | undefined,
          endDate: endDate as string | undefined,
          adjustmentType: adjustmentType as string | undefined,
        }
      );
      return res.json(
        ResultResponse(true, 200, null, null, result.data, result.total)
      );
    }

    // Lấy tất cả (không phân trang)
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

    // Validation cơ bản
    if (
      !data.employeeId ||
      !data.adjustmentDate ||
      !data.adjustmentType ||
      !data.reason ||
      !data.requestedBy
    ) {
      return res
        .status(400)
        .json(
          ResultResponse(
            false,
            400,
            "Thiếu thông tin bắt buộc: employeeId, adjustmentDate, adjustmentType, reason, requestedBy"
          )
        );
    }

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
// Phê duyệt đơn giản (chỉ cập nhật status)
// ==============================
export const approveAttendanceAdjustmentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    const { approverId, reviewNote } = req.body;

    if (!approverId) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, "Thiếu approverId"));
    }

    const updated = await approveAdjustment(id, approverId, reviewNote);

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
// POST /attendance-adjustments/:id/approve-with-transaction
// Phê duyệt với transaction (cập nhật tất cả bảng liên quan)
// ==============================
export const approveAttendanceAdjustmentWithTransactionController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    const { approverId, reviewNote } = req.body;

    if (!approverId) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, "Thiếu approverId"));
    }

    const updated = await approveAdjustmentWithTransaction(
      id,
      approverId,
      reviewNote
    );

    if (!updated) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, "Không thể phê duyệt bản ghi này"));
    }

    return res.json(
      ResultResponse(
        true,
        200,
        null,
        "Phê duyệt thành công (đã cập nhật tất cả bảng liên quan)",
        updated
      )
    );
  } catch (err: any) {
    console.error("❌ Lỗi khi phê duyệt với transaction:", err);

    // Xử lý lỗi cụ thể
    let errorMessage = "Không thể phê duyệt bản ghi";
    if (err.message.includes("employee_id")) {
      errorMessage = "Thiếu thông tin nhân viên";
    } else if (err.message.includes("adjustment_date")) {
      errorMessage = "Thiếu thông tin ngày điều chỉnh";
    }

    return res.status(400).json(ResultResponse(false, 400, errorMessage));
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
    const { approverId, reviewNote } = req.body;

    if (!approverId) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, "Thiếu approverId"));
    }

    const updated = await rejectAdjustment(id, approverId, reviewNote);

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

// ==============================
// POST /attendance-adjustments/bulk-delete
// ==============================
export const bulkDeleteAttendanceAdjustmentsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, "Danh sách ID không hợp lệ"));
    }

    const deletedCount = await deleteManyAttendanceAdjustments(ids);
    return res.json(
      ResultResponse(
        true,
        200,
        null,
        `Đã xóa ${deletedCount} bản ghi thành công`,
        null,
        deletedCount
      )
    );
  } catch (err: any) {
    next(err);
  }
};

// ==============================
// POST /attendance-adjustments/bulk-approve
// Phê duyệt nhiều đơn giản (chỉ cập nhật status)
// ==============================
export const bulkApproveAttendanceAdjustmentsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ids, approverId, reviewNote } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0 || !approverId) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, "Thiếu danh sách ID hoặc approverId"));
    }

    const updatedCount = await approveManyAdjustments(
      ids,
      approverId,
      reviewNote
    );
    return res.json(
      ResultResponse(
        true,
        200,
        null,
        `Đã phê duyệt ${updatedCount} bản ghi thành công`,
        null,
        updatedCount
      )
    );
  } catch (err: any) {
    next(err);
  }
};

// ==============================
// POST /attendance-adjustments/bulk-approve-with-transaction
// Phê duyệt nhiều với transaction (cập nhật tất cả bảng liên quan)
// ==============================
export const bulkApproveAttendanceAdjustmentsWithTransactionController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ids, approverId, reviewNote } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0 || !approverId) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, "Thiếu danh sách ID hoặc approverId"));
    }

    const successCount = await approveManyAdjustmentsWithTransaction(
      ids,
      approverId,
      reviewNote
    );

    return res.json(
      ResultResponse(
        true,
        200,
        null,
        `Đã phê duyệt thành công ${successCount}/${ids.length} bản ghi (đã cập nhật tất cả bảng liên quan)`,
        {
          totalRequested: ids.length,
          totalApproved: successCount,
          failedCount: ids.length - successCount,
        },
        successCount
      )
    );
  } catch (err: any) {
    console.error("❌ Lỗi khi phê duyệt hàng loạt với transaction:", err);

    return res
      .status(400)
      .json(
        ResultResponse(false, 400, "Không thể phê duyệt hàng loạt bản ghi")
      );
  }
};

// ==============================
// POST /attendance-adjustments/bulk-reject
// ==============================
export const bulkRejectAttendanceAdjustmentsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ids, approverId, reviewNote } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0 || !approverId) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, "Thiếu danh sách ID hoặc approverId"));
    }

    const updatedCount = await rejectManyAdjustments(
      ids,
      approverId,
      reviewNote
    );
    return res.json(
      ResultResponse(
        true,
        200,
        null,
        `Đã từ chối ${updatedCount} bản ghi thành công`,
        null,
        updatedCount
      )
    );
  } catch (err: any) {
    next(err);
  }
};

// ==============================
// GET /attendance-adjustments/:id/approval-impact
// Xem ảnh hưởng khi phê duyệt
// ==============================
export const getAdjustmentApprovalImpactController = async (
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

    // Tính toán ảnh hưởng
    const impact = calculateApprovalImpact(adjustment);

    return res.json(
      ResultResponse(true, 200, null, "Thông tin ảnh hưởng khi phê duyệt", {
        adjustment,
        impact,
      })
    );
  } catch (err: any) {
    next(err);
  }
};

// ==============================
// GET /attendance-adjustments/stats
// ==============================
export const getAdjustmentStatsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = await getAdjustmentStats();
    return res.json(ResultResponse(true, 200, null, null, stats));
  } catch (err: any) {
    next(err);
  }
};

// ==============================
// POST /attendance-adjustments/:id/rollback
// Rollback khẩn cấp (chỉ dùng khi có lỗi)
// ==============================
export const rollbackAttendanceAdjustmentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    const success = await rollbackAdjustment(id);

    if (!success) {
      return res
        .status(400)
        .json(
          ResultResponse(
            false,
            400,
            "Không thể rollback. Có thể bản ghi không tồn tại hoặc chưa được phê duyệt"
          )
        );
    }

    return res.json(
      ResultResponse(
        true,
        200,
        null,
        "Rollback thành công. Bản ghi đã được chuyển về trạng thái chờ duyệt"
      )
    );
  } catch (err: any) {
    next(err);
  }
};

// ==============================
// GET /attendance-adjustments/export
// ==============================
export const exportAttendanceAdjustmentsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { employeeId, status, startDate, endDate, adjustmentType } =
      req.query;

    // Lấy tất cả dữ liệu không phân trang
    const adjustments = await getAllAttendanceAdjustments();

    // Format dữ liệu cho export
    const exportData = adjustments.map((adj) => ({
      "Mã NV": adj.employee?.employeeCode || `NV${adj.employeeId}`,
      "Tên NV": adj.employee?.fullName || `Nhân viên ${adj.employeeId}`,
      "Ngày điều chỉnh": adj.adjustmentDate,
      "Giờ ban đầu": adj.originalHours,
      "Giờ điều chỉnh": adj.adjustedHours,
      "Loại điều chỉnh": adj.adjustmentType,
      "Lý do": adj.reason,
      "Trạng thái": adj.status,
      "Người duyệt": adj.approver?.fullName || "Chưa duyệt",
      "Ngày duyệt": adj.approvedAt || "Chưa duyệt",
      "Ghi chú": adj.reviewNote || "",
    }));

    // Set headers cho file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=danh-sach-dieu-chinh-cong.xlsx"
    );

    // Trong thực tế, bạn có thể dùng thư viện như exceljs để tạo file Excel
    // Ở đây trả về JSON, frontend sẽ xử lý export
    return res.json(
      ResultResponse(true, 200, null, "Dữ liệu export", exportData)
    );
  } catch (err: any) {
    next(err);
  }
};

// ==============================
// 🧮 HÀM TÍNH TOÁN ẢNH HƯỞNG
// ==============================
const calculateApprovalImpact = (adjustment: any) => {
  const originalHours = parseFloat(adjustment.originalHours) || 0;
  const adjustedHours = parseFloat(adjustment.adjustedHours) || 0;
  const hoursDifference = adjustedHours - originalHours;

  // Giả định lương cơ bản 5,000,000 VND
  const baseSalary = 5000000;
  const hourlyRate = baseSalary / 22 / 8; // 22 ngày, 8h/ngày
  const salaryImpact = hoursDifference * hourlyRate;

  return {
    hoursDifference,
    salaryImpact,
    attendanceStatusChange: {
      from: calculateAttendanceStatus(originalHours),
      to: calculateAttendanceStatus(adjustedHours),
    },
    summaryImpact: {
      actualHoursChange: hoursDifference,
      presentDaysChange:
        originalHours < 4 && adjustedHours >= 4
          ? 1
          : originalHours >= 4 && adjustedHours < 4
          ? -1
          : 0,
      absentDaysChange:
        originalHours < 4 && adjustedHours >= 4
          ? -1
          : originalHours >= 4 && adjustedHours < 4
          ? 1
          : 0,
    },
  };
};

const calculateAttendanceStatus = (hours: number): string => {
  if (hours >= 8) return "present";
  if (hours >= 4) return "half_day";
  return "absent";
};

// ==============================
// Middleware validation cho create
// ==============================
export const validateCreateAdjustment = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { employeeId, adjustmentDate, adjustmentType, reason, requestedBy } =
    req.body;

  const errors: string[] = [];

  if (!employeeId) errors.push("employeeId là bắt buộc");
  if (!adjustmentDate) errors.push("adjustmentDate là bắt buộc");
  if (!adjustmentType) errors.push("adjustmentType là bắt buộc");
  if (!reason) errors.push("reason là bắt buộc");
  if (!requestedBy) errors.push("requestedBy là bắt buộc");

  // Validate date format
  if (adjustmentDate) {
    const date = new Date(adjustmentDate);
    if (isNaN(date.getTime())) {
      errors.push("adjustmentDate không đúng định dạng");
    }
  }

  if (errors.length > 0) {
    return res.status(400).json(ResultResponse(false, 400, errors.join(", ")));
  }

  next();
};

// ==============================
// Middleware validation cho bulk actions
// ==============================
export const validateBulkAction = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { ids, approverId } = req.body;

  const errors: string[] = [];

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    errors.push("Danh sách IDs là bắt buộc và phải là mảng không rỗng");
  }

  if (!approverId) {
    errors.push("approverId là bắt buộc");
  }

  if (ids && Array.isArray(ids)) {
    const invalidIds = ids.filter((id) => typeof id !== "number" || id <= 0);
    if (invalidIds.length > 0) {
      errors.push(`Có ID không hợp lệ: ${invalidIds.join(", ")}`);
    }
  }

  if (errors.length > 0) {
    return res.status(400).json(ResultResponse(false, 400, errors.join("; ")));
  }

  next();
};
