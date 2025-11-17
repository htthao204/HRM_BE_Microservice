import { NextFunction, Request, Response } from "express";
import {
  getAllAttendances,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendancesByEmployeeId,
  importAttendancesFromExcel,
  exportAttendancesToExcel,
  downloadTemplate,
  updateAttendanceStatus,
  bulkDeleteAttendances,
  bulkUpdateAttendanceStatus,
  getAttendanceStatistics,
  recalculateAttendance,
  syncAttendanceFromLogs,
  getEmployees,
  getWorkShifts,
} from "../services/attendanceService";
import { ResultResponse } from "../dto/response/resultResponse";

// ==============================
// 📘 Lấy danh sách chấm công có phân trang + filter
// ==============================
export const getAttendancesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const {
      employeeName,
      department,
      status,
      dateRange,
      dateFrom,
      dateTo,
      sortBy = "date",
      sortOrder = "desc",
    } = req.query;

    const filters = {
      employeeName: employeeName as string,
      department: department as string,
      status: status as string,
      dateRange: dateRange as string,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
    };

    const result = await getAllAttendances({
      page,
      pageSize,
      filters,
      sortBy: sortBy as string,
      sortOrder: sortOrder as "asc" | "desc",
    });

    res.status(200).json(
      ResultResponse(true, 200, "Lấy danh sách chấm công thành công", null, {
        items: result.data,
        totalItems: result.totalItems,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
      })
    );
  } catch (err: any) {
    next(err);
  }
};

// ==============================
// 📘 Lấy chấm công theo ID
// ==============================
export const getAttendanceByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    const attendance = await getAttendanceById(id);
    res
      .status(200)
      .json(
        ResultResponse(
          true,
          200,
          "Lấy thông tin chấm công thành công",
          null,
          attendance
        )
      );
  } catch (err: any) {
    next(err);
  }
};

// ==============================
// 📘 Lấy danh sách chấm công theo employeeId
// ==============================
export const getAttendancesByEmployeeIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const employeeId = Number(req.params.employeeId);
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const dateFrom = req.query.dateFrom as string;
    const dateTo = req.query.dateTo as string;

    const result = await getAttendancesByEmployeeId({
      employeeId,
      page,
      pageSize,
      dateFrom,
      dateTo,
    });

    res.status(200).json(
      ResultResponse(
        true,
        200,
        "Lấy danh sách chấm công theo nhân viên thành công",
        null,
        {
          items: result.data,
          totalItems: result.totalItems,
          totalPages: result.totalPages,
          currentPage: result.currentPage,
        }
      )
    );
  } catch (err: any) {
    next(err);
  }
};

// ==============================
// 📘 Lấy thống kê chấm công
// ==============================
export const getAttendanceStatisticsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { dateFrom, dateTo, department } = req.query;

    const statistics = await getAttendanceStatistics({
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
      department: department as string,
    });

    res
      .status(200)
      .json(
        ResultResponse(
          true,
          200,
          "Lấy thống kê chấm công thành công",
          null,
          statistics
        )
      );
  } catch (err: any) {
    next(err);
  }
};

// ==============================
// 📘 Lấy danh sách nhân viên
// ==============================
export const getEmployeesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const employees = await getEmployees();
    res
      .status(200)
      .json(
        ResultResponse(
          true,
          200,
          "Lấy danh sách nhân viên thành công",
          null,
          employees
        )
      );
  } catch (err: any) {
    next(err);
  }
};

// ==============================
// 📘 Lấy danh sách ca làm việc
// ==============================
export const getWorkShiftsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const workShifts = await getWorkShifts();
    res
      .status(200)
      .json(
        ResultResponse(
          true,
          200,
          "Lấy danh sách ca làm việc thành công",
          null,
          workShifts
        )
      );
  } catch (err: any) {
    next(err);
  }
};

// ==============================
// 📘 Tạo mới chấm công
// ==============================
export const createAttendanceController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body;

    // Validate required fields
    if (!data.employeeId || !data.workDate) {
      return res
        .status(400)
        .json(
          ResultResponse(
            false,
            400,
            "Thiếu thông tin bắt buộc: employeeId và workDate",
            null,
            null
          )
        );
    }

    const newAttendance = await createAttendance(data);
    res
      .status(201)
      .json(
        ResultResponse(
          true,
          201,
          "Tạo dữ liệu chấm công thành công",
          null,
          newAttendance
        )
      );
  } catch (err: any) {
    next(err);
  }
};

// ==============================
// 📘 Cập nhật chấm công
// ==============================
export const updateAttendanceController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    const data = req.body;

    const updatedAttendance = await updateAttendance(id, data);
    res
      .status(200)
      .json(
        ResultResponse(
          true,
          200,
          "Cập nhật chấm công thành công",
          null,
          updatedAttendance
        )
      );
  } catch (err: any) {
    next(err);
  }
};

