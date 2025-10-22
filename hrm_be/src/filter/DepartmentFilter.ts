import { Op } from "sequelize";
import { Department, EmployeeInformation } from "../models";
import { DepartmentSearchDTO } from "../dto/search/DepartmentSearchDTO";

export async function filterDepartments(
  dto: DepartmentSearchDTO,
  page?: number,
  pageSize?: number
) {
  const offset = page && pageSize ? (page - 1) * pageSize : undefined;
  const where: any = {};

  if (dto.name) where.name = { [Op.iLike]: `%${dto.name.trim()}%` };
  if (dto.cid) where.cid = { [Op.iLike]: `%${dto.cid.trim()}%` };
  if (dto.location) where.location = { [Op.iLike]: `%${dto.location.trim()}%` };
  if (dto.disContinue !== undefined) where.disContinue = dto.disContinue;

  return Department.findAndCountAll({
    where,
    include: dto.managerName
      ? [
          {
            model: EmployeeInformation,
            as: "manager",
            where: { name: { [Op.iLike]: `%${dto.managerName.trim()}%` } },
            required: false,
          },
        ]
      : [],
    limit: pageSize,
    offset,
    order: [["created_at", "DESC"]],
  });
}
