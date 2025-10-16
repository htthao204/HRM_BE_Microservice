export interface AttendanceLogRequest {
  employee_id: number;
  log_time: Date;
  action: "CHECKIN" | "CHECKOUT";
  source?: "DEVICE" | "FACE_RECOGNITION" | "MANUAL";
  status?: "SUCCESS" | "FAILED";
  note?: string;
}

export const createAttendanceLogRequest = ({
  employee_id,
  log_time,
  action,
  source,
  status,
  note,
}: AttendanceLogRequest): AttendanceLogRequest => ({
  employee_id,
  log_time,
  action,
  source,
  status,
  note,
});
