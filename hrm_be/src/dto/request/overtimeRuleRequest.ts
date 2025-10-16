// DTO cho request tạo/quản lý quy tắc tăng ca
export interface OvertimeRuleRequest {
  name: string;
  multiplier: number;
  start_hour: string;
  end_hour: string;
  description?: string;
}

// Factory function để tạo OvertimeRuleRequest
export const createOvertimeRuleRequest = ({
  name,
  multiplier,
  start_hour,
  end_hour,
  description,
}: OvertimeRuleRequest): OvertimeRuleRequest => ({
  name,
  multiplier,
  start_hour,
  end_hour,
  description,
});
