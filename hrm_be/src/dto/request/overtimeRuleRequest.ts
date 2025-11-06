export interface OvertimeRuleRequest {
  name: string;

  /** Hệ số nhân cho lương tăng ca (ví dụ: 1.5, 2.0, 3.0, ...) */
  multiplier: number;

  /** Giờ bắt đầu tính tăng ca (định dạng: HH:mm) */
  startTime: string;

  /** Giờ kết thúc tính tăng ca (định dạng: HH:mm) */
  endTime: string;

  /** Các ngày áp dụng (1=Thứ 2, ..., 7=Chủ nhật). Mặc định: "1,2,3,4,5,6,7" */
  applyDays?: string;

  /** Số giờ tối thiểu để tính tăng ca (VD: 1.0) */
  minHours?: number;

  /** Mô tả chi tiết (tùy chọn) */
  description?: string;

  /** Trạng thái kích hoạt (true = hoạt động, false = vô hiệu) */
  isActive?: boolean;
}

/**
 * Factory function để tạo một OvertimeRuleRequest hợp lệ.
 */
export const createOvertimeRuleRequest = (
  data: Partial<OvertimeRuleRequest>
): OvertimeRuleRequest => ({
  name: data.name ?? "",
  multiplier: data.multiplier ?? 1,
  startTime: data.startTime ?? "18:00",
  endTime: data.endTime ?? "22:00",
  applyDays: data.applyDays ?? "1,2,3,4,5,6,7",
  minHours: data.minHours ?? 1.0,
  description: data.description ?? "",
  isActive: data.isActive ?? true,
});
