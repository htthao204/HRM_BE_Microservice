import { OvertimeRuleRequest } from "../dto/request/overtimeRuleRequest";
import {
  OvertimeRule,
  OvertimeRuleAttributes,
  OvertimeRuleCreationAttributes,
} from "../models/overtimeRuleModel";

interface PaginatedResult<T> {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  data: T[];
}

// Lấy danh sách quy tắc OT (phân trang)
export const getAllOvertimeRules = async (
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResult<OvertimeRule>> => {
  try {
    const offset = (page - 1) * pageSize;

    const { count, rows } = await OvertimeRule.findAndCountAll({
      limit: pageSize,
      offset,
      order: [["createdAt", "DESC"]],
    });

    return {
      totalItems: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: page,
      data: rows,
    };
  } catch (error: any) {
    console.error(error);
    throw new Error("Lấy danh sách quy tắc tăng ca thất bại");
  }
};

// Lấy 1 rule theo ID
export const getOvertimeRuleById = async (id: number) => {
  try {
    const rule = await OvertimeRule.findByPk(id);
    if (!rule) throw new Error("Quy tắc tăng ca không tồn tại");
    return rule;
  } catch (err) {
    console.error(err);
    throw new Error("Lấy quy tắc tăng ca thất bại");
  }
};

// Tạo mới rule
export const createOvertimeRule = async (data: OvertimeRuleRequest) => {
  try {
    const newRule = await OvertimeRule.create(data);
    console.log("newRule in service", newRule);
    return newRule.get({ plain: true });
  } catch (err) {
    console.error(err);
    throw new Error("Tạo quy tắc tăng ca thất bại");
  }
};

// Cập nhật rule
export const updateOvertimeRule = async (
  id: number,
  data: Partial<OvertimeRuleAttributes>
) => {
  try {
    const [updatedCount] = await OvertimeRule.update(data, { where: { id } });
    if (updatedCount === 0)
      throw new Error("Không tìm thấy quy tắc để cập nhật");
    return await OvertimeRule.findByPk(id);
  } catch (err) {
    console.error(err);
    throw new Error("Cập nhật quy tắc tăng ca thất bại");
  }
};

// Xóa rule
export const deleteOvertimeRule = async (id: number) => {
  try {
    const deleted = await OvertimeRule.destroy({ where: { id } });
    if (deleted === 0) throw new Error("Không tìm thấy quy tắc để xóa");
    return deleted;
  } catch (err) {
    console.error(err);
    throw new Error("Xóa quy tắc tăng ca thất bại");
  }
};
