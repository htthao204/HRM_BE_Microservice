// mappers/AttendanceAdjustmentMapper.ts
import { AttendanceAdjustmentResponse } from "../dto/response/attendanceAdjustmentResponse";
import AttendanceAdjustment from "../models/attendanceAdjustmentModel";
import { mapEmployee } from "./EmployeeMapper";

export const mapAttendanceAdjustment = (
  adjustment: AttendanceAdjustment
): AttendanceAdjustmentResponse => {
  return {
    id: adjustment.id,
    employee: mapEmployee(adjustment.employee)!,
    adjustmentDate: adjustment.adjustment_date
      ? new Date(adjustment.adjustment_date).toISOString().split("T")[0]
      : "",
    originalHours: adjustment.original_hours || 0,
    adjustedHours: adjustment.adjusted_hours || 0,
    adjustmentType: adjustment.adjustment_type,
    reason: adjustment.reason,
    requestedBy: mapEmployee(adjustment.requester)!,
    status: adjustment.status || "pending",
    approvedBy: adjustment.approver ? mapEmployee(adjustment.approver) : null,
    approvedAt: adjustment.approved_at
      ? new Date(adjustment.approved_at).toISOString()
      : null,
    createdAt: adjustment.created_at
      ? new Date(adjustment.created_at).toISOString()
      : new Date().toISOString(),
    updatedAt: adjustment.updated_at
      ? adjustment.updated_at.toISOString()
      : new Date().toISOString(),
  };
};
