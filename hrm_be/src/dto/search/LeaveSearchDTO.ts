export interface LeaveSearchDTO {
  employeeId?: number;
  employeeName?: string;
  leaveTypeId?: number;
  leaveTypeName?: string;
  reason?: string;
  status?: "Pending" | "Approved" | "Rejected";
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
}
