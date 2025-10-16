export interface SpecialLeaveRuleRequest {
  name: string;
  description?: string;
  eligibilityCriteria?: string;
  maxDaysPerYear: number;
}

export const createSpecialLeaveRuleRequest = ({
  name,
  description,
  eligibilityCriteria,
  maxDaysPerYear,
}: SpecialLeaveRuleRequest): SpecialLeaveRuleRequest => ({
  name,
  description,
  eligibilityCriteria,
  maxDaysPerYear,
});
