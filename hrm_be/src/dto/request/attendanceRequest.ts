// DTO cho request tạo/cập nhật Attendance
export interface AttendanceRequest {
  employee_id: number;
  date: string;
  start_time?: string | null;
  start_status?: "NORMAL" | "FORGOT";
  end_time?: string | null;
  end_status?: "NORMAL" | "FORGOT";
  working_hours?: number;
}

// Factory function để đảm bảo chuẩn đầu vào
export const createAttendanceRequest = ({
  employee_id,
  date,
  start_time,
  start_status = "NORMAL",
  end_time,
  end_status = "NORMAL",
  working_hours = 0,
}: AttendanceRequest): AttendanceRequest => ({
  employee_id,
  date,
  start_time,
  start_status,
  end_time,
  end_status,
  working_hours,
});
