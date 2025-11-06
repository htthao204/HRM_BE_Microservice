import { Op } from "sequelize";
import CalculationRule from "../models/calculationRule";

export interface CalculationRuleFilter {
  ruleCode?: string;
  name?: string;
  ruleCategory?: string;
  ruleType?: string;
  isActive?: boolean;
}

export const getAllCalculationRules = async (
  page: number = 1,
  pageSize: number = 10,
  filter: CalculationRuleFilter = {}
) => {
  const where: any = {};

  if (filter.ruleCode) {
    where.ruleCode = { [Op.iLike]: `%${filter.ruleCode}%` };
  }
  if (filter.name) {
    where.name = { [Op.iLike]: `%${filter.name}%` };
  }
  if (filter.ruleCategory) {
    where.ruleCategory = filter.ruleCategory;
  }
  if (filter.ruleType) {
    where.ruleType = filter.ruleType;
  }
  if (filter.isActive !== undefined) {
    where.isActive = filter.isActive;
  }

  const offset = (page - 1) * pageSize;

  const { rows, count } = await CalculationRule.findAndCountAll({
    where,
    limit: pageSize,
    offset,
    order: [["executionOrder", "ASC"]],
  });

  return {
    data: rows,
    totalItems: count,
    totalPages: Math.ceil(count / pageSize),
    currentPage: page,
  };
};

export const getCalculationRuleById = async (id: number) => {
  return await CalculationRule.findByPk(id);
};

export const createCalculationRule = async (data: any) => {
  return await CalculationRule.create(data);
};

export const updateCalculationRule = async (id: number, data: any) => {
  const rule = await CalculationRule.findByPk(id);
  if (!rule) return null;

  await rule.update(data);
  return rule;
};

export const deleteCalculationRule = async (id: number) => {
  const rule = await CalculationRule.findByPk(id);
  if (!rule) return false;

  await rule.destroy();
  return true;
};
