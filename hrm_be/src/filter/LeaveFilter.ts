// services/leaveService.ts
import { Op } from "sequelize";
import { Leave } from "../models/leaveModel";
import { EmployeeInformation } from "../models/employeeModel";
import { LeaveType } from "../models/leaveTypeModel";
import { LeaveSearchDTO } from "../dto/search/LeaveSearchDTO";

export async function filterLeaves(
  dto: LeaveSearchDTO,
  page?: number,
  pageSize?: number
) {
  const offset = page && pageSize ? (page - 1) * pageSize : undefined;
  const where: any = {};

  // Filter theo status
  if (dto.status) where.status = dto.status;

  // Filter startDate range
  if (dto.startDateFrom || dto.startDateTo) {
    where.startDate = {};
    if (dto.startDateFrom) where.startDate[Op.gte] = dto.startDateFrom;
    if (dto.startDateTo) where.startDate[Op.lte] = dto.startDateTo;
  }

  // Filter endDate range
  if (dto.endDateFrom || dto.endDateTo) {
    where.endDate = {};
    if (dto.endDateFrom) where.endDate[Op.gte] = dto.endDateFrom;
    if (dto.endDateTo) where.endDate[Op.lte] = dto.endDateTo;
  }

  // Filter theo employeeId nếu có
  if (dto.employeeId) where.employeeId = dto.employeeId;

  // Include quan hệ với employee và leaveType
  const include: any[] = [
    {
      model: EmployeeInformation,
      as: "employee",
      where: dto.employeeName
        ? { name: { [Op.iLike]: `%${dto.employeeName.trim()}%` } }
        : undefined,
      required: !!dto.employeeName, // inner join nếu filter theo name
    },
    {
      model: LeaveType,
      as: "leaveType",
      where: dto.leaveType
        ? { name: { [Op.iLike]: `%${dto.leaveType.trim()}%` } }
        : undefined,
      required: !!dto.leaveType,
    },
  ];

  const result = await Leave.findAndCountAll({
    where,
    include,
    limit: pageSize,
    offset,
    order: [["startDate", "DESC"]],
  });

  return {
    totalItems: result.count,
    totalPages: pageSize ? Math.ceil(result.count / pageSize) : 1,
    currentPage: page || 1,
    data: result.rows,
  };
}
