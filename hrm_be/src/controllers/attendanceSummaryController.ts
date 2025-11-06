import { Request, Response, NextFunction } from "express";
import { ResultResponse } from "../dto/response/resultResponse";
import {
  getFilteredAttendanceSummaries,
  createAttendanceSummary,
  updateAttendanceSummary,
  deleteAttendanceSummary,
  getAttendanceSummaryById,
  getAttendanceSummaryByEmployeeAndMonth,
} from "../services/attendanceSummaryService";

interface AttendanceSummaryRequest {
  employee_id: number;
  summary_month: string;
  total_working_days?: number;
  total_present_days?: number;
  total_absent_days?: number;
  total_late_days?: number;
  total_early_days?: number;
  total_leave_days?: number;
  total_overtime_hours?: number;
  total_actual_hours?: number;
}

interface AttendanceSummarySearchDTO {
  employeeName?: string;
  summary_month?: string;
  departmentName?: string;
}

// ===============================
// Lấy tất cả (phân trang + filter)
// GET /api/attendance-summaries/filter?page=1&pageSize=10&employeeName=...&summaryMonth=...
// ===============================
export const getAllAttendanceSummaryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt((req.query.page as string) || "1");
    const pageSize = parseInt((req.query.pageSize as string) || "10");
    const employeeName = req.query.employeeName as string;
    const summaryMonth = req.query.summaryMonth as string;

    const filter: any = {
      page,
      pageSize,
    };

    if (employeeName) filter.employeeName = employeeName;
    if (summaryMonth) filter.summaryMonth = summaryMonth;

    const result = await getFilteredAttendanceSummaries(filter);

    res.json(
      ResultResponse(true, 200, null, null, result.data, result.totalItems)
    );
  } catch (err: any) {
    next(err);
  }
};

// ===============================
// Tạo mới
// POST /api/attendance-summaries
// ===============================
export const createAttendanceSummaryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const payload: AttendanceSummaryRequest = req.body;

    if (!payload.employee_id || !payload.summary_month) {
      return res
        .status(400)
        .json(
          ResultResponse(
            false,
            400,
            "VALIDATION_ERROR",
            "employee_id và summary_month là bắt buộc"
          )
        );
    }

    const record = await createAttendanceSummary(payload);

    res
      .status(201)
      .json(
        ResultResponse(
          true,
          201,
          null,
          "Tạo tổng hợp chấm công thành công",
          record
        )
      );
  } catch (err: any) {
    next(err);
  }
};

// ===============================
// Cập nhật
// PUT /api/attendance-summaries/:id
// ===============================
export const updateAttendanceSummaryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, "INVALID_ID", "ID không hợp lệ"));
    }

    const payload: Partial<AttendanceSummaryRequest> = req.body;

    const record = await updateAttendanceSummary(id, payload);

    res
      .status(200)
      .json(
        ResultResponse(
          true,
          200,
          null,
          "Cập nhật tổng hợp chấm công thành công",
          record
        )
      );
  } catch (err: any) {
    if (err.message === "Không tìm thấy tổng hợp chấm công") {
      return res
        .status(404)
        .json(ResultResponse(false, 404, "NOT_FOUND", err.message));
    }
    next(err);
  }
};

// ===============================
// Xóa
// DELETE /api/attendance-summaries/:id
// ===============================
export const deleteAttendanceSummaryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, "INVALID_ID", "ID không hợp lệ"));
    }

    await deleteAttendanceSummary(id);

    res
      .status(200)
      .json(
        ResultResponse(true, 200, null, "Xóa tổng hợp chấm công thành công")
      );
  } catch (err: any) {
    if (err.message === "Không tìm thấy tổng hợp chấm công để xóa") {
      return res
        .status(404)
        .json(ResultResponse(false, 404, "NOT_FOUND", err.message));
    }
    next(err);
  }
};

// ===============================
// Lấy theo ID
// GET /api/attendance-summaries/:id
// ===============================
export const getAttendanceSummaryByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, "INVALID_ID", "ID không hợp lệ"));
    }

    const record = await getAttendanceSummaryById(id);

    res
      .status(200)
      .json(
        ResultResponse(
          true,
          200,
          null,
          "Lấy tổng hợp chấm công thành công",
          record
        )
      );
  } catch (err: any) {
    if (err.message === "Không tìm thấy tổng hợp chấm công") {
      return res
        .status(404)
        .json(ResultResponse(false, 404, "NOT_FOUND", err.message));
    }
    next(err);
  }
};

