import { WorkShift } from "../models/workShiftModel";
import {
  WorkShiftAttributes,
  WorkShiftCreationAttributes,
} from "../models/workShiftModel";
import { Model } from "sequelize";

interface PaginatedResult<T> {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  data: T[];
}

// Lấy danh sách WorkShift có phân trang
export const getAllWorkShifts = async (
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResult<Model>> => {
  try {
    const offset = (page - 1) * pageSize;

    const { count, rows } = await WorkShift.findAndCountAll({
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
    throw new Error("Lấy danh sách ca làm thất bại");
  }
};

// Tạo WorkShift mới
export const createWorkShift = async (
  workShift: WorkShiftCreationAttributes
) => {
  try {
    const newWorkShift = await WorkShift.create(workShift);
    return newWorkShift.get({ plain: true });
  } catch (error: any) {
    console.error(error);
    throw new Error("Tạo ca làm thất bại");
  }
};

// Cập nhật WorkShift
export const updateWorkShift = async (
  workShift: Partial<WorkShiftAttributes>,
  id: number
) => {
  try {
    const [affectedRows] = await WorkShift.update(workShift, { where: { id } });

    if (affectedRows === 0) {
      return null; // không tìm thấy ca làm
    }

    // Lấy lại object sau khi update
    const updatedWorkShift = await WorkShift.findByPk(id);
    return updatedWorkShift?.get({ plain: true }) || null;
  } catch (err) {
    console.error(err);
    throw new Error("Cập nhật ca làm thất bại");
  }
};

// Xóa WorkShift
export const deleteWorkShift = async (id: number) => {
  try {
    const deletedCount = await WorkShift.destroy({ where: { id } });
    return deletedCount;
  } catch (err) {
    console.error(err);
    throw new Error("Xóa ca làm thất bại");
  }
};

// Lấy WorkShift theo ID
export const getWorkShiftById = async (id: number) => {
  try {
    const workShift = await WorkShift.findByPk(id);
    if (!workShift) {
      throw new Error("Ca làm không tồn tại");
    }
    return workShift;
  } catch (err) {
    console.error(err);
    throw new Error("Lấy ca làm thất bại");
  }
};
