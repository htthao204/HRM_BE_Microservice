import SalaryType from "../models/salaryTypeModel";
import {
  SalaryTypeRequest,
  createSalaryTypeRequest,
} from "../dto/request/salaryTypeRequest";

interface PaginatedResult<T> {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  data: T[];
}

// ✅ Lấy danh sách SalaryType có phân trang
export const getAllSalaryTypes = async (
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResult<SalaryType>> => {
  try {
    const offset = (page - 1) * pageSize;
    const { count, rows } = await SalaryType.findAndCountAll({
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
    console.error(error);
    throw new Error("Lấy danh sách loại lương thất bại");
  }
};

// ✅ Tạo SalaryType mới
export const createSalaryType = async (data: SalaryTypeRequest) => {
  try {
    const request = createSalaryTypeRequest(data);
    const newItem = await SalaryType.create(request);
    return newItem.get({ plain: true });
  } catch (error) {
    console.error(error);
    throw new Error("Tạo loại lương thất bại");
  }
};

// ✅ Cập nhật SalaryType
export const updateSalaryType = async (
  id: number,
  data: Partial<SalaryTypeRequest>
) => {
  try {
    const request = createSalaryTypeRequest({
      name: data.name ?? "", // tránh undefined khi update
      description: data.description,
      is_active: data.is_active ?? true,
    });

    const [updated] = await SalaryType.update(request, { where: { id } });
    if (updated === 0) throw new Error("Không tìm thấy loại lương để cập nhật");

    const updatedRecord = await SalaryType.findByPk(id);
    return updatedRecord;
  } catch (err) {
    console.error(err);
    throw new Error("Cập nhật loại lương thất bại");
  }
};

// ✅ Xóa SalaryType
export const deleteSalaryType = async (id: number) => {
  try {
    const deletedCount = await SalaryType.destroy({ where: { id } });
    return deletedCount;
  } catch (err) {
    console.error(err);
    throw new Error("Xóa loại lương thất bại");
  }
};

// ✅ Lấy SalaryType theo ID
export const getSalaryTypeById = async (id: number) => {
  try {
    const item = await SalaryType.findByPk(id);
    if (!item) throw new Error("Loại lương không tồn tại");
    return item;
  } catch (err) {
    console.error(err);
    throw new Error("Lấy loại lương thất bại");
  }
};