// ===============================
// Lấy theo employee_id và tháng
// GET /api/attendance-summaries/employee/:employeeId/month/:month
// ===============================
export const getAttendanceSummaryByEmployeeAndMonthController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const employeeId = parseInt(req.params.employeeId);
    const month = req.params.month;

    if (isNaN(employeeId)) {
      return res
        .status(400)
        .json(
          ResultResponse(
            false,
            400,
            "INVALID_EMPLOYEE_ID",
            "employeeId không hợp lệ"
          )
        );
    }

    if (!month) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, "MISSING_MONTH", "Tháng là bắt buộc"));
    }

    const record = await getAttendanceSummaryByEmployeeAndMonth(
      employeeId,
      month
    );

    if (!record) {
      return res
        .status(404)
        .json(
          ResultResponse(
            false,
            404,
            "NOT_FOUND",
            "Không tìm thấy tổng hợp chấm công cho nhân viên và tháng này"
          )
        );
    }

    res
      .status(200)
      .json(
        ResultResponse(
          true,
          200,
          null,
          "Lấy tổng hợp chấm công thành công",
          record
        )
      );
  } catch (err: any) {
    next(err);
  }
};

// ===============================
// Lấy thống kê tổng quan theo tháng
// GET /api/attendance-summaries/overview/:month
// ===============================
export const getAttendanceOverviewController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const month = req.params.month;

    if (!month) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, "MISSING_MONTH", "Tháng là bắt buộc"));
    }

    // Gọi service function để lấy thống kê tổng quan
    const filter = { summaryMonth: month };
    const result = await getFilteredAttendanceSummaries(filter);

    // Tính toán thống kê tổng quan
    const overview = {
      period: month,
      totalEmployees: result.totalItems,
      totalPresent: result.data.reduce(
        (sum, item) => sum + (item.total_present_days || 0),
        0
      ),
      totalAbsent: result.data.reduce(
        (sum, item) => sum + (item.total_absent_days || 0),
        0
      ),
      totalLate: result.data.reduce(
        (sum, item) => sum + (item.total_late_days || 0),
        0
      ),
      averageAttendanceRate:
        result.totalItems > 0
          ? Number(
              (
                result.data.reduce((sum, item) => {
                  const totalDays = item.total_working_days || 0;
                  const presentDays = item.total_present_days || 0;
                  return (
                    sum + (totalDays > 0 ? (presentDays / totalDays) * 100 : 0)
                  );
                }, 0) / result.totalItems
              ).toFixed(1)
            )
          : 0,
      totalWorkingHours: Number(
        result.data
          .reduce((sum, item) => sum + (item.total_actual_hours || 0), 0)
          .toFixed(1)
      ),
      totalOvertime: Number(
        result.data
          .reduce((sum, item) => sum + (item.total_overtime_hours || 0), 0)
          .toFixed(1)
      ),
    };

    res
      .status(200)
      .json(
        ResultResponse(
          true,
          200,
          null,
          "Lấy thống kê tổng quan thành công",
          overview
        )
      );
  } catch (err: any) {
    next(err);
  }
};

// ===============================
// Lấy thống kê theo phòng ban
// GET /api/attendance-summaries/department-stats/:month
// ===============================
export const getDepartmentStatsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const month = req.params.month;

    if (!month) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, "MISSING_MONTH", "Tháng là bắt buộc"));
    }

    // Gọi service function để lấy dữ liệu
    const filter = { summaryMonth: month };
    const result = await getFilteredAttendanceSummaries(filter);

    // Tính toán thống kê theo phòng ban
    const departmentStats = result.data.reduce((acc: any[], item: any) => {
      const department = item.employee?.departmentId || "Chưa xác định";
      const existing = acc.find((stat) => stat.department === department);

      if (existing) {
        existing.totalEmployees++;
        existing.presentRate +=
          ((item.total_present_days || 0) / (item.total_working_days || 1)) *
          100;
        existing.absentRate +=
          ((item.total_absent_days || 0) / (item.total_working_days || 1)) *
          100;
        existing.lateRate +=
          ((item.total_late_days || 0) / (item.total_working_days || 1)) * 100;
        existing.averageHours += item.total_actual_hours || 0;
        existing.totalOvertime += item.total_overtime_hours || 0;
      } else {
        acc.push({
          department,
          totalEmployees: 1,
          presentRate:
            ((item.total_present_days || 0) / (item.total_working_days || 1)) *
            100,
          absentRate:
            ((item.total_absent_days || 0) / (item.total_working_days || 1)) *
            100,
          lateRate:
            ((item.total_late_days || 0) / (item.total_working_days || 1)) *
            100,
          averageHours: item.total_actual_hours || 0,
          totalOvertime: item.total_overtime_hours || 0,
        });
      }

      return acc;
    }, []);

    // Tính trung bình
    const finalStats = departmentStats.map((stat) => ({
      ...stat,
      presentRate: Number((stat.presentRate / stat.totalEmployees).toFixed(1)),
      absentRate: Number((stat.absentRate / stat.totalEmployees).toFixed(1)),
      lateRate: Number((stat.lateRate / stat.totalEmployees).toFixed(1)),
      averageHours: Number(
        (stat.averageHours / stat.totalEmployees).toFixed(1)
      ),
    }));

    res
      .status(200)
      .json(
        ResultResponse(
          true,
          200,
          null,
          "Lấy thống kê phòng ban thành công",
          finalStats
        )
      );
  } catch (err: any) {
    next(err);
  }
};
