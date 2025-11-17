// services/attendanceAdjustmentService.ts
import { Op, Transaction } from "sequelize";
import AttendanceAdjustment from "../models/attendanceAdjustmentModel";
import EmployeeInformation from "../models/employeeModel";
import Attendance from "../models/attendanceModel";
import AttendanceApproval from "../models/attendanceApprovalModel";
import AttendanceSummary from "../models/attendanceSummaryModel";
import Payroll from "../models/payrollModel";
import sequelize from "../config/db";
import {
  AttendanceAdjustmentCreateRequest,
  AttendanceAdjustmentUpdateRequest,
} from "../dto/request/attendanceAdjustmentRequest";
import { AttendanceAdjustmentResponse } from "../dto/response/attendanceAdjustmentResponse";

// Helper function để xử lý date an toàn
const safeToISOString = (date: any): string | undefined => {
  if (!date) return undefined;
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    return isNaN(dateObj.getTime()) ? undefined : dateObj.toISOString();
  } catch {
    return undefined;
  }
};

// Helper function để lấy date string an toàn (YYYY-MM-DD)
const safeToDateString = (date: any): string => {
  if (!date) return new Date().toISOString().split("T")[0];
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    return isNaN(dateObj.getTime())
      ? new Date().toISOString().split("T")[0]
      : dateObj.toISOString().split("T")[0];
  } catch {
    return new Date().toISOString().split("T")[0];
  }
};

// Hàm map trực tiếp không dùng mapper
const mapToResponse = (adjustment: any): AttendanceAdjustmentResponse => {
  return {
    id: adjustment.id,
    employeeId: adjustment.employee_id,
    adjustmentDate: safeToDateString(adjustment.adjustment_date),
    originalHours: parseFloat(adjustment.original_hours?.toString() || "0"),
    adjustedHours: parseFloat(adjustment.adjusted_hours?.toString() || "0"),
    adjustmentType: adjustment.adjustment_type,
    reason: adjustment.reason,
    requestedBy: adjustment.requested_by,
    status: adjustment.status || "pending",
    approvedBy: adjustment.approved_by || undefined,
    approvedAt: safeToISOString(adjustment.approved_at),
    checkinTime: safeToISOString(adjustment.checkin_time),
    checkoutTime: safeToISOString(adjustment.checkout_time),
    reviewNote: adjustment.review_note || undefined,
    createdAt:
      safeToISOString(adjustment.created_at) || new Date().toISOString(),
    updatedAt:
      safeToISOString(adjustment.updated_at) || new Date().toISOString(),

    // Related data
    employee: adjustment.employee
      ? {
          id: adjustment.employee.id,
          employeeCode: adjustment.employee.employee_code,
          fullName: adjustment.employee.full_name,
          department: adjustment.employee.department?.name,
          position: adjustment.employee.position?.name,
        }
      : undefined,

    requester: adjustment.requester
      ? {
          id: adjustment.requester.id,
          employeeCode: adjustment.requester.employee_code,
          fullName: adjustment.requester.full_name,
        }
      : undefined,

    approver: adjustment.approver
      ? {
          id: adjustment.approver.id,
          employeeCode: adjustment.approver.employee_code,
          fullName: adjustment.approver.full_name,
        }
      : undefined,
  };
};

// ==============================
// Lấy tất cả attendance adjustments
// ==============================
export const getAllAttendanceAdjustments = async (): Promise<
  AttendanceAdjustmentResponse[]
> => {
  const adjustments = await AttendanceAdjustment.findAll({
    include: [
      { model: EmployeeInformation, as: "employee" },
      { model: EmployeeInformation, as: "requester" },
      { model: EmployeeInformation, as: "approver" },
    ],
    order: [["adjustment_date", "DESC"]],
  });

  return adjustments.map(mapToResponse);
};

// ==============================
// Lấy 1 adjustment theo ID
// ==============================
export const getAttendanceAdjustmentById = async (
  id: number
): Promise<AttendanceAdjustmentResponse | null> => {
  const adjustment = await AttendanceAdjustment.findByPk(id, {
    include: [
      { model: EmployeeInformation, as: "employee" },
      { model: EmployeeInformation, as: "requester" },
      { model: EmployeeInformation, as: "approver" },
    ],
  });

  if (!adjustment) return null;
  return mapToResponse(adjustment);
};

