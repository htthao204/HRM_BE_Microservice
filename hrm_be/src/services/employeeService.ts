import {
  EmployeeBankAccount,
  EmployeeInformation,
  EmployeePrivateInformation,
} from "../models/employeeModel";

interface PaginatedResult<T> {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  data: T[];
}

export const getAllEmployeeInfor = async (
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResult<EmployeeInformation>> => {
  try {
    const offset = (page - 1) * pageSize;

    const { count, rows } = await EmployeeInformation.findAndCountAll({
      include: [
        { model: EmployeePrivateInformation, as: "privateInfo" },
        { model: EmployeeBankAccount, as: "bankAccounts" },
      ],
      limit: pageSize,
      offset,
      order: [["created_at", "DESC"]],
    });

    return {
      totalItems: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: page,
      data: rows,
    };
  } catch (error: any) {
    console.error(error);
    throw new Error("Lấy danh sách nhân viên thất bại");
  }
};
