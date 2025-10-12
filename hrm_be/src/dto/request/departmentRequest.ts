// types/account.ts
export interface DepartmentRequest {
  name: string;
  managerId?: number;
}

// Factory function để tạo AccountRequest
export const createDepartmentRequest = ({
  name,
  managerId,
}: DepartmentRequest): DepartmentRequest => ({
  name,
  managerId,
});
