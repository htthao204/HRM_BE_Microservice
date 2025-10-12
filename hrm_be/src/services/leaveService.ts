// services/leaveService.ts
import { Leave } from "../models/leaveModel";
import { Op } from "sequelize";

// Tạo mới đơn xin nghỉ
export const createLeave = async (leaveData: any) => {
  try {
    const newLeave = await Leave.create(leaveData);
    return newLeave;
  } catch (err: any) {
    console.error(err);
    throw new Error("Tạo đơn xin nghỉ thất bại");
  }
};

// Lấy đơn xin nghỉ theo ID
export const getLeaveById = async (id: number) => {
  try {
    const leave = await Leave.findByPk(id, {
      include: ["employee", "leaveType"],
    });
    if (!leave) {
      throw new Error("Đơn xin nghỉ không tồn tại");
    }
    return leave;
  } catch (err: any) {
    console.error(err);
    throw new Error("Lấy đơn xin nghỉ thất bại");
  }
};

// Lấy tất cả đơn xin nghỉ (không phân trang)
export const getAllLeaves = async () => {
  try {
    const leaves = await Leave.findAll({
      include: ["employee", "leaveType"],
    });
    return leaves;
  } catch (err: any) {
    console.error(err);
    throw new Error("Lấy danh sách đơn xin nghỉ thất bại");
  }
};

// Lấy tất cả đơn xin nghỉ có phân trang + search
export const getLeavesPaginated = async (
  page: number = 1,
  pageSize: number = 10,
  search: string = ""
) => {
  try {
    const offset = (page - 1) * pageSize;
    const whereClause: any = {};

    if (search) {
      // Ví dụ search theo tên nhân viên hoặc lý do nghỉ
      whereClause[Op.or] = [
        { reason: { [Op.iLike]: `%${search}%` } }, // Postgres
        { "$employee.name$": { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { rows, count } = await Leave.findAndCountAll({
      where: whereClause,
      include: ["employee", "leaveType"],
      limit: pageSize,
      offset,
      order: [["createdAt", "DESC"]],
    });

    return { data: rows, totalItems: count };
  } catch (err: any) {
    console.error(err);
    throw new Error("Lấy danh sách đơn xin nghỉ thất bại");
  }
};

// Cập nhật đơn xin nghỉ
export const updateLeave = async (id: number, leaveData: any) => {
  try {
    const [updatedRowsCount, updatedRows] = await Leave.update(leaveData, {
      where: { id },
      returning: true, // Chỉ Postgres hỗ trợ
    });

    if (updatedRowsCount === 0) {
      throw new Error("Đơn xin nghỉ không tồn tại");
    }

    return updatedRows[0]; // trả về record đã update
  } catch (err: any) {
    console.error(err);
    throw new Error("Cập nhật đơn xin nghỉ thất bại");
  }
};

// Xóa đơn xin nghỉ
export const deleteLeave = async (id: number) => {
  try {
    const deletedCount = await Leave.destroy({ where: { id } });
    if (deletedCount === 0) {
      throw new Error("Đơn xin nghỉ không tồn tại");
    }
    return deletedCount;
  } catch (err: any) {
    console.error(err);
    throw new Error("Xóa đơn xin nghỉ thất bại");
  }
};
