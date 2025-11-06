import { Op } from "sequelize";
import { OvertimeRule } from "../models/overtimeRuleModel";
import { OvertimeRuleRequest } from "../dto/request/overtimeRuleRequest";

interface PaginatedResult<T> {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  data: T[];
}

// ==============================
// 📘 LẤY DANH SÁCH QUY TẮC TĂNG CA (CÓ PHÂN TRANG + TÌM KIẾM)
// ==============================
export const getAllOvertimeRules = async (
  page: number = 1,
  pageSize: number = 10,
  filters?: { name?: string; status?: string }
): Promise<PaginatedResult<OvertimeRule>> => {
  try {
    const offset = (page - 1) * pageSize;

    // Điều kiện tìm kiếm
    const where: any = {};

    if (filters?.name) {
      where.name = { [Op.like]: `%${filters.name}%` };
    }

    if (filters?.status === "active") {
      where.isActive = true;
    } else if (filters?.status === "inactive") {
      where.isActive = false;
    }

    const { count, rows } = await OvertimeRule.findAndCountAll({
      where,
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
    console.error("❌ Lỗi khi lấy danh sách quy tắc tăng ca:", error);
    throw new Error("Không thể lấy danh sách quy tắc tăng ca");
  }
};

// ==============================
// 📘 LẤY 1 QUY TẮC THEO ID
// ==============================
export const getOvertimeRuleById = async (
  id: number
): Promise<OvertimeRule> => {
  try {
    const rule = await OvertimeRule.findByPk(id);
    if (!rule) {
      throw new Error("Quy tắc tăng ca không tồn tại");
    }
    return rule;
  } catch (error) {
    console.error("❌ Lỗi khi lấy quy tắc tăng ca:", error);
    throw new Error("Không thể lấy quy tắc tăng ca");
  }
};

// ==============================
// 🟢 TẠO MỚI QUY TẮC
// ==============================
export const createOvertimeRule = async (
  data: OvertimeRuleRequest
): Promise<OvertimeRule> => {
  try {
    const newRule = await OvertimeRule.create({
      name: data.name,
      multiplier: data.multiplier,
      startTime: data.startTime,
      endTime: data.endTime,
      applyDays: data.applyDays || "1,2,3,4,5,6,7",
      minHours: data.minHours || 1.0,
      description: data.description || null,
      isActive: data.isActive ?? true,
    });

    return newRule;
  } catch (error) {
    console.error("❌ Lỗi khi tạo quy tắc tăng ca:", error);
    throw new Error("Không thể tạo quy tắc tăng ca");
  }
};

// ==============================
// 🟡 CẬP NHẬT QUY TẮC
// ==============================
export const updateOvertimeRule = async (
  id: number,
  data: Partial<OvertimeRuleRequest>
): Promise<OvertimeRule> => {
  try {
    const [updatedCount] = await OvertimeRule.update(data, { where: { id } });

    if (updatedCount === 0) {
      throw new Error("Không tìm thấy quy tắc để cập nhật");
    }

    const updated = await OvertimeRule.findByPk(id);
    if (!updated) {
      throw new Error("Cập nhật thất bại – không tìm thấy quy tắc");
    }

    return updated;
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật quy tắc tăng ca:", error);
    throw new Error("Không thể cập nhật quy tắc tăng ca");
  }
};

// ==============================
// 🔴 XÓA QUY TẮC
// ==============================
export const deleteOvertimeRule = async (id: number): Promise<void> => {
  try {
    const deleted = await OvertimeRule.destroy({ where: { id } });
    if (deleted === 0) {
      throw new Error("Không tìm thấy quy tắc để xoá");
    }
  } catch (error) {
    console.error("❌ Lỗi khi xoá quy tắc tăng ca:", error);
    throw new Error("Không thể xoá quy tắc tăng ca");
  }
};

// ==============================
// ⚪️ KÍCH HOẠT / VÔ HIỆU HOÁ QUY TẮC
// ==============================
export const toggleOvertimeRuleStatus = async (
  id: number,
  isActive: boolean
): Promise<OvertimeRule> => {
  try {
    const rule = await OvertimeRule.findByPk(id);
    if (!rule) {
      throw new Error("Không tìm thấy quy tắc tăng ca");
    }

    rule.isActive = isActive;
    await rule.save();

    return rule;
  } catch (error) {
    console.error("❌ Lỗi khi đổi trạng thái quy tắc tăng ca:", error);
    throw new Error("Không thể đổi trạng thái quy tắc tăng ca");
  }
};
