// mappers/EmployeeMapper.ts
import EmployeeInformation from "../models/employeeModel";
import { EmployeeInformationResponse } from "../dto/response/employeeResponse";

export const mapEmployee = (
  employee: EmployeeInformation | null | undefined
): EmployeeInformationResponse | null => {
  if (!employee) return null;

  return {
    id: employee.id,
    employeeCode: employee.employeeCode,
    fullName: employee.fullName,
    email: employee.email || undefined,
    phone: employee.phone || undefined,
    departmentId: employee.departmentId,
    positionId: employee.positionId,
    hireDate: employee.hireDate
      ? employee.hireDate.toISOString().split("T")[0]
      : undefined,
    accountId: employee.accountId,
    avatar: employee.avatar,
    status: employee.status,
    maritalStatus: employee.maritalStatus,
    numberOfDependents: employee.numberOfDependents,
    createdAt: employee.createdAt.toISOString(),
    updatedAt: employee.updatedAt.toISOString(),
  };
};
