// types/account.ts
export interface WorkShiftRequest {
  name: string;
  startTime: string;
  endTime: string;
  totalHours: number;
}
// Factory function để tạo AccountRequest
export const createWorkShiftRequest = ({
  name,
  startTime,
  endTime,
  totalHours,
}: WorkShiftRequest): WorkShiftRequest => ({
  name,
  startTime,
  endTime,
  totalHours,
});
