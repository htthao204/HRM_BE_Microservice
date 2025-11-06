// services/employeeContractService.ts
import { Op } from "sequelize";
import EmployeeContract from "../models/EmployeeContractModel";
import EmployeeInformation from "../models/employeeModel";
import Department from "../models/departmentModel";
import Position from "../models/positionModel";
import ContractType from "../models/ContractTypeModel";

export interface EmployeeContractFilter {
  employeeId?: number;
  employeeName?: string;
  contractNumber?: string;
  contractTypeId?: number;
  departmentId?: number;
  status?: string;
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
}

export const getEmployeeContractsByFilter = async (
  page: number = 1,
  pageSize: number = 10,
  filter: EmployeeContractFilter = {}
) => {
  const offset = (page - 1) * pageSize;
  const where: any = {};

  if (filter.employeeId) where.employeeId = filter.employeeId;
  if (filter.contractTypeId) where.contractTypeId = filter.contractTypeId;
  if (filter.departmentId) where.departmentId = filter.departmentId;
  if (filter.status) where.status = filter.status;

  if (filter.contractNumber) {
    where.contractNumber = { [Op.like]: `%${filter.contractNumber}%` };
  }

  if (filter.startDateFrom || filter.startDateTo) {
    where.startDate = {};
    if (filter.startDateFrom) where.startDate[Op.gte] = filter.startDateFrom;
    if (filter.startDateTo) where.startDate[Op.lte] = filter.startDateTo;
  }

  if (filter.endDateFrom || filter.endDateTo) {
    where.endDate = {};
    if (filter.endDateFrom) where.endDate[Op.gte] = filter.endDateFrom;
    if (filter.endDateTo) where.endDate[Op.lte] = filter.endDateTo;
  }

  const include: any[] = [
    {
      model: EmployeeInformation,
      as: "employee",
      attributes: ["id", "employeeCode", "fullName", "email"],
      where: filter.employeeName
        ? {
            [Op.or]: [
              { fullName: { [Op.like]: `%${filter.employeeName}%` } },
              { employeeCode: { [Op.like]: `%${filter.employeeName}%` } },
            ],
          }
        : undefined,
      required: !!filter.employeeName,
    },
    {
      model: ContractType,
      as: "contractType",
      attributes: ["id", "name", "code"],
    },
    {
      model: Department,
      as: "department",
      attributes: ["id", "name"],
    },
    {
      model: Position,
      as: "position",
      attributes: ["id", "name"],
    },
    {
      model: EmployeeInformation,
      as: "companySigner",
      attributes: ["id", "fullName"],
    },
  ];

  const { count, rows } = await EmployeeContract.findAndCountAll({
    where,
    include,
    limit: pageSize,
    offset,
    order: [["created_at", "DESC"]],
    distinct: true,
  });

  return {
    totalItems: count,
    totalPages: Math.ceil(count / pageSize),
    currentPage: page,
    data: rows.map((r) => r.get({ plain: true })),
  };
};

export const getEmployeeContractsPaginated = async (
  page = 1,
  pageSize = 10
) => {
  const offset = (page - 1) * pageSize;
  const { count, rows } = await EmployeeContract.findAndCountAll({
    limit: pageSize,
    offset,
    include: [
      {
        model: EmployeeInformation,
        as: "employee",
        attributes: ["id", "employeeCode", "fullName"],
      },
      {
        model: ContractType,
        as: "contractType",
        attributes: ["id", "name", "code"],
      },
      {
        model: Department,
        as: "department",
        attributes: ["id", "name"],
      },
      {
        model: Position,
        as: "position",
        attributes: ["id", "name"],
      },
    ],
    order: [["created_at", "DESC"]],
    distinct: true,
  });

  return {
    totalItems: count,
    totalPages: Math.ceil(count / pageSize),
    currentPage: page,
    data: rows.map((r) => r.get({ plain: true })),
  };
};

export const getEmployeeContractById = async (id: number) => {
  const contract = await EmployeeContract.findByPk(id, {
    include: [
      {
        model: EmployeeInformation,
        as: "employee",
        attributes: ["id", "employeeCode", "fullName", "email", "phone"],
      },
      {
        model: ContractType,
        as: "contractType",
        attributes: ["id", "name", "code", "description"],
      },
      {
        model: Department,
        as: "department",
        attributes: ["id", "name", "code"],
      },
      {
        model: Position,
        as: "position",
        attributes: ["id", "name", "description"],
      },
      {
        model: EmployeeInformation,
        as: "companySigner",
        attributes: ["id", "fullName", "employeeCode"],
      },
      {
        model: EmployeeInformation,
        as: "creator",
        attributes: ["id", "fullName"],
      },
      {
        model: EmployeeInformation,
        as: "updater",
        attributes: ["id", "fullName"],
      },
    ],
  });
  return contract?.get({ plain: true }) || null;
};

export const createEmployeeContract = async (data: any) => {
  // Generate contract number if not provided
  if (!data.contractNumber) {
    data.contractNumber = await generateContractNumber();
  }

  const contract = await EmployeeContract.create(data);
  return contract.get({ plain: true });
};

