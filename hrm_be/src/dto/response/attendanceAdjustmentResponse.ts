import { EmployeeInformationResponse } from "./employeeResponse";

export interface AttendanceAdjustmentResponse {
  id: number;
  employee: EmployeeInformationResponse;
  adjustmentDate: string;
  originalHours: number;
  adjustedHours: number;
  adjustmentType: string;
  reason: string;
  requestedBy: EmployeeInformationResponse;
  status: string;
  approvedBy?: EmployeeInformationResponse | null;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
