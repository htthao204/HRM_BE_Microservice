import SalaryStructureType from "../models/salaryStructureTypeModel";
import SalaryStructureTypeAttributes from "../models/salaryStructureTypeModel";
import SalaryStructureTypeCreationAttributes from "../models/salaryStructureTypeModel";
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
): Promise<PaginatedResult<SalaryStructureType>> => {
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

// Lấy 1 SalaryStructureType theo ID
export const getSalaryStructureTypeById = async (id: number) => {
  try {
    const type = await SalaryStructureType.findByPk(id);
    if (!type) throw new Error("Cấu trúc lương không tồn tại");
    return type;
  } catch (err) {
    console.error(err);
    throw new Error("Lấy cấu trúc lương thất bại");
  }
};

// Tạo mới SalaryStructureType
export const createSalaryStructureType = async (
  data: SalaryStructureTypeCreationAttributes
) => {
  try {
    const newType = await SalaryStructureType.create(data);
    return newType.get({ plain: true });
  } catch (err) {
    console.error(err);
    throw new Error("Tạo cấu trúc lương thất bại");
  }
};

// Cập nhật SalaryStructureType
export const updateSalaryStructureType = async (
  id: number,
  data: Partial<SalaryStructureTypeAttributes>
) => {
  try {
    const [updatedCount] = await SalaryStructureType.update(data, {
      where: { id },
    });
    if (updatedCount === 0)
      throw new Error("Không tìm thấy cấu trúc lương để cập nhật");
    return await SalaryStructureType.findByPk(id);
  } catch (err) {
    console.error(err);
    throw new Error("Cập nhật cấu trúc lương thất bại");
  }
};

// Xóa SalaryStructureType
export const deleteSalaryStructureType = async (id: number) => {
  try {
    const deleted = await SalaryStructureType.destroy({ where: { id } });
    if (deleted === 0) throw new Error("Không tìm thấy cấu trúc lương để xóa");
    return deleted;
  } catch (err) {
    console.error(err);
    throw new Error("Xóa cấu trúc lương thất bại");
  }
};
