import {
  SpecialLeaveRule,
  SpecialLeaveRuleAttributes,
  SpecialLeaveRuleCreationAttributes,
} from "../models/specialLeaveRuleModel";

interface PaginatedResult<T> {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  data: T[];
}

// Lấy danh sách special leave rules có phân trang
export const getAllSpecialLeaveRules = async (
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResult<SpecialLeaveRule>> => {
  try {
    const offset = (page - 1) * pageSize;
    const { count, rows } = await SpecialLeaveRule.findAndCountAll({
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
  } catch (err) {
    console.error(err);
    throw new Error("Lấy danh sách quy định nghỉ đặc biệt thất bại");
  }
};

// Lấy theo ID
export const getSpecialLeaveRuleById = async (id: number) => {
  try {
    const rule = await SpecialLeaveRule.findByPk(id);
    if (!rule) throw new Error("Quy định nghỉ đặc biệt không tồn tại");
    return rule;
  } catch (err) {
    console.error(err);
    throw new Error("Lấy quy định nghỉ đặc biệt thất bại");
  }
};

// Tạo mới
export const createSpecialLeaveRule = async (
  data: SpecialLeaveRuleCreationAttributes
) => {
  try {
    const newRule = await SpecialLeaveRule.create(data);
    return newRule.get({ plain: true });
  } catch (err) {
    console.error(err);
    throw new Error("Tạo quy định nghỉ đặc biệt thất bại");
  }
};

// Cập nhật
export const updateSpecialLeaveRule = async (
  id: number,
  data: Partial<SpecialLeaveRuleAttributes>
) => {
  try {
    const [updatedCount] = await SpecialLeaveRule.update(data, {
      where: { id },
    });
    if (updatedCount === 0)
      throw new Error("Không tìm thấy quy định để cập nhật");
    return await SpecialLeaveRule.findByPk(id);
  } catch (err) {
    console.error(err);
    throw new Error("Cập nhật quy định nghỉ đặc biệt thất bại");
  }
};

// Xóa
export const deleteSpecialLeaveRule = async (id: number) => {
  try {
    const deletedCount = await SpecialLeaveRule.destroy({ where: { id } });
    if (deletedCount === 0) throw new Error("Không tìm thấy quy định để xóa");
    return deletedCount;
  } catch (err) {
    console.error(err);
    throw new Error("Xóa quy định nghỉ đặc biệt thất bại");
  }
};
