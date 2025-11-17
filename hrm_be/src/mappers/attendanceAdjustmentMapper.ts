// mappers/attendanceAdjustmentMapper.ts
import AttendanceAdjustment from "../models/attendanceAdjustmentModel";
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
const safeToDateString = (date: any): string | undefined => {
  if (!date) return undefined;
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    return isNaN(dateObj.getTime())
      ? undefined
      : dateObj.toISOString().split("T")[0];
  } catch {
    return undefined;
  }
};

export const mapAttendanceAdjustment = (
  adjustment: AttendanceAdjustment
): AttendanceAdjustmentResponse => {
  // Debug để xem kiểu dữ liệu thực tế
  console.log("adjustment_date type:", typeof adjustment.adjustment_date);
  console.log("adjustment_date value:", adjustment.adjustment_date);

  return {
    id: adjustment.id,
    employeeId: adjustment.employee_id,

    // SỬA LỖI Ở ĐÂY: Xử lý adjustment_date an toàn
    adjustmentDate:
      safeToDateString(adjustment.adjustment_date) ||
      new Date().toISOString().split("T")[0], // Fallback

    originalHours: parseFloat(adjustment.original_hours?.toString() || "0"),
    adjustedHours: parseFloat(adjustment.adjusted_hours?.toString() || "0"),
    adjustmentType: adjustment.adjustment_type,
    reason: adjustment.reason,
    requestedBy: adjustment.requested_by,
    status: adjustment.status || "pending",

    // SỬA: Xử lý các trường date khác an toàn
    approvedBy: adjustment.approved_by || undefined,
    approvedAt: safeToISOString(adjustment.approved_at),
    checkinTime: safeToISOString(adjustment.checkin_time),
    checkoutTime: safeToISOString(adjustment.checkout_time),
    reviewNote: adjustment.review_note || undefined,

    // SỬA: Xử lý created_at và updated_at an toàn
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
