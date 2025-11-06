export interface EmployeeInformationResponse {
  id: number;
  employeeCode: string;
  fullName: string;
  email?: string;
  phone?: string;
  departmentId?: number;
  positionId?: number;
  hireDate?: string;
  accountId?: number;
  avatar?: string;
  status?: "active" | "inactive" | "suspended" | "terminated";
  maritalStatus?: "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED";
  numberOfDependents?: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}