// ==============================
// Pagination: get page
// ==============================
export const getAttendanceAdjustmentsPage = async (
  page: number = 1,
  limit: number = 10,
  filter?: {
    employeeId?: number;
    status?: "pending" | "approved" | "rejected";
    startDate?: string;
    endDate?: string;
    adjustmentType?: string;
  }
): Promise<{
  data: AttendanceAdjustmentResponse[];
  total: number;
  page: number;
  limit: number;
}> => {
  const offset = (page - 1) * limit;
  const where: any = {};

  if (filter) {
    if (filter.employeeId) where.employee_id = filter.employeeId;
    if (filter.status) where.status = filter.status;
    if (filter.adjustmentType) where.adjustment_type = filter.adjustmentType;
    if (filter.startDate && filter.endDate) {
      where.adjustment_date = {
        [Op.between]: [filter.startDate, filter.endDate],
      };
    } else if (filter.startDate) {
      where.adjustment_date = { [Op.gte]: filter.startDate };
    } else if (filter.endDate) {
      where.adjustment_date = { [Op.lte]: filter.endDate };
    }
  }

  const { rows, count } = await AttendanceAdjustment.findAndCountAll({
    where,
    include: [
      { model: EmployeeInformation, as: "employee" },
      { model: EmployeeInformation, as: "requester" },
      { model: EmployeeInformation, as: "approver" },
    ],
    order: [["adjustment_date", "DESC"]],
    limit,
    offset,
  });

  return {
    data: rows.map(mapToResponse),
    total: count,
    page,
    limit,
  };
};

// ==============================
// Thêm mới attendance adjustment
// ==============================
export const createAttendanceAdjustment = async (
  data: AttendanceAdjustmentCreateRequest
): Promise<AttendanceAdjustmentResponse> => {
  if (!data.employeeId) {
    throw new Error("employeeId là bắt buộc khi tạo adjustment.");
  }

  const adjustment = await AttendanceAdjustment.create({
    employee_id: data.employeeId,
    adjustment_date: data.adjustmentDate,
    original_hours: data.originalHours || 0,
    adjusted_hours: data.adjustedHours || 0,
    adjustment_type: data.adjustmentType,
    reason: data.reason,
    requested_by: data.requestedBy,
    checkin_time: data.checkinTime,
    checkout_time: data.checkoutTime,
    status: "pending",
  });

  await adjustment.reload({
    include: [
      { model: EmployeeInformation, as: "employee" },
      { model: EmployeeInformation, as: "requester" },
      { model: EmployeeInformation, as: "approver" },
    ],
  });

  return mapToResponse(adjustment);
};

// ==============================
// Cập nhật attendance adjustment
// ==============================
export const updateAttendanceAdjustment = async (
  id: number,
  data: AttendanceAdjustmentUpdateRequest
): Promise<AttendanceAdjustmentResponse | null> => {
  const adjustment = await AttendanceAdjustment.findByPk(id, {
    include: [
      { model: EmployeeInformation, as: "employee" },
      { model: EmployeeInformation, as: "requester" },
      { model: EmployeeInformation, as: "approver" },
    ],
  });

  if (!adjustment) return null;

  // Chỉ cho phép cập nhật nếu status là pending
  if (adjustment.status !== "pending") {
    throw new Error(
      "Chỉ có thể cập nhật adjustment đang ở trạng thái chờ duyệt"
    );
  }

  await adjustment.update(data);

  return mapToResponse(adjustment);
};

// ==============================
// Xóa attendance adjustment
// ==============================
export const deleteAttendanceAdjustment = async (
  id: number
): Promise<number> => {
  const adjustment = await AttendanceAdjustment.findByPk(id);

  // Chỉ cho phép xóa nếu status là pending
  if (adjustment && adjustment.status !== "pending") {
    throw new Error("Chỉ có thể xóa adjustment đang ở trạng thái chờ duyệt");
  }

  return await AttendanceAdjustment.destroy({
    where: {
      id,
      status: "pending", // Chỉ xóa được những cái đang pending
    },
  });
};

// ==============================
// Xóa nhiều attendance adjustments
// ==============================
export const deleteManyAttendanceAdjustments = async (
  ids: number[]
): Promise<number> => {
  return await AttendanceAdjustment.destroy({
    where: {
      id: { [Op.in]: ids },
      status: "pending", // Chỉ xóa được những cái đang pending
    },
  });
};

