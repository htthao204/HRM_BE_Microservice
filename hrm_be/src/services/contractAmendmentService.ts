// services/contractAmendmentService.ts
import { Op } from "sequelize";
import ContractAmendment from "../models/ContractAmendmentModel";
import EmployeeContract from "../models/EmployeeContractModel";
import EmployeeInformation from "../models/employeeModel";
import ContractType from "../models/ContractTypeModel";

export interface ContractAmendmentFilter {
  contractId?: number;
  amendmentNumber?: string;
  amendmentType?: string;
  status?: string;
  effectiveDateFrom?: string;
  effectiveDateTo?: string;
  employeeName?: string;
  contractNumber?: string;
}

export const getContractAmendmentsByFilter = async (
  page: number = 1,
  pageSize: number = 10,
  filter: ContractAmendmentFilter = {}
) => {
  const offset = (page - 1) * pageSize;
  const where: any = {};

  if (filter.contractId) where.contractId = filter.contractId;
  if (filter.amendmentType) where.amendmentType = filter.amendmentType;
  if (filter.status) where.status = filter.status;

  if (filter.amendmentNumber) {
    where.amendmentNumber = { [Op.like]: `%${filter.amendmentNumber}%` };
  }

  if (filter.effectiveDateFrom || filter.effectiveDateTo) {
    where.effectiveDate = {};
    if (filter.effectiveDateFrom)
      where.effectiveDate[Op.gte] = filter.effectiveDateFrom;
    if (filter.effectiveDateTo)
      where.effectiveDate[Op.lte] = filter.effectiveDateTo;
  }

  const include: any[] = [
    {
      model: EmployeeContract,
      as: "contract",
      attributes: [
        "id",
        "contractNumber",
        "contractName",
        "startDate",
        "endDate",
      ],
      include: [
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
      ],
      where: filter.contractNumber
        ? { contractNumber: { [Op.like]: `%${filter.contractNumber}%` } }
        : undefined,
      required: !!filter.contractNumber,
    },
    {
      model: EmployeeInformation,
      as: "creator",
      attributes: ["id", "employeeCode", "fullName"],
    },
    {
      model: EmployeeInformation,
      as: "approver",
      attributes: ["id", "employeeCode", "fullName"],
    },
  ];

  const { count, rows } = await ContractAmendment.findAndCountAll({
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

export const getContractAmendmentsPaginated = async (
  page = 1,
  pageSize = 10
) => {
  const offset = (page - 1) * pageSize;
  const { count, rows } = await ContractAmendment.findAndCountAll({
    limit: pageSize,
    offset,
    include: [
      {
        model: EmployeeContract,
        as: "contract",
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
        ],
      },
      {
        model: EmployeeInformation,
        as: "creator",
        attributes: ["id", "employeeCode", "fullName"],
      },
      {
        model: EmployeeInformation,
        as: "approver",
        attributes: ["id", "employeeCode", "fullName"],
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

export const getContractAmendmentById = async (id: number) => {
  const amendment = await ContractAmendment.findByPk(id, {
    include: [
      {
        model: EmployeeContract,
        as: "contract",
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
            model: EmployeeInformation.sequelize!.models.Department,
            as: "department",
            attributes: ["id", "name", "code"],
          },
          {
            model: EmployeeInformation.sequelize!.models.Position,
            as: "position",
            attributes: ["id", "name"],
          },
        ],
      },
      {
        model: EmployeeInformation,
        as: "creator",
        attributes: ["id", "employeeCode", "fullName", "email"],
      },
      {
        model: EmployeeInformation,
        as: "approver",
        attributes: ["id", "employeeCode", "fullName", "email"],
      },
    ],
  });
  return amendment?.get({ plain: true }) || null;
};

export const createContractAmendment = async (data: any) => {
  // Generate amendment number if not provided
  if (!data.amendmentNumber) {
    data.amendmentNumber = await generateAmendmentNumber(data.contractId);
  }

  const amendment = await ContractAmendment.create(data);
  return amendment.get({ plain: true });
};

export const updateContractAmendment = async (
  id: number,
  data: Partial<any>
) => {
  const amendment = await ContractAmendment.findByPk(id);
  if (!amendment) throw new Error("Contract amendment not found");
  await amendment.update(data);
  return amendment.get({ plain: true });
};

export const deleteContractAmendment = async (id: number) => {
  const amendment = await ContractAmendment.findByPk(id);
  if (!amendment) throw new Error("Contract amendment not found");
  await amendment.destroy();
  return { message: "Contract amendment deleted successfully" };
};

export const approveContractAmendment = async (
  id: number,
  approvedBy: number,
  comments?: string
) => {
  const amendment = await ContractAmendment.findByPk(id);
  if (!amendment) throw new Error("Contract amendment not found");

  await amendment.update({
    status: "active",
    approvedBy,
    approvedAt: new Date(),
    ...(comments && { comments }),
  });

  return amendment.get({ plain: true });
};

export const getAmendmentsByContractId = async (contractId: number) => {
  const amendments = await ContractAmendment.findAll({
    where: { contractId },
    include: [
      {
        model: EmployeeInformation,
        as: "creator",
        attributes: ["id", "employeeCode", "fullName"],
      },
      {
        model: EmployeeInformation,
        as: "approver",
        attributes: ["id", "employeeCode", "fullName"],
      },
    ],
    order: [["effectiveDate", "DESC"]],
  });

  return amendments.map((amendment) => amendment.get({ plain: true }));
};

export const exportContractAmendments = async (
  filter: ContractAmendmentFilter = {}
) => {
  const where: any = {};

  if (filter.contractId) where.contractId = filter.contractId;
  if (filter.amendmentType) where.amendmentType = filter.amendmentType;
  if (filter.status) where.status = filter.status;

  if (filter.amendmentNumber) {
    where.amendmentNumber = { [Op.like]: `%${filter.amendmentNumber}%` };
  }

  if (filter.effectiveDateFrom || filter.effectiveDateTo) {
    where.effectiveDate = {};
    if (filter.effectiveDateFrom)
      where.effectiveDate[Op.gte] = filter.effectiveDateFrom;
    if (filter.effectiveDateTo)
      where.effectiveDate[Op.lte] = filter.effectiveDateTo;
  }

  const amendments = await ContractAmendment.findAll({
    where,
    include: [
      {
        model: EmployeeContract,
        as: "contract",
        include: [
          {
            model: EmployeeInformation,
            as: "employee",
            attributes: ["employeeCode", "fullName"],
          },
        ],
      },
      {
        model: EmployeeInformation,
        as: "creator",
        attributes: ["fullName"],
      },
      {
        model: EmployeeInformation,
        as: "approver",
        attributes: ["fullName"],
      },
    ],
    order: [["created_at", "DESC"]],
  });

  // Format data for export
  const exportData = amendments.map((amendment: any) => ({
    "Amendment Number": amendment.amendmentNumber,
    "Contract Number": amendment.contract?.contractNumber,
    "Employee Name": amendment.contract?.employee?.fullName,
    "Employee Code": amendment.contract?.employee?.employeeCode,
    "Amendment Type": amendment.amendmentType,
    "Change Description": amendment.changeDescription,
    "Effective Date": amendment.effectiveDate,
    Status: amendment.status,
    "Created By": amendment.creator?.fullName,
    "Approved By": amendment.approver?.fullName,
    "Created Date": amendment.created_at,
  }));

  return exportData;
};

// Helper function to generate amendment number
const generateAmendmentNumber = async (contractId: number): Promise<string> => {
  const contract = await EmployeeContract.findByPk(contractId);
  if (!contract) {
    throw new Error("Contract not found");
  }

  const amendmentCount = await ContractAmendment.count({
    where: { contractId },
  });

  return `${contract.contractNumber}-AMEND-${(amendmentCount + 1)
    .toString()
    .padStart(2, "0")}`;
};
