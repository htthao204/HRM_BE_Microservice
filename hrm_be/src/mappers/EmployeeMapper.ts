// mappers/EmployeeMapper.ts
import EmployeeInformation from "../models/employeeModel";
import { EmployeeInformationResponse } from "../dto/response/employeeResponse";

export const mapEmployee = (
  employee: EmployeeInformation | null | undefined
): EmployeeInformationResponse | null => {
  if (!employee) return null;

  const toIsoDate = (value: any) => {
    if (!value) return undefined;
    try {
      const d = new Date(value);
      return isNaN(d.getTime()) ? String(value) : d.toISOString().split("T")[0];
    } catch {
      return String(value);
    }
  };

  const toIsoDateTime = (value: any) => {
    if (!value) return undefined;
    try {
      const d = new Date(value);
      return isNaN(d.getTime()) ? String(value) : d.toISOString();
    } catch {
      return String(value);
    }
  };

  return {
    id: employee.id,
    employeeCode: employee.employeeCode,
    fullName: employee.fullName,
    email: employee.email || undefined,
    phone: employee.phone || undefined,
    departmentId: employee.departmentId,
    positionId: employee.positionId,
    hireDate: toIsoDate(employee.hireDate),
    accountId: employee.accountId,
    avatar: employee.avatar,
    status: employee.status,
    maritalStatus: employee.maritalStatus,
    numberOfDependents: employee.numberOfDependents,
    createdAt: toIsoDateTime(employee.createdAt),
    updatedAt: toIsoDateTime(employee.updatedAt),
  };
};
