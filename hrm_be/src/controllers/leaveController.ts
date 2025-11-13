import { Request, Response, NextFunction } from "express";
import {
  getLeaveById,
  createLeave,
  updateLeave,
  deleteLeave,
  getLeavesByFilter,
  createLeaveTemplate,
  importLeavesFromExcel,
  exportLeavesToExcelBuffer,
} from "../services/leaveService";
import { LeaveSearchDTO } from "../dto/search/LeaveSearchDTO";
import { ResultResponse } from "../dto/response/resultResponse";
import multer from "multer";
const storage = multer.memoryStorage();
const upload = multer({ storage });

export const getLeavesByFilterController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;

    // Hỗ trợ nhiều tên query: startDate / startDateFrom và endDate / endDateTo
    const startDateFrom =
      (req.query.startDateFrom as string) ||
      (req.query.startDate as string) ||
      undefined;
    const startDateTo = (req.query.startDateTo as string) || undefined;
    const endDateFrom = (req.query.endDateFrom as string) || undefined;
    const endDateTo =
      (req.query.endDateTo as string) ||
      (req.query.endDate as string) ||
      undefined;

    const filter: LeaveSearchDTO = {
      employeeId: req.query.employeeId
        ? Number(req.query.employeeId)
        : undefined,
      employeeName: req.query.employeeName
        ? String(req.query.employeeName).trim()
        : undefined,
      leaveTypeId: req.query.leaveTypeId
        ? Number(req.query.leaveTypeId)
        : undefined,
      leaveTypeName: req.query.leaveTypeName
        ? String(req.query.leaveTypeName).trim()
        : undefined,
      reason: req.query.reason ? String(req.query.reason).trim() : undefined,
      status: req.query.status
        ? (String(req.query.status) as
            | "pending"
            | "approved"
            | "rejected"
            | "cancelled")
        : undefined,
      // ngày
      startDateFrom: startDateFrom,
      startDateTo: startDateTo,
      endDateFrom: endDateFrom,
      endDateTo: endDateTo,
      departmentId: req.query.departmentId
        ? Number(req.query.departmentId)
        : undefined,
    };

    const leaves = await getLeavesByFilter(page, pageSize, filter);

    return res.status(200).json(
      ResultResponse(
        true,
        200,
        null,
        null,
        leaves, // data
        leaves.totalItems // totalItem
      )
    );
  } catch (err) {
    next(err);
  }
};
// Lấy chi tiết
export const getLeaveByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const leave = await getLeaveById(Number(req.params.id));
    res.status(200).json(ResultResponse(true, 200, null, null, leave));
  } catch (err) {
    next(err);
  }
};

// Tạo mới
export const createLeaveController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const leave = await createLeave(req.body);
    res.status(201).json(ResultResponse(true, 201, null, null, leave));
  } catch (err) {
    next(err);
  }
};

// Cập nhật
export const updateLeaveController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const leave = await updateLeave(Number(req.params.id), req.body);
    res.status(200).json(ResultResponse(true, 200, null, null, leave));
  } catch (err) {
    next(err);
  }
};

