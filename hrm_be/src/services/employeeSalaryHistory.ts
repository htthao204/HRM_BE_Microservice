import EmployeeSalaryHistory from "../models/employeeSalaryHistoryModel";
import EmployeeSalaryHistoryAttributes from "../models/employeeSalaryHistoryModel";
import EmployeeSalaryHistoryCreationAttributes from "../models/employeeSalaryHistoryModel";
import { Model } from "sequelize";
interface PaginatedResult<T> {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  data: T[];
}

// Lấy danh sách có phân trang
export const getAllEmployeeSalaryHistory = async (
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResult<EmployeeSalaryHistory>> => {
  try {
    const offset = (page - 1) * pageSize;
    const { count, rows } = await EmployeeSalaryHistory.findAndCountAll({
      limit: pageSize,
      offset,
      order: [["effective_from", "DESC"]],
    });

    return {
      totalItems: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: page,
      data: rows,
    };
  } catch (err) {
    console.error(err);
    throw new Error("Lấy danh sách lịch sử lương thất bại");
  }
};

// Lấy theo ID
export const getEmployeeSalaryHistoryById = async (id: number) => {
  try {
    const record = await EmployeeSalaryHistory.findByPk(id);
    if (!record) throw new Error("Lịch sử lương không tồn tại");
    return record;
  } catch (err) {
    console.error(err);
    throw new Error("Lấy lịch sử lương thất bại");
  }
};

// Tạo mới
export const createEmployeeSalaryHistory = async (
  data: EmployeeSalaryHistoryCreationAttributes
) => {
  try {
    const newRecord = await EmployeeSalaryHistory.create(data);
    return newRecord.get({ plain: true });
  } catch (err) {
    console.error(err);
    throw new Error("Tạo lịch sử lương thất bại");
  }
};

// Cập nhật
export const updateEmployeeSalaryHistory = async (
  id: number,
  data: Partial<EmployeeSalaryHistoryAttributes>
) => {
  try {
    const [updatedCount] = await EmployeeSalaryHistory.update(data, {
      where: { id },
    });
    if (updatedCount === 0)
      throw new Error("Không tìm thấy lịch sử lương để cập nhật");
    return await EmployeeSalaryHistory.findByPk(id);
  } catch (err) {
    console.error(err);
    throw new Error("Cập nhật lịch sử lương thất bại");
  }
};

// Xóa
export const deleteEmployeeSalaryHistory = async (id: number) => {
  try {
    const deletedCount = await EmployeeSalaryHistory.destroy({ where: { id } });
    if (deletedCount === 0)
      throw new Error("Không tìm thấy lịch sử lương để xóa");
    return deletedCount;
  } catch (err) {
    console.error(err);
    throw new Error("Xóa lịch sử lương thất bại");
  }
};
