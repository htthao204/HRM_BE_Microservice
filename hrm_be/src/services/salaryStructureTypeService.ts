import { SalaryStructureTypeRequest } from "../dto/request/salaryStructureTypeRequest";
import SalaryStructureType from "../models/salaryStructureTypeModel";
import SalaryStructureTypeCreationAttributes from "../models/salaryStructureTypeModel";
interface PaginatedResult<T> {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  data: T[];
}

// 📌 Lấy danh sách SalaryStructureType có phân trang
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
  } catch (error) {
    console.error("Lỗi lấy danh sách SalaryStructureType:", error);
    throw new Error("Lấy danh sách cấu trúc lương thất bại");
  }
};

// 📌 Lấy 1 SalaryStructureType theo ID
export const getSalaryStructureTypeById = async (id: number) => {
  try {
    const type = await SalaryStructureType.findByPk(id);
    if (!type) throw new Error("Cấu trúc lương không tồn tại");
    return type;
  } catch (err) {
    console.error("Lỗi getSalaryStructureTypeById:", err);
    throw new Error("Lấy cấu trúc lương thất bại");
  }
};

// 📌 Tạo mới SalaryStructureType (dùng DTO request)
export const createSalaryStructureType = async (
  data: SalaryStructureTypeRequest
) => {
  try {
    const newType = await SalaryStructureType.create(
      data as SalaryStructureTypeCreationAttributes
    );
    return newType.get({ plain: true });
  } catch (err) {
    console.error("Lỗi createSalaryStructureType:", err);
    throw new Error("Tạo cấu trúc lương thất bại");
  }
};

// 📌 Cập nhật SalaryStructureType
export const updateSalaryStructureType = async (
  id: number,
  data: Partial<SalaryStructureTypeRequest>
) => {
  try {
    const [updatedCount] = await SalaryStructureType.update(data, {
      where: { id },
    });

    if (updatedCount === 0) {
      throw new Error("Không tìm thấy cấu trúc lương để cập nhật");
    }

    const updated = await SalaryStructureType.findByPk(id);
    if (!updated) throw new Error("Không thể lấy dữ liệu sau khi cập nhật");

    return updated;
  } catch (err) {
    console.error("Lỗi updateSalaryStructureType:", err);
    throw new Error("Cập nhật cấu trúc lương thất bại");
  }
};

// 📌 Xóa SalaryStructureType
export const deleteSalaryStructureType = async (id: number) => {
  try {
    const deleted = await SalaryStructureType.destroy({ where: { id } });
    if (deleted === 0) throw new Error("Không tìm thấy cấu trúc lương để xóa");
    return deleted;
  } catch (err) {
    console.error("Lỗi deleteSalaryStructureType:", err);
    throw new Error("Xóa cấu trúc lương thất bại");
  }
};
