import sequelize from "../config/db";
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
interface CreateEmployeeInput {
  fullName: string;
  email: string;
  accountId?: number;
  phone?: string;
  hireDate?: Date;
  departmentId?: number;
  positionId?: number;
  avatar?: string;
  privateInfo?: {
    dateOfBirth?: Date;
    gender?: "Male" | "Female" | "Other";
    nationalId?: string;
    emailPrivate?: string;
    phonePrivate?: string;
    countryId?: number;
    address?: string;
  };
  bankAccounts?: {
    bankName?: string;
    accountNumber?: string;
    owner?: string;
    accountType?: string;
  }[];
}

// Lấy danh sách nhân viên phân trang
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

// Tạo nhân viên
export const createEmployee = async (employee: CreateEmployeeInput) => {
  const t = await sequelize.transaction();
  try {
    // Tạo nhân viên
    const newEmployee = await EmployeeInformation.create(
      {
        fullName: employee.fullName,
        email: employee.email,
        accountId: employee.accountId,
        phone: employee.phone,
        hireDate: employee.hireDate,
        departmentId: employee.departmentId,
        positionId: employee.positionId,
        avatar: employee.avatar,
      },
      { transaction: t }
    );

    // Tạo private info nếu có
    if (employee.privateInfo) {
      await EmployeePrivateInformation.create(
        {
          ...employee.privateInfo,
          employeeId: newEmployee.id,
        },
        { transaction: t }
      );
    }

    // Tạo bank accounts nếu có
    if (employee.bankAccounts?.length) {
      const bankData = employee.bankAccounts.map((b) => ({
        ...b,
        employeeId: newEmployee.id,
      }));
      await EmployeeBankAccount.bulkCreate(bankData, { transaction: t });
    }

    await t.commit();
    return newEmployee.get({ plain: true });
  } catch (error) {
    await t.rollback();
    console.error(error);
    throw new Error("Tạo nhân viên thất bại");
  }
};

// ==============================
// Cập nhật nhân viên
// ==============================
export const updateEmployee = async (
  id: number,
  employee: Partial<EmployeeInformation>
) => {
  try {
    const [affectedRows] = await EmployeeInformation.update(employee, {
      where: { id },
    });
    return affectedRows;
  } catch (error: any) {
    console.error(error);
    throw new Error("Cập nhật nhân viên thất bại");
  }
};

// ==============================
// Lấy nhân viên theo ID
// ==============================
export const getEmployeeById = async (id: number) => {
  try {
    const employee = await EmployeeInformation.findOne({
      where: { id, isDelete: false },
      include: [
        { model: EmployeePrivateInformation, as: "privateInfo" },
        { model: EmployeeBankAccount, as: "bankAccounts" },
      ],
    });
    if (!employee) throw new Error("Nhân viên không tồn tại");
    return employee;
  } catch (error: any) {
    console.error(error);
    throw new Error("Lấy nhân viên thất bại");
  }
};

// ==============================
// Lấy danh sách nhân viên theo departmentId
// ==============================
export const getEmployeeByDepartmentId = async (
  departmentId: number
): Promise<EmployeeInformation[]> => {
  try {
    const employees = await EmployeeInformation.findAll({
      where: { departmentId, isDelete: false },
      include: [
        { model: EmployeePrivateInformation, as: "privateInfo" },
        { model: EmployeeBankAccount, as: "bankAccounts" },
      ],
    });
    return employees;
  } catch (error: any) {
    console.error(error);
    throw new Error("Lấy nhân viên theo phòng ban thất bại");
  }
};

export const deleteEmployee = async (id: number) => {
  try {
    const employee = await EmployeeInformation.findByPk(id);
    if (!employee) return 0;
    await employee.destroy(); // sẽ soft delete, tự cập nhật deleted_at
    return 1;
  } catch (error: any) {
    console.error(error);
    throw new Error("Xóa nhân viên thất bại");
  }
};
