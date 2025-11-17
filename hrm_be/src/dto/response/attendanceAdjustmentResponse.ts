// dto/response/attendanceAdjustmentResponse.ts
export interface AttendanceAdjustmentResponse {
  id: number;
  employeeId: number;
  adjustmentDate: string;
  originalHours: number;
  adjustedHours: number;
  adjustmentType: string;
  reason: string;
  requestedBy: number;
  status: string;
  approvedBy?: number;
  approvedAt?: string;
  checkinTime?: string;
  checkoutTime?: string;
  reviewNote?: string;
  createdAt: string;
  updatedAt: string;

  // Related data
  employee?: {
    id: number;
    employeeCode: string;
    fullName: string;
    department?: string;
    position?: string;
  };
  requester?: {
    id: number;
    employeeCode: string;
    fullName: string;
  };
  approver?: {
    id: number;
    employeeCode: string;
    fullName: string;
  };
}