// ==============================
// Phê duyệt đơn giản (chỉ cập nhật status)
// ==============================
export const approveAdjustment = async (
  id: number,
  approverId: number,
  reviewNote?: string
): Promise<AttendanceAdjustmentResponse | null> => {
  const adjustment = await AttendanceAdjustment.findByPk(id, {
    include: [
      { model: EmployeeInformation, as: "employee" },
      { model: EmployeeInformation, as: "requester" },
      { model: EmployeeInformation, as: "approver" },
    ],
  });

  if (!adjustment || adjustment.status !== "pending") {
    return null;
  }

  await adjustment.update({
    status: "approved",
    approved_by: approverId,
    approved_at: new Date(),
    review_note: reviewNote,
  });

  return mapToResponse(adjustment);
};

// ==============================
// Từ chối adjustment
// ==============================
export const rejectAdjustment = async (
  id: number,
  approverId: number,
  reviewNote?: string
): Promise<AttendanceAdjustmentResponse | null> => {
  const adjustment = await AttendanceAdjustment.findByPk(id, {
    include: [
      { model: EmployeeInformation, as: "employee" },
      { model: EmployeeInformation, as: "requester" },
      { model: EmployeeInformation, as: "approver" },
    ],
  });

  if (!adjustment || adjustment.status !== "pending") {
    return null;
  }

  await adjustment.update({
    status: "rejected",
    approved_by: approverId,
    approved_at: new Date(),
    review_note: reviewNote,
  });

  return mapToResponse(adjustment);
};

// ==============================
// Phê duyệt nhiều đơn giản
// ==============================
export const approveManyAdjustments = async (
  ids: number[],
  approverId: number,
  reviewNote?: string
): Promise<number> => {
  const [updatedCount] = await AttendanceAdjustment.update(
    {
      status: "approved",
      approved_by: approverId,
      approved_at: new Date(),
      review_note: reviewNote,
    },
    {
      where: {
        id: { [Op.in]: ids },
        status: "pending",
      },
    }
  );

  return updatedCount;
};

// ==============================
// Từ chối nhiều
// ==============================
export const rejectManyAdjustments = async (
  ids: number[],
  approverId: number,
  reviewNote?: string
): Promise<number> => {
  const [updatedCount] = await AttendanceAdjustment.update(
    {
      status: "rejected",
      approved_by: approverId,
      approved_at: new Date(),
      review_note: reviewNote,
    },
    {
      where: {
        id: { [Op.in]: ids },
        status: "pending",
      },
    }
  );

  return updatedCount;
};

// ==============================
// 🔄 Phê duyệt adjustment với transaction (cập nhật tất cả bảng liên quan)
// ==============================
export const approveAdjustmentWithTransaction = async (
  id: number,
  approverId: number,
  reviewNote?: string
): Promise<AttendanceAdjustmentResponse | null> => {
  const transaction = await sequelize.transaction();

  try {
    // Lấy adjustment với lock để tránh race condition
    const adjustment = await AttendanceAdjustment.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (
      !adjustment ||
      adjustment.status !== "pending" ||
      !adjustment.employee_id
    ) {
      await transaction.rollback();
      return null;
    }

    // Cập nhật status adjustment
    await adjustment.update(
      {
        status: "approved",
        approved_by: approverId,
        approved_at: new Date(),
        review_note: reviewNote,
      },
      { transaction }
    );

    // Cập nhật các bảng liên quan
    await updateAttendanceForAdjustment(adjustment, transaction);
    await updateAttendanceSummaryForAdjustment(adjustment, transaction);
    await updatePayrollForAdjustment(adjustment, transaction);
    await createAttendanceApprovalLog(adjustment, approverId, transaction);

    await transaction.commit();

    // Reload để lấy dữ liệu mới nhất
    await adjustment.reload({
      include: [
        { model: EmployeeInformation, as: "employee" },
        { model: EmployeeInformation, as: "requester" },
        { model: EmployeeInformation, as: "approver" },
      ],
    });

    return mapToResponse(adjustment);
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Lỗi khi phê duyệt adjustment với transaction:", error);
    throw error;
  }
};

// ==============================
// 🔄 Phê duyệt nhiều adjustments với transaction
// ==============================
export const approveManyAdjustmentsWithTransaction = async (
  ids: number[],
  approverId: number,
  reviewNote?: string
): Promise<number> => {
  let successCount = 0;

  for (const id of ids) {
    try {
      const result = await approveAdjustmentWithTransaction(
        id,
        approverId,
        reviewNote
      );
      if (result) successCount++;
    } catch (error) {
      console.error(`❌ Lỗi khi phê duyệt adjustment ${id}:`, error);
      // Tiếp tục với các adjustment khác
    }
  }

  return successCount;
};

