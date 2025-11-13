// src/dto/request/taxRequest.ts
export interface TaxConfigRequest {
  effective_date: string;
  personal_deduction: number;
  dependent_deduction: number;
  region_min_salary: number;
  description?: string;
  is_active: boolean;
}

export interface TaxBracketRequest {
  min_amount: number;
  max_amount?: number | null;
  tax_rate: number;
  deduction_amount?: number;
  effective_year: number;
  description?: string;
}

export const createTaxConfigRequest = (
  data: Partial<TaxConfigRequest>
): TaxConfigRequest => ({
  effective_date: data.effective_date!,
  personal_deduction: data.personal_deduction!,
  dependent_deduction: data.dependent_deduction!,
  region_min_salary: data.region_min_salary!,
  description: data.description || "",
  is_active: data.is_active ?? true,
});

export const createTaxBracketRequest = (
  data: Partial<TaxBracketRequest>
): TaxBracketRequest => ({
  min_amount: data.min_amount!,
  max_amount: data.max_amount ?? null,
  tax_rate: data.tax_rate!,
  deduction_amount: data.deduction_amount ?? 0,
  effective_year: data.effective_year!,
  description: data.description || "",
});
