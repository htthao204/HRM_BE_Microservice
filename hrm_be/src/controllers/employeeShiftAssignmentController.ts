import { Request, Response, NextFunction } from "express";
import {
  getAllEmployeeShiftAssignments,
  getEmployeeShiftAssignmentById,
  createEmployeeShiftAssignment,
  updateEmployeeShiftAssignment,
  deleteEmployeeShiftAssignment,
  getEmployeeShiftAssignmentsByFilter,
  exportEmployeeShiftAssignmentsToExcelBuffer,
  createEmployeeShiftAssignmentTemplate,
  importEmployeeShiftAssignmentsFromExcel,
} from "../services/employeeShiftAssignmentService";
import { ResultResponse } from "../dto/response/resultResponse";

// ==========================
// Lấy tất cả (có phân trang + search)
// ==========================
export const getAllShiftAssignmentsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const search = (req.query.search as string) || "";

    // ⚙️ Nếu bạn có filter search thì có thể truyền thêm param search ở service
    const result = await getEmployeeShiftAssignmentsByFilter(page, pageSize, {
      assignmentType: search, // hoặc tùy logic bạn muốn lọc theo tên/loại
    });

    res
      .status(200)
      .json(
        ResultResponse(true, 200, null, null, result.data, result.totalItems)
      );
  } catch (error) {
    next(error);
  }
};

// ==========================
// Lấy theo ID
// ==========================
export const getShiftAssignmentByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);
    const shiftAssignment = await getEmployeeShiftAssignmentById(id);

    if (!shiftAssignment) {
      return res
        .status(404)
        .json(ResultResponse(false, 404, "Không tìm thấy phân ca làm việc"));
    }

    res
      .status(200)
      .json(ResultResponse(true, 200, null, null, shiftAssignment));
  } catch (error) {
    next(error);
  }
};

// ==========================
// Tạo mới
// ==========================
export const createShiftAssignmentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const newShiftAssignment = await createEmployeeShiftAssignment(req.body);

    res
      .status(201)
      .json(ResultResponse(true, 201, null, null, newShiftAssignment));
  } catch (error) {
    next(error);
  }
};

// ==========================
// Cập nhật
// ==========================
export const updateShiftAssignmentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);
    const updatedShiftAssignment = await updateEmployeeShiftAssignment(
      id,
      req.body
    );

    if (!updatedShiftAssignment) {
      return res
        .status(404)
        .json(ResultResponse(false, 404, "Không tìm thấy phân ca làm việc"));
    }

    res
      .status(200)
      .json(ResultResponse(true, 200, null, null, updatedShiftAssignment));
  } catch (error) {
    next(error);
  }
};

// ==========================
// Xóa
// ==========================
export const deleteShiftAssignmentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await deleteEmployeeShiftAssignment(id);

    if (!deleted) {
      return res
        .status(404)
        .json(ResultResponse(false, 404, "Không tìm thấy phân ca làm việc"));
    }

    res.status(200).json(ResultResponse(true, 200, null, null, null));
  } catch (error) {
    next(error);
  }
};

// ==========================
// Lọc theo nhiều điều kiện (filter)
// ==========================
export const getAssignmentsByFilterController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const filters = {
      employeeId: req.query.employeeId
        ? Number(req.query.employeeId)
        : undefined,
      workShiftId: req.query.workShiftId
        ? Number(req.query.workShiftId)
        : undefined,
      assignmentType: req.query.assignmentType as string,
      status: req.query.status as string,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
    };

    const result = await getEmployeeShiftAssignmentsByFilter(
      page,
      pageSize,
      filters
    );

    res
      .status(200)
      .json(
        ResultResponse(true, 200, null, null, result.data, result.totalItems)
      );
  } catch (error) {
    next(error);
  }
};
export const exportShiftAssignmentsToExcelController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const filters = {
      employeeIds: req.query.employeeIds
        ? (req.query.employeeIds as string)
            .split(",")
            .map(Number)
            .filter((id) => !isNaN(id))
        : undefined,
      workShiftIds: req.query.workShiftIds
        ? (req.query.workShiftIds as string)
            .split(",")
            .map(Number)
            .filter((id) => !isNaN(id))
        : undefined,
      assignmentType: req.query.assignmentType as string,
      status: req.query.status as string,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
    };

    console.log("📊 Export filters:", filters);

    const buffer = await exportEmployeeShiftAssignmentsToExcelBuffer(filters);

    // Thiết lập headers cho file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="phan-ca-lam-viec-${
        new Date().toISOString().split("T")[0]
      }.xlsx"`
    );
    res.setHeader("Content-Length", buffer.length);

    res.status(200).send(buffer);
  } catch (error: any) {
    console.error("❌ Lỗi export Excel:", error);
    res
      .status(500)
      .json(
        ResultResponse(false, 500, `Lỗi xuất file Excel: ${error.message}`)
      );
  }
};

// ==========================
// Import Excel
// ==========================
export const importShiftAssignmentsFromExcelController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, "Vui lòng chọn file Excel để import"));
    }

    console.log("📥 Nhận file import:", req.file.originalname);

    const result = await importEmployeeShiftAssignmentsFromExcel(
      req.file.buffer
    );

    res.status(200).json(
      ResultResponse(true, 200, "Import dữ liệu thành công", null, {
        total: result.total,
        success: result.success,
        updated: result.updated,
        duplicates: result.duplicates,
        errors: result.errors,
      })
    );
  } catch (error: any) {
    console.error("❌ Lỗi import Excel:", error);
    res
      .status(500)
      .json(
        ResultResponse(false, 500, `Lỗi import file Excel: ${error.message}`)
      );
  }
};

// ==========================
// Download Template
// ==========================
export const downloadShiftAssignmentTemplateController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const buffer = await createEmployeeShiftAssignmentTemplate();

    // Thiết lập headers cho file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=template-phan-ca-lam-viec.xlsx"
    );
    res.setHeader("Content-Length", buffer.length);

    res.status(200).send(buffer);
  } catch (error: any) {
    console.error("❌ Lỗi download template:", error);
    res
      .status(500)
      .json(ResultResponse(false, 500, `Lỗi tải template: ${error.message}`));
  }
};

// ==========================
// Export với body params (POST request)
// ==========================
export const exportShiftAssignmentsWithBodyController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const filters = req.body.filters || {};

    console.log("📊 Export với body filters:", filters);

    const buffer = await exportEmployeeShiftAssignmentsToExcelBuffer(filters);

    // Thiết lập headers cho file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="phan-ca-lam-viec-${
        new Date().toISOString().split("T")[0]
      }.xlsx"`
    );
    res.setHeader("Content-Length", buffer.length);

    res.status(200).send(buffer);
  } catch (error: any) {
    console.error("❌ Lỗi export Excel với body:", error);
    res
      .status(500)
      .json(
        ResultResponse(false, 500, `Lỗi xuất file Excel: ${error.message}`)
      );
  }
};