// Xóa
export const deleteLeaveController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await deleteLeave(Number(req.params.id));
    res.status(200).json(ResultResponse(true, 200, null, null, result));
  } catch (err) {
    next(err);
  }
};
export const exportExcelController = async (req: Request, res: Response) => {
  try {
    console.log("🟢 Bắt đầu exportExcelController cho đơn nghỉ phép");

    const {
      // Filter mới (frontend)
      employeeName,
      departmentName,
      status,
      startDate,
      endDate,
      leaveTypeId,

      // Filter cũ
      employeeIds,
      leaveTypeIds,
      startDateFrom,
      startDateTo,
      departmentId,

      // Selected IDs
      selectedIds,
    } = req.query;

    const filter: any = {};

    // 👈 ƯU TIÊN selectedIds
    if (selectedIds) {
      if (typeof selectedIds === "string") {
        const idArray = selectedIds
          .split(",")
          .map((id) => {
            const numId = Number(id.trim());
            return isNaN(numId) ? null : numId;
          })
          .filter((id) => id !== null) as number[];

        if (idArray.length > 0) {
          filter.selectedIds = idArray;
          console.log(`✅ Đã nhận ${idArray.length} selectedIds:`, idArray);
        }
      }
    }

    // Chỉ xử lý các filter khác nếu KHÔNG có selectedIds
    if (!filter.selectedIds || filter.selectedIds.length === 0) {
      // 👈 HỖ TRỢ CẢ 2 LOẠI FILTER

      // Filter theo tên (mới)
      if (employeeName) filter.employeeName = employeeName.toString();
      if (departmentName) filter.departmentName = departmentName.toString();

      // Filter theo ID (cũ)
      if (employeeIds) {
        if (typeof employeeIds === "string") {
          const idArray = employeeIds
            .split(",")
            .map((id) => Number(id.trim()))
            .filter((id) => !isNaN(id));
          if (idArray.length > 0) filter.employeeIds = idArray;
        }
      }

      if (leaveTypeIds) {
        if (typeof leaveTypeIds === "string") {
          const idArray = leaveTypeIds
            .split(",")
            .map((id) => Number(id.trim()))
            .filter((id) => !isNaN(id));
          if (idArray.length > 0) filter.leaveTypeIds = idArray;
        }
      }

      // Filter theo leaveTypeId (mới) -> chuyển thành leaveTypeIds
      if (leaveTypeId && !filter.leaveTypeIds) {
        filter.leaveTypeIds = [Number(leaveTypeId)];
      }

      if (status) filter.status = status.toString();

      // Date range (hỗ trợ cả 2 format)
      if (startDateFrom) filter.startDateFrom = startDateFrom.toString();
      else if (startDate) filter.startDateFrom = startDate.toString();

      if (startDateTo) filter.startDateTo = startDateTo.toString();
      else if (endDate) filter.startDateTo = endDate.toString();

      if (departmentId) filter.departmentId = Number(departmentId);
    }

    console.log("Final filter parameters:", filter);

    const buffer = await exportLeavesToExcelBuffer(filter);

    console.log("✅ Export thành công, gửi file...");

    // Tạo tên file dựa trên loại export
    let fileName = "don-nghi-phep.xlsx";
    if (filter.selectedIds && filter.selectedIds.length > 0) {
      fileName = `don-nghi-phep-da-chon-${filter.selectedIds.length}.xlsx`;
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.send(buffer);
  } catch (error) {
    console.error("❌ Lỗi trong exportExcelController:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi xuất file Excel",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
// 🟪 Nhập Excel
export const importLeavesFromExcelController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      res
        .status(400)
        .json(
          ResultResponse(false, 400, null, "Vui lòng chọn file Excel để nhập")
        );
      return;
    }

    const results = await importLeavesFromExcel(req.file.buffer);

    res.json(
      ResultResponse(
        true,
        200,
        null,
        `Nhập file thành công: ${results.success} bản ghi mới, ${results.updated} bản ghi cập nhật`,
        results
      )
    );
  } catch (err: any) {
    next(err);
  }
};

// 🟪 Download template
export const downloadLeaveTemplateController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const buffer = await createLeaveTemplate();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=template-don-nghi-phep.xlsx"
    );

    res.send(buffer);
  } catch (err: any) {
    next(err);
  }
};

// Middleware upload file
export const uploadFile = upload.single("file");

// ... Các controller hiện có giữ nguyên
export const getLeavesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt((req.query.page as string) || "1");
    const pageSize = parseInt((req.query.pageSize as string) || "10");

    const filter = {
      employeeId: req.query.employeeId
        ? parseInt(req.query.employeeId as string)
        : undefined,
      leaveTypeId: req.query.leaveTypeId
        ? parseInt(req.query.leaveTypeId as string)
        : undefined,
      status: req.query.status as string,
      startDateFrom: req.query.startDateFrom as string,
      startDateTo: req.query.startDateTo as string,
      endDateFrom: req.query.endDateFrom as string,
      endDateTo: req.query.endDateTo as string,
      employeeName: req.query.employeeName as string,
      leaveTypeName: req.query.leaveTypeName as string,
      departmentId: req.query.departmentId
        ? parseInt(req.query.departmentId as string)
        : undefined,
    };

    const result = await getLeavesByFilter(page, pageSize, filter);

    res.json(
      ResultResponse(true, 200, null, null, result.data, result.totalItems)
    );
  } catch (err: any) {
    next(err);
  }
};
