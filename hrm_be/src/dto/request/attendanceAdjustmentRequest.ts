// dto/request/attendanceAdjustmentRequest.ts
export interface AttendanceAdjustmentCreateRequest {
  employeeId: number;
  adjustmentDate: string;
  originalHours?: number;
  adjustedHours?: number;
  adjustmentType:
    | "missing_checkin"
    | "missing_checkout"
    | "time_correction"
    | "manual_entry";
  reason: string;
  requestedBy: number;
  checkinTime?: string;
  checkoutTime?: string;
}

export interface AttendanceAdjustmentUpdateRequest {
  originalHours?: number;
  adjustedHours?: number;
  adjustmentType?:
    | "missing_checkin"
    | "missing_checkout"
    | "time_correction"
    | "manual_entry";
  reason?: string;
  checkinTime?: string;
  checkoutTime?: string;
  reviewNote?: string;
}
