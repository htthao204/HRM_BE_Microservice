// dtos/attendanceAdjustmentRequest.ts
export interface AttendanceAdjustmentCreateRequest {
  employeeId: number;
  adjustmentDate: string; // YYYY-MM-DD
  originalHours?: number;
  adjustedHours?: number;
  adjustmentType:
    | "missing_checkin"
    | "missing_checkout"
    | "time_correction"
    | "manual_entry";
  reason: string;
  requestedBy: number;
}

export interface AttendanceAdjustmentUpdateRequest {
  adjustmentDate?: string;
  originalHours?: number;
  adjustedHours?: number;
  adjustmentType?:
    | "missing_checkin"
    | "missing_checkout"
    | "time_correction"
    | "manual_entry";
  reason?: string;
  status?: "pending" | "approved" | "rejected";
  approvedBy?: number;
  approvedAt?: string;
}
