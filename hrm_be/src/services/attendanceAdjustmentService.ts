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

// Interface cho Attendance Adjustment
interface IAttendanceAdjustment {
  id?: number;
  employee_id: number;
  adjustment_date: Date | string;
  original_hours: number;
  adjusted_hours: number;
  adjustment_type: string;
  reason: string;
  requested_by: number;
  status: string;
  approved_by?: number;
  approved_at?: Date;
  checkin_time?: Date | string;
  checkout_time?: Date | string;
  review_note?: string;
  created_at?: Date;
  updated_at?: Date;

  // Associations
  employee?: any;
  requester?: any;
  approver?: any;
}

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

// Helper function để xử lý time an toàn
const safeToTimeString = (time: any): string | undefined => {
  if (!time) return undefined;
  try {
    if (typeof time === "string") {
      // Nếu đã là string dạng HH:MM:SS
      if (time.match(/^\d{2}:\d{2}:\d{2}$/)) return time;
      // Nếu là ISO string, extract time part
      if (time.includes("T")) return time.split("T")[1].split(".")[0];
    }
    if (time instanceof Date) {
      return time.toTimeString().split(" ")[0];
    }
    return undefined;
  } catch {
    return undefined;
  }
};

// Hàm map trực tiếp không dùng mapper
const mapToResponse = (adjustment: any): AttendanceAdjustmentResponse => {
  // 🎯 XỬ LÝ KHI THIẾU DỮ LIỆU EMPLOYEE
  const employeeData = adjustment.employee || {};
  const requesterData = adjustment.requester || {};
  const approverData = adjustment.approver || {};

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

    // 🎯 RELATED DATA VỚI FALLBACK
    employee: {
      id: employeeData.id || adjustment.employee_id,
      employeeCode: employeeData.employee_code || `NV${adjustment.employee_id}`,
      fullName: employeeData.full_name || `Nhân viên ${adjustment.employee_id}`,
      department:
        employeeData.department?.name ||
        `Phòng ban ${employeeData.department_id}`,
      position: employeeData.position?.name,
    },

    requester: {
      id: requesterData.id || adjustment.requested_by,
      employeeCode:
        requesterData.employee_code || `NV${adjustment.requested_by}`,
      fullName:
        requesterData.full_name || `Người yêu cầu ${adjustment.requested_by}`,
    },

    approver: adjustment.approved_by
      ? {
          id: approverData.id || adjustment.approved_by,
          employeeCode:
            approverData.employee_code || `NV${adjustment.approved_by}`,
          fullName:
            approverData.full_name || `Người duyệt ${adjustment.approved_by}`,
        }
      : undefined,
  };
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
  summary: any,
  originalHours: number,
  adjustedHours: number
): number => {
  const currentPresentDays = summary.total_present_days || 0;

  if (originalHours < 4 && adjustedHours >= 4) {
    return currentPresentDays + 1;
  }
  if (originalHours >= 4 && adjustedHours < 4) {
    return Math.max(0, currentPresentDays - 1);
  }
  return currentPresentDays;
};

const calculateAbsentDays = (
  summary: any,
  originalHours: number,
  adjustedHours: number
): number => {
  const currentAbsentDays = summary.total_absent_days || 0;

  if (originalHours < 4 && adjustedHours >= 4) {
    return Math.max(0, currentAbsentDays - 1);
  }
  if (originalHours >= 4 && adjustedHours < 4) {
    return currentAbsentDays + 1;
  }
  return currentAbsentDays;
};

// ==============================
// HÀM HỖ TRỢ - CẬP NHẬT CÁC BẢNG LIÊN QUAN
// ==============================

/**
 * Cập nhật bảng Attendance
 */
