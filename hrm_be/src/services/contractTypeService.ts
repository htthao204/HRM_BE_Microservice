// services/contractTypeService.ts
import { Op } from "sequelize";
import ContractType from "../models/ContractTypeModel";

export interface ContractTypeFilter {
  name?: string;
  code?: string;
  isActive?: boolean;
  isRenewable?: boolean;
}

export const getContractTypesByFilter = async (
  page: number = 1,
  pageSize: number = 10,
  filter: ContractTypeFilter = {}
) => {
  const offset = (page - 1) * pageSize;
  const where: any = {};

  if (filter.name) {
    where.name = { [Op.like]: `%${filter.name}%` };
  }

  if (filter.code) {
    where.code = { [Op.like]: `%${filter.code}%` };
  }

  if (filter.isActive !== undefined) {
    where.isActive = filter.isActive;
  }

  if (filter.isRenewable !== undefined) {
    where.isRenewable = filter.isRenewable;
  }

  const { count, rows } = await ContractType.findAndCountAll({
    where,
    limit: pageSize,
    offset,
    order: [["name", "ASC"]],
    distinct: true,
  });

  return {
    totalItems: count,
    totalPages: Math.ceil(count / pageSize),
    currentPage: page,
    data: rows.map((r) => r.get({ plain: true })),
  };
};

export const getContractTypesPaginated = async (page = 1, pageSize = 10) => {
  const offset = (page - 1) * pageSize;
  const { count, rows } = await ContractType.findAndCountAll({
    limit: pageSize,
    offset,
    order: [["name", "ASC"]],
    distinct: true,
  });

  return {
    totalItems: count,
    totalPages: Math.ceil(count / pageSize),
    currentPage: page,
    data: rows.map((r) => r.get({ plain: true })),
  };
};

export const getContractTypeById = async (id: number) => {
  const contractType = await ContractType.findByPk(id);
  return contractType?.get({ plain: true }) || null;
};

export const createContractType = async (data: any) => {
  const contractType = await ContractType.create(data);
  return contractType.get({ plain: true });
};

export const updateContractType = async (id: number, data: Partial<any>) => {
  const contractType = await ContractType.findByPk(id);
  if (!contractType) throw new Error("Contract type not found");
  await contractType.update(data);
  return contractType.get({ plain: true });
};

export const deleteContractType = async (id: number) => {
  const contractType = await ContractType.findByPk(id);
  if (!contractType) throw new Error("Contract type not found");
  await contractType.destroy();
  return { message: "Contract type deleted successfully" };
};

export const getAllActiveContractTypes = async () => {
  const contractTypes = await ContractType.findAll({
    where: { isActive: true },
    attributes: ["id", "name", "code", "durationMonths"],
    order: [["name", "ASC"]],
  });

  return contractTypes.map((type) => type.get({ plain: true }));
};

export const exportContractTypes = async (filter: ContractTypeFilter = {}) => {
  const where: any = {};

  if (filter.name) where.name = { [Op.like]: `%${filter.name}%` };
  if (filter.code) where.code = { [Op.like]: `%${filter.code}%` };
  if (filter.isActive !== undefined) where.isActive = filter.isActive;
  if (filter.isRenewable !== undefined) where.isRenewable = filter.isRenewable;

  const contractTypes = await ContractType.findAll({
    where,
    order: [["name", "ASC"]],
  });

  const exportData = contractTypes.map((type: any) => ({
    "Contract Type ID": type.id,
    Name: type.name,
    Code: type.code,
    Description: type.description,
    "Duration (Months)": type.durationMonths,
    "Is Renewable": type.isRenewable ? "Yes" : "No",
    "Is Active": type.isActive ? "Yes" : "No",
    "Created Date": type.created_at,
  }));

  return exportData;
};