// ==============================
// HÀM HỖ TRỢ - CẬP NHẬT CÁC BẢNG LIÊN QUAN
// ==============================

/**
 * Cập nhật bảng Attendance
 */
const updateAttendanceForAdjustment = async (
  adjustment: AttendanceAdjustment,
  transaction: Transaction
): Promise<void> => {
  const {
    employee_id,
    adjustment_date,
    adjusted_hours,
    checkin_time,
    checkout_time,
  } = adjustment;

  if (!employee_id || !adjustment_date) {
    throw new Error("Thiếu thông tin employee_id hoặc adjustment_date");
  }

  const adjustedHoursNum = parseFloat(adjusted_hours?.toString() || "0");

  // Tìm hoặc tạo attendance record
  let attendance = await Attendance.findOne({
    where: {
      employee_id,
      date: adjustment_date,
    },
    transaction,
  });

  if (attendance) {
    // Cập nhật attendance hiện có
    await attendance.update(
      {
        actual_hours: adjustedHoursNum,
        checkin_time: checkin_time || attendance.checkin_time,
        checkout_time: checkout_time || attendance.checkout_time,
        status: calculateAttendanceStatus(adjustedHoursNum),
        updated_at: new Date(),
      },
      { transaction }
    );
  } else {
    // Tạo mới attendance record
    await Attendance.create(
      {
        employee_id,
        date: adjustment_date,
        actual_hours: adjustedHoursNum,
        checkin_time: checkin_time,
        checkout_time: checkout_time,
        expected_hours: 8, // Giả định 8 giờ/ngày
        status: calculateAttendanceStatus(adjustedHoursNum),
        created_at: new Date(),
        updated_at: new Date(),
      },
      { transaction }
    );
  }
};

/**
 * Cập nhật bảng AttendanceSummary
 */
const updateAttendanceSummaryForAdjustment = async (
  adjustment: AttendanceAdjustment,
  transaction: Transaction
): Promise<void> => {
  const { employee_id, adjustment_date, original_hours, adjusted_hours } =
    adjustment;

  if (!employee_id || !adjustment_date) {
    throw new Error("Thiếu thông tin employee_id hoặc adjustment_date");
  }

  // Sửa lỗi: Xử lý adjustment_date an toàn
  const adjustmentDate = new Date(adjustment_date);
  const summaryMonth = adjustmentDate.toISOString().substring(0, 7); // "YYYY-MM"

  const originalHoursNum = parseFloat(original_hours?.toString() || "0");
  const adjustedHoursNum = parseFloat(adjusted_hours?.toString() || "0");
  const hoursDiff = adjustedHoursNum - originalHoursNum;

  if (hoursDiff === 0) return; // Không có thay đổi

  // Tìm summary hiện có
  let summary = await AttendanceSummary.findOne({
    where: {
      employee_id,
      summary_month: summaryMonth,
    },
    transaction,
  });

  if (summary) {
    // Cập nhật summary hiện có
    const currentActualHours = parseFloat(
      summary.total_actual_hours?.toString() || "0"
    );

    await summary.update(
      {
        total_actual_hours: currentActualHours + hoursDiff,
        total_present_days: calculatePresentDays(
          summary,
          originalHoursNum,
          adjustedHoursNum
        ),
        total_absent_days: calculateAbsentDays(
          summary,
          originalHoursNum,
          adjustedHoursNum
        ),
        updated_at: new Date(),
      },
      { transaction }
    );
  } else {
    // Tạo mới summary
    await AttendanceSummary.create(
      {
        employee_id,
        summary_month: summaryMonth,
        total_actual_hours: adjustedHoursNum,
        total_present_days: adjustedHoursNum >= 4 ? 1 : 0,
        total_absent_days: adjustedHoursNum >= 4 ? 0 : 1,
        total_working_days: 1,
        total_late_days: 0,
        total_early_days: 0,
        total_leave_days: 0,
        total_overtime_hours: 0,
        created_at: new Date(),
        updated_at: new Date(),
      },
      { transaction }
    );
  }
};

/**
 * Cập nhật bảng Payroll
 */
