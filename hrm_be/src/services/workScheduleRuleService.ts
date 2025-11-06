import { Op } from "sequelize";
import WorkScheduleRule from "../models/workScheduleRuleModel";

export interface WorkScheduleRuleFilter {
  name?: string;
  ruleType?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

/**
 * 🟩 Tạo mới quy định
 */
export const createRule = async (data: {
  name: string;
  ruleType: string;
  value: string;
  description?: string;
  isActive?: boolean;
}) => {
  return await WorkScheduleRule.create(data);
};

/**
 * 🟨 Cập nhật quy định
 */
export const updateRule = async (
  id: number,
  data: Partial<{
    name: string;
    ruleType: string;
    value: string;
    description: string;
    isActive: boolean;
  }>
) => {
  const rule = await WorkScheduleRule.findByPk(id);
  if (!rule) throw new Error("Quy định không tồn tại");

  await rule.update(data);
  return rule;
};

/**
 * 🟥 Xóa quy định
 */
export const deleteRule = async (id: number) => {
  const rule = await WorkScheduleRule.findByPk(id);
  if (!rule) throw new Error("Quy định không tồn tại");

  await rule.destroy();
  return { message: "Đã xóa quy định thành công" };
};

/**
 * 🟦 Lấy tất cả quy định
 */
export const getAllRules = async () => {
  return await WorkScheduleRule.findAll({
    order: [["createdAt", "DESC"]],
  });
};

/**
 * 🟪 Lấy chi tiết quy định theo ID
 */
export const getRuleById = async (id: number) => {
  const rule = await WorkScheduleRule.findByPk(id);
  if (!rule) throw new Error("Không tìm thấy quy định");
  return rule;
};

/**
 * 🟧 Lọc & phân trang quy định
 */
export const getFilteredRules = async (filters: WorkScheduleRuleFilter) => {
  const { name, ruleType, isActive, page = 1, pageSize = 10 } = filters;

  const where: any = {};

  if (name) {
    where.name = { [Op.iLike]: `%${name}%` };
  }
  if (ruleType) {
    where.ruleType = ruleType;
  }
  if (typeof isActive === "boolean") {
    where.isActive = isActive;
  }

  const offset = (page - 1) * pageSize;

  const { rows, count } = await WorkScheduleRule.findAndCountAll({
    where,
    limit: pageSize,
    offset,
    order: [["createdAt", "DESC"]],
  });

  return {
    data: rows,
    pagination: {
      total: count,
      currentPage: page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    },
  };
};
