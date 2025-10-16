export interface SalaryStructureTypeRequest {
  name: string;
  description?: string;
  is_taxable?: boolean;
  is_deduction?: boolean;
}

export const createSalaryStructureTypeRequest = ({
  name,
  description,
  is_taxable = false,
  is_deduction = false,
}: SalaryStructureTypeRequest): SalaryStructureTypeRequest => ({
  name,
  description,
  is_taxable,
  is_deduction,
});