export const updateEmployeeContract = async (
  id: number,
  data: Partial<any>
) => {
  const contract = await EmployeeContract.findByPk(id);
  if (!contract) throw new Error("Employee contract not found");
  await contract.update(data);
  return contract.get({ plain: true });
};

export const deleteEmployeeContract = async (id: number) => {
  const contract = await EmployeeContract.findByPk(id);
  if (!contract) throw new Error("Employee contract not found");
  await contract.destroy();
  return { message: "Employee contract deleted successfully" };
};

export const getContractsByEmployeeId = async (employeeId: number) => {
  const contracts = await EmployeeContract.findAll({
    where: { employeeId },
    include: [
      {
        model: ContractType,
        as: "contractType",
        attributes: ["id", "name", "code"],
      },
      {
        model: Department,
        as: "department",
        attributes: ["id", "name"],
      },
      {
        model: Position,
        as: "position",
        attributes: ["id", "name"],
      },
    ],
    order: [["startDate", "DESC"]],
  });

  return contracts.map((contract) => contract.get({ plain: true }));
};

export const updateContractStatus = async (
  id: number,
  status: string,
  updatedBy: number
) => {
  const contract = await EmployeeContract.findByPk(id);
  if (!contract) throw new Error("Employee contract not found");

  await contract.update({
    status,
    updatedBy,
    ...(status === "terminated" && { terminationDate: new Date() }),
  });

  return contract.get({ plain: true });
};

export const signContract = async (
  id: number,
  signedBy: "employee" | "company",
  signerId: number
) => {
  const contract = await EmployeeContract.findByPk(id);
  if (!contract) throw new Error("Employee contract not found");

  const updateData: any = {};
  if (signedBy === "employee") {
    updateData.signedByEmployee = true;
    updateData.employeeSignedAt = new Date();
  } else {
    updateData.signedByCompany = true;
    updateData.companySignedAt = new Date();
    updateData.companySignerId = signerId;
  }

  // If both signed, update status to active
  if (
    (signedBy === "employee" && contract.signedByCompany) ||
    (signedBy === "company" && contract.signedByEmployee)
  ) {
    updateData.status = "active";
  }

  await contract.update(updateData);
  return contract.get({ plain: true });
};

export const getExpiringContracts = async (days: number = 30) => {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + days);

  const contracts = await EmployeeContract.findAll({
    where: {
      endDate: {
        [Op.between]: [new Date(), targetDate],
      },
      status: "active",
    },
    include: [
      {
        model: EmployeeInformation,
        as: "employee",
        attributes: ["id", "employeeCode", "fullName", "email"],
      },
      {
        model: Department,
        as: "department",
        attributes: ["name"],
      },
    ],
    order: [["endDate", "ASC"]],
  });

  return contracts.map((contract) => contract.get({ plain: true }));
};

export const exportEmployeeContracts = async (
  filter: EmployeeContractFilter = {}
) => {
  const where: any = {};

  if (filter.employeeId) where.employeeId = filter.employeeId;
  if (filter.contractTypeId) where.contractTypeId = filter.contractTypeId;
  if (filter.departmentId) where.departmentId = filter.departmentId;
  if (filter.status) where.status = filter.status;

  if (filter.contractNumber) {
    where.contractNumber = { [Op.like]: `%${filter.contractNumber}%` };
  }

  const contracts = await EmployeeContract.findAll({
    where,
    include: [
      {
        model: EmployeeInformation,
        as: "employee",
        attributes: ["employeeCode", "fullName"],
      },
      {
        model: ContractType,
        as: "contractType",
        attributes: ["name"],
      },
      {
        model: Department,
        as: "department",
        attributes: ["name"],
      },
      {
        model: Position,
        as: "position",
        attributes: ["name"],
      },
    ],
    order: [["created_at", "DESC"]],
  });

  const exportData = contracts.map((contract: any) => ({
    "Contract Number": contract.contractNumber,
    "Employee Code": contract.employee?.employeeCode,
    "Employee Name": contract.employee?.fullName,
    "Contract Type": contract.contractType?.name,
    Department: contract.department?.name,
    Position: contract.position?.name,
    "Start Date": contract.startDate,
    "End Date": contract.endDate,
    "Base Salary": contract.baseSalary,
    Status: contract.status,
    "Signed by Employee": contract.signedByEmployee ? "Yes" : "No",
    "Signed by Company": contract.signedByCompany ? "Yes" : "No",
    "Created Date": contract.created_at,
  }));

  return exportData;
};

// Helper function to generate contract number
const generateContractNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `CONTRACT-${year}-`;

  const lastContract = await EmployeeContract.findOne({
    where: {
      contractNumber: {
        [Op.like]: `${prefix}%`,
      },
    },
    order: [["contractNumber", "DESC"]],
  });

  let sequence = 1;
  if (lastContract) {
    const lastNumber = lastContract.contractNumber.split("-").pop();
    sequence = parseInt(lastNumber || "0") + 1;
  }

  return `${prefix}${sequence.toString().padStart(4, "0")}`;
};