// ==============================
// 📘 Cập nhật trạng thái chấm công
// ==============================
export const updateAttendanceStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!status) {
      return res
        .status(400)
        .json(
          ResultResponse(
            false,
            400,
            "Thiếu trạng thái cần cập nhật",
            null,
            null
          )
        );
    }

    const updatedAttendance = await updateAttendanceStatus(id, status);
    res
      .status(200)
      .json(
        ResultResponse(
          true,
          200,
          "Cập nhật trạng thái chấm công thành công",
          null,
          updatedAttendance
        )
      );
  } catch (err: any) {
    next(err);
  }
};

// ==============================
// 📘 Xóa chấm công
// ==============================
export const deleteAttendanceController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    await deleteAttendance(id);
    res
      .status(200)
      .json(ResultResponse(true, 200, "Xóa chấm công thành công", null, null));
  } catch (err: any) {
    next(err);
  }
};

// ==============================
// 📘 Xóa hàng loạt chấm công
// ==============================
export const bulkDeleteAttendancesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json(
          ResultResponse(false, 400, "Danh sách ID không hợp lệ", null, null)
        );
    }

    const result = await bulkDeleteAttendances(ids);
    res
      .status(200)
      .json(
        ResultResponse(
          true,
          200,
          `Đã xóa ${result.deletedCount} bản ghi chấm công`,
          null,
          result
        )
      );
  } catch (err: any) {
    next(err);
  }
};

// ==============================
// 📘 Cập nhật trạng thái hàng loạt
// ==============================
export const bulkUpdateAttendanceStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ids, status } = req.body;

    if (!Array.isArray(ids) || ids.length === 0 || !status) {
      return res
        .status(400)
        .json(
          ResultResponse(
            false,
            400,
            "Thiếu thông tin bắt buộc: ids và status",
            null,
            null
          )
        );
    }

    const result = await bulkUpdateAttendanceStatus(ids, status);
    res
      .status(200)
      .json(
        ResultResponse(
          true,
          200,
          `Đã cập nhật trạng thái cho ${result.updatedCount} bản ghi`,
          null,
          result
        )
      );
  } catch (err: any) {
    next(err);
  }
};

// ==============================
// 📘 Import dữ liệu từ Excel
// ==============================
export const importAttendancesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json(
          ResultResponse(false, 400, "Không tìm thấy file upload", null, null)
        );
    }

    const result = await importAttendancesFromExcel(req.file);
    res
      .status(200)
      .json(
        ResultResponse(
          true,
          200,
          `Import thành công: ${result.successCount} bản ghi, Thất bại: ${result.failedCount}`,
          null,
          result
        )
      );
  } catch (err: any) {
    next(err);
  }
};

// ==============================
// 📘 Export dữ liệu ra Excel
// ==============================
export const exportAttendancesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const filters = req.body;

    const workbook = await exportAttendancesToExcel(filters);

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=du-lieu-cham-cong-${
        new Date().toISOString().split("T")[0]
      }.xlsx`
    );

    // Write workbook to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (err: any) {
    next(err);
  }
};

// ==============================
// 📘 Tải template import
// ==============================
export const downloadTemplateController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const workbook = await downloadTemplate();

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=template-du-lieu-cham-cong.xlsx"
    );

    // Write workbook to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (err: any) {
    next(err);
  }
};

// ==============================
// 📘 Tính toán lại dữ liệu chấm công
// ==============================
export const recalculateAttendanceController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate, employeeId } = req.body;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json(
          ResultResponse(
            false,
            400,
            "Thiếu thông tin bắt buộc: startDate và endDate",
            null,
            null
          )
        );
    }

    const result = await recalculateAttendance(startDate, endDate, employeeId);
    res
      .status(200)
      .json(
        ResultResponse(
          true,
          200,
          `Đã tính toán lại ${result.recalculatedCount} bản ghi chấm công`,
          null,
          result
        )
      );
  } catch (err: any) {
    next(err);
  }
};

// ==============================
// 📘 Đồng bộ từ attendance logs
// ==============================
export const syncAttendanceFromLogsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate, employeeId } = req.body;

    const result = await syncAttendanceFromLogs({
      startDate,
      endDate,
      employeeId,
    });

    res
      .status(200)
      .json(
        ResultResponse(
          true,
          200,
          `Đã đồng bộ ${result.syncedCount} bản ghi từ logs`,
          null,
          result
        )
      );
  } catch (err: any) {
    next(err);
  }
};
