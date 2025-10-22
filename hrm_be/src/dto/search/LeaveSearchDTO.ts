export interface LeaveSearchDTO {
  employeeId?: string;
  employeeName?: string;
  leaveType?: string;
  status?: "Pending" | "Approved" | "Rejected";
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
}
