import EmployeePositionHistory from "../models/employeePositionHistoryModel";
import EmployeePositionHistoryAttributes from "../models/employeePositionHistoryModel";
import EmployeePositionHistoryCreationAttributes from "../models/employeePositionHistoryModel";
import { Model } from "sequelize";
interface PaginatedResult<T> {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  data: T[];
}

// Lấy danh sách lịch sử vị trí nhân viên có phân trang
export const getAllEmployeePositionHistory = async (
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResult<EmployeePositionHistory>> => {
  try {
    const offset = (page - 1) * pageSize;
    const { count, rows } = await EmployeePositionHistory.findAndCountAll({
      limit: pageSize,
      offset,
      order: [["start_date", "DESC"]],
    });

    return {
      totalItems: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: page,
      data: rows,
    };
  } catch (err) {
    console.error(err);
    throw new Error("Lấy danh sách lịch sử vị trí nhân viên thất bại");
  }
};

// Lấy theo ID
export const getEmployeePositionHistoryById = async (id: number) => {
  try {
    const record = await EmployeePositionHistory.findByPk(id);
    if (!record) throw new Error("Lịch sử vị trí nhân viên không tồn tại");
    return record;
  } catch (err) {
    console.error(err);
    throw new Error("Lấy lịch sử vị trí nhân viên thất bại");
  }
};

// Tạo mới
export const createEmployeePositionHistory = async (
  data: EmployeePositionHistoryCreationAttributes
) => {
  try {
    const newRecord = await EmployeePositionHistory.create(data);
    return newRecord.get({ plain: true });
  } catch (err) {
    console.error(err);
    throw new Error("Tạo lịch sử vị trí nhân viên thất bại");
  }
};

// Cập nhật
export const updateEmployeePositionHistory = async (
  id: number,
  data: Partial<EmployeePositionHistoryAttributes>
) => {
  try {
    const [updatedCount] = await EmployeePositionHistory.update(data, {
      where: { id },
    });
    if (updatedCount === 0)
      throw new Error("Không tìm thấy lịch sử vị trí để cập nhật");
    return await EmployeePositionHistory.findByPk(id);
  } catch (err) {
    console.error(err);
    throw new Error("Cập nhật lịch sử vị trí nhân viên thất bại");
  }
};

// Xóa
export const deleteEmployeePositionHistory = async (id: number) => {
  try {
    const deletedCount = await EmployeePositionHistory.destroy({
      where: { id },
    });
    if (deletedCount === 0)
      throw new Error("Không tìm thấy lịch sử vị trí để xóa");
    return deletedCount;
  } catch (err) {
    console.error(err);
    throw new Error("Xóa lịch sử vị trí nhân viên thất bại");
  }
};
