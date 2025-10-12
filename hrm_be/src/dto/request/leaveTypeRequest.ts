export interface LeaveTypeRequest {
  name: string;
  description?: string;
  defaultDays: number;
}

// Factory function
export const createLeaveTypeRequest = ({
  name,
  description,
  defaultDays = 0,
}: LeaveTypeRequest): LeaveTypeRequest => ({
  name,
  description,
  defaultDays,
});
