// DTO cho request tạo/cập nhật SalaryType
export interface SalaryTypeRequest {
  name: string;
  description?: string;
  is_active?: boolean;
}

// Factory function để tạo SalaryTypeRequest
export const createSalaryTypeRequest = ({
  name,
  description,
  is_active = true, // mặc định là true
}: SalaryTypeRequest): SalaryTypeRequest => ({
  name,
  description,
  is_active,
});
