import { Model } from "sequelize";
import Payroll from "../models/payrollModel";
import PayrollCreationAttributes from "../models/payrollModel";
import PayrollAttributes from "../models/payrollModel";
interface PaginatedResult<T> {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  data: T[];
}

// Lấy danh sách payroll có phân trang
export const getAllPayrolls = async (
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResult<Model>> => {
  try {
    const offset = (page - 1) * pageSize;

    const { count, rows } = await Payroll.findAndCountAll({
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
    throw new Error("Lấy danh sách bảng lương thất bại");
  }
};

// Tạo bảng lương mới
export const createPayroll = async (payroll: PayrollCreationAttributes) => {
  try {
    const newPayroll = await Payroll.create(payroll);
    return newPayroll.get({ plain: true });
  } catch (error: any) {
    console.error(error);
    throw new Error("Tạo bảng lương thất bại");
  }
};

// Cập nhật bảng lương
export const updatePayroll = async (
  payroll: Partial<PayrollAttributes>,
  id: number
) => {
  try {
    const updateData = await Payroll.update(payroll, { where: { id } });
    return updateData;
  } catch (err) {
    console.error(err);
    throw new Error("Cập nhật bảng lương thất bại");
  }
};

// Xóa bảng lương
export const deletePayroll = async (id: number) => {
  try {
    const deletedCount = await Payroll.destroy({ where: { id } });
    return deletedCount;
  } catch (err) {
    console.error(err);
    throw new Error("Xóa bảng lương thất bại");
  }
};

// Lấy bảng lương theo ID
export const getPayrollById = async (id: number) => {
  try {
    const payroll = await Payroll.findByPk(id);
    if (!payroll) {
      throw new Error("Bảng lương không tồn tại");
    }
    return payroll;
  } catch (err) {
    console.error(err);
    throw new Error("Lấy bảng lương thất bại");
  }
};