const updatePayrollForAdjustment = async (
  adjustment: AttendanceAdjustment,
  transaction: Transaction
): Promise<void> => {
  const { employee_id, adjustment_date, adjusted_hours, original_hours } =
    adjustment;

  if (!employee_id || !adjustment_date) {
    return; // Không bắt buộc phải có payroll
  }

  // Sửa lỗi: Xử lý adjustment_date an toàn
  const adjustmentDate = new Date(adjustment_date);
  const payrollPeriod = adjustmentDate.toISOString().substring(0, 7); // "YYYY-MM"

  const hoursDiff =
    parseFloat(adjusted_hours?.toString() || "0") -
    parseFloat(original_hours?.toString() || "0");

  if (hoursDiff === 0) return; // Không có thay đổi

  // Tìm payroll hiện có
  let payroll = await Payroll.findOne({
    where: {
      employee_id,
      period: payrollPeriod,
    },
    transaction,
  });

  if (payroll) {
    const baseSalary = parseFloat(payroll.base_salary?.toString() || "0");
    const hourlyRate = baseSalary > 0 ? baseSalary / 22 / 8 : 0; // Giả định 22 ngày làm việc, 8h/ngày
    const salaryDiff = hoursDiff * hourlyRate;

    const currentActualHours = parseFloat(
      payroll.total_actual_hours?.toString() || "0"
    );
    const currentGrossSalary = parseFloat(
      payroll.gross_salary?.toString() || "0"
    );
    const currentNetSalary = parseFloat(payroll.net_salary?.toString() || "0");

    await payroll.update(
      {
        total_actual_hours: currentActualHours + hoursDiff,
        gross_salary: currentGrossSalary + salaryDiff,
        net_salary: currentNetSalary + salaryDiff,
        updated_at: new Date(),
      },
      { transaction }
    );
  }
  // Nếu không có payroll, không cần tạo mới - sẽ được tính khi chạy payroll
};

/**
 * Tạo log approval
 */
const createAttendanceApprovalLog = async (
  adjustment: AttendanceAdjustment,
  approverId: number,
  transaction: Transaction
): Promise<void> => {
  const { employee_id, adjustment_date } = adjustment;

  if (!employee_id || !adjustment_date) return;

  // Tìm attendance record tương ứng
  const attendance = await Attendance.findOne({
    where: {
      employee_id,
      date: adjustment_date,
    },
    transaction,
  });

  if (!attendance) return;

  await AttendanceApproval.create(
    {
      attendance_id: attendance.id,
      approver_id: approverId,
      approval_type: "adjustment",
      old_data: {
        actual_hours: adjustment.original_hours,
        status: calculateAttendanceStatus(
          parseFloat(adjustment.original_hours?.toString() || "0")
        ),
      },
      new_data: {
        actual_hours: adjustment.adjusted_hours,
        status: calculateAttendanceStatus(
          parseFloat(adjustment.adjusted_hours?.toString() || "0")
        ),
      },
      approval_status: "approved",
      request_date: adjustment.created_at,
      approval_date: new Date(),
      comments: `Điều chỉnh giờ làm: ${adjustment.original_hours} → ${adjustment.adjusted_hours} giờ - Lý do: ${adjustment.reason}`,
    },
    { transaction }
  );
};

// ==============================
// UTILITY FUNCTIONS
// ==============================

const calculateAttendanceStatus = (hours: number): string => {
  if (hours >= 8) return "present";
  if (hours >= 4) return "half_day";
  return "absent";
};

const calculatePresentDays = (
  summary: AttendanceSummary,
  originalHours: number,
  adjustedHours: number
): number => {
  let days = summary.total_present_days || 0;

  // Nếu từ absent (dưới 4h) thành present/half_day (trên 4h)
  if (originalHours < 4 && adjustedHours >= 4) {
    return days + 1;
  }
  // Nếu từ present/half_day thành absent
  if (originalHours >= 4 && adjustedHours < 4) {
    return days - 1;
  }

  return days;
};

const calculateAbsentDays = (
  summary: AttendanceSummary,
  originalHours: number,
  adjustedHours: number
): number => {
  let days = summary.total_absent_days || 0;

  // Nếu từ absent thành present/half_day
  if (originalHours < 4 && adjustedHours >= 4) {
    return Math.max(0, days - 1);
  }
  // Nếu từ present/half_day thành absent
  if (originalHours >= 4 && adjustedHours < 4) {
    return days + 1;
  }

  return days;
};