const updateAttendanceForAdjustment = async (
  adjustment: IAttendanceAdjustment,
  transaction: Transaction
): Promise<void> => {
  const {
    employee_id,
    adjustment_date,
    adjusted_hours,
    checkin_time,
    checkout_time,
    reason,
  } = adjustment;

  if (!employee_id || !adjustment_date) {
    throw new Error("Thiếu thông tin employee_id hoặc adjustment_date");
  }

  const adjustedHoursNum = parseFloat(adjusted_hours?.toString() || "0");

  // 🎯 QUAN TRỌNG: Xử lý date an toàn
  const adjustmentDate = safeToDateString(adjustment_date);

  // Tìm hoặc tạo attendance record
  let attendance = await Attendance.findOne({
    where: {
      employee_id,
      date: adjustmentDate,
    },
    transaction,
  });

  const notes = `Điều chỉnh: ${reason}. Giờ: ${adjustment.original_hours} → ${adjusted_hours}`;

  if (attendance) {
    await attendance.update(
      {
        actual_hours: adjustedHoursNum,
        checkin_time: safeToTimeString(checkin_time) || attendance.checkin_time,
        checkout_time:
          safeToTimeString(checkout_time) || attendance.checkout_time,
        status: calculateAttendanceStatus(adjustedHoursNum),
        notes: attendance.notes ? `${attendance.notes}; ${notes}` : notes,
        updated_at: new Date(),
      },
      { transaction }
    );
  } else {
    await Attendance.create(
      {
        employee_id,
        date: adjustmentDate,
        actual_hours: adjustedHoursNum,
        checkin_time: safeToTimeString(checkin_time),
        checkout_time: safeToTimeString(checkout_time),
        expected_hours: 8,
        status: calculateAttendanceStatus(adjustedHoursNum),
        notes: notes,
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
  adjustment: IAttendanceAdjustment,
  transaction: Transaction
): Promise<void> => {
  const { employee_id, adjustment_date, original_hours, adjusted_hours } =
    adjustment;

  if (!employee_id || !adjustment_date) return;

  // 🎯 SỬA LỖI: Xử lý date an toàn
  const adjustmentDate = new Date(adjustment_date);
  if (isNaN(adjustmentDate.getTime())) return;

  const summaryMonth = adjustmentDate.toISOString().substring(0, 7);

  const originalHoursNum = parseFloat(original_hours?.toString() || "0");
  const adjustedHoursNum = parseFloat(adjusted_hours?.toString() || "0");

  // Tìm summary hiện có
  let summary = await AttendanceSummary.findOne({
    where: {
      employee_id,
      summary_month: summaryMonth,
    },
    transaction,
  });

  if (summary) {
    const currentActualHours = parseFloat(
      summary.total_actual_hours?.toString() || "0"
    );
    const hoursDiff = adjustedHoursNum - originalHoursNum;

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
  }
  // Không tạo mới summary ở đây - để hệ thống tự tạo
};

/**
 * Cập nhật bảng Payroll
 */
const updatePayrollForAdjustment = async (
  adjustment: IAttendanceAdjustment,
  transaction: Transaction
): Promise<void> => {
  const { employee_id, adjustment_date, adjusted_hours, original_hours } =
    adjustment;

  if (!employee_id || !adjustment_date) {
    return; // Không bắt buộc phải có payroll
  }

  // Sửa lỗi: Xử lý adjustment_date an toàn
  const adjustmentDate = new Date(adjustment_date);
  if (isNaN(adjustmentDate.getTime())) return;

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
  adjustment: IAttendanceAdjustment,
  approverId: number,
  transaction: Transaction
): Promise<void> => {
  const {
    employee_id,
    adjustment_date,
    original_hours,
    adjusted_hours,
    reason,
  } = adjustment;

  if (!employee_id || !adjustment_date) return;

  // Tìm attendance record tương ứng
  const attendance = await Attendance.findOne({
    where: {
      employee_id,
      date: safeToDateString(adjustment_date),
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
        actual_hours: original_hours,
        status: calculateAttendanceStatus(
          parseFloat(original_hours?.toString() || "0")
        ),
      },
      new_data: {
        actual_hours: adjusted_hours,
        status: calculateAttendanceStatus(
          parseFloat(adjusted_hours?.toString() || "0")
        ),
      },
      approval_status: "approved",
      request_date: adjustment.created_at,
      approval_date: new Date(),
      comments: `Điều chỉnh giờ làm: ${original_hours} → ${adjusted_hours} giờ - Lý do: ${reason}`,
    },
    { transaction }
  );
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
      {
        model: EmployeeInformation,
        as: "employee",
        attributes: ["id", "employee_code", "full_name", "department_id"],
      },
      {
        model: EmployeeInformation,
        as: "requester",
        attributes: ["id", "employee_code", "full_name"],
      },
      {
        model: EmployeeInformation,
        as: "approver",
        attributes: ["id", "employee_code", "full_name"],
      },
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
// ROLLBACK FUNCTION (Emergency)
// ==============================
export const rollbackAdjustment = async (
  adjustmentId: number
): Promise<boolean> => {
  const transaction = await sequelize.transaction();

  try {
    const adjustment = await AttendanceAdjustment.findByPk(adjustmentId, {
      transaction,
    });

    if (!adjustment || adjustment.status !== "approved") {
      await transaction.rollback();
      return false;
    }

    // Revert adjustment status
    await adjustment.update(
      {
        status: "pending",
        approved_by: null,
        approved_at: null,
        review_note: "Đã rollback - cần xử lý lại",
      },
      { transaction }
    );

    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Lỗi khi rollback adjustment:", error);
    return false;
  }
};

// ==============================
// THỐNG KÊ
// ==============================
export const getAdjustmentStats = async (): Promise<{
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}> => {
  const stats = await AttendanceAdjustment.findAll({
    attributes: [
      "status",
      [sequelize.fn("COUNT", sequelize.col("id")), "count"],
    ],
    group: ["status"],
    raw: true,
  });

  const result = {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  };

  stats.forEach((stat) => {
    const count = parseInt(stat.count as string);
    result.total += count;
    result[stat.status as keyof typeof result] = count;
  });

  return result;
};
