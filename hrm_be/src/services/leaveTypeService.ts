import { Op } from "sequelize";
import { LeaveType } from "../models/leaveTypeModel";
import { LeaveTypeRequest } from "../dto/request/leaveTypeRequest";

interface PaginatedResult<T> {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  data: T[];
}

// Lấy tất cả (có phân trang + search)
export const getAllLeaveTypes = async (
  page: number = 1,
  pageSize: number = 10,
  search: string = ""
): Promise<PaginatedResult<any>> => {
  try {
    const offset = (page - 1) * pageSize;
    const whereCondition = search ? { name: { [Op.like]: `%${search}%` } } : {};

    const { rows, count } = await LeaveType.findAndCountAll({
      where: whereCondition,
      limit: pageSize,
      offset,
      order: [["created_at", "DESC"]],
    });

    return {
      totalItems: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: page,
      data: rows.map((r) => r.get({ plain: true })),
    };
  } catch (err: any) {
    console.error(err);
    throw new Error("Lấy danh sách loại nghỉ phép thất bại");
  }
};

// Tạo mới
export const createLeaveType = async (leaveType: LeaveTypeRequest) => {
  try {
    if (!leaveType.name) {
      throw new Error("Tên loại nghỉ phép là bắt buộc");
    }
    const newLeaveType = await LeaveType.create(leaveType);
    return newLeaveType.get({ plain: true });
  } catch (err: any) {
    console.error(err);
    throw new Error("Tạo loại nghỉ phép thất bại");
  }
};

// Cập nhật
export const updateLeaveType = async (
  id: number,
  leaveType: Partial<LeaveTypeRequest>
) => {
  try {
    const [affectedRows] = await LeaveType.update(leaveType, { where: { id } });
    if (affectedRows === 0) return null;
    const updated = await LeaveType.findByPk(id);
    return updated ? updated.get({ plain: true }) : null;
  } catch (err: any) {
    console.error(err);
    throw new Error("Cập nhật loại nghỉ phép thất bại");
  }
};

// Lấy theo ID
export const getLeaveTypeById = async (id: number) => {
  try {
    const leaveType = await LeaveType.findByPk(id);
    return leaveType ? leaveType.get({ plain: true }) : null;
  } catch (err: any) {
    console.error(err);
    throw new Error("Lấy loại nghỉ phép thất bại");
  }
};

// Xóa
export const deleteLeaveType = async (id: number) => {
  try {
    const deletedCount = await LeaveType.destroy({ where: { id } });
    return deletedCount;
  } catch (err: any) {
    console.error(err);
    throw new Error("Xóa loại nghỉ phép thất bại");
  }
};
