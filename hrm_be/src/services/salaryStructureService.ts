import SalaryStructureType from "../models/salaryStructureTypeModel";
import SalaryStructureTypeAttributes from "../models/salaryStructureTypeModel";
import SalaryStructureTypeCreationAttributes from "../models/salaryStructureTypeModel";
import { Model } from "sequelize";

interface PaginatedResult<T> {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  data: T[];
}

// Lấy danh sách SalaryStructureType có phân trang
export const getAllSalaryStructureTypes = async (
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResult<Model>> => {
  try {
    const offset = (page - 1) * pageSize;

    const { count, rows } = await SalaryStructureType.findAndCountAll({
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
    throw new Error("Lấy danh sách cấu trúc lương thất bại");
  }
};

// Tạo SalaryStructureType mới
export const createSalaryStructureType = async (
  salaryStructureType: SalaryStructureTypeCreationAttributes
) => {
  try {
    const newItem = await SalaryStructureType.create(salaryStructureType);
    return newItem.get({ plain: true });
  } catch (error: any) {
    console.error(error);
    throw new Error("Tạo cấu trúc lương thất bại");
  }
};

// Cập nhật SalaryStructureType
export const updateSalaryStructureType = async (
  salaryStructureType: Partial<SalaryStructureTypeAttributes>,
  id: number
) => {
  try {
    const updateData = await SalaryStructureType.update(salaryStructureType, {
      where: { id },
    });
    return updateData;
  } catch (err) {
    console.error(err);
    throw new Error("Cập nhật cấu trúc lương thất bại");
  }
};

// Xóa SalaryStructureType
export const deleteSalaryStructureType = async (id: number) => {
  try {
    const deletedCount = await SalaryStructureType.destroy({ where: { id } });
    return deletedCount;
  } catch (err) {
    console.error(err);
    throw new Error("Xóa cấu trúc lương thất bại");
  }
};

// Lấy SalaryStructureType theo ID
export const getSalaryStructureTypeById = async (id: number) => {
  try {
    const item = await SalaryStructureType.findByPk(id);
    if (!item) {
      throw new Error("Cấu trúc lương không tồn tại");
    }
    return item;
  } catch (err) {
    console.error(err);
    throw new Error("Lấy cấu trúc lương thất bại");
  }
};
