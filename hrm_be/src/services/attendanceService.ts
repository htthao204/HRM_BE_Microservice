import Attendance from "../models/attendanceModel";

interface PaginatedResult<T> {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  data: T[];
}

// Lấy danh sách attendances có phân trang
export const getAllAttendances = async (
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResult<Attendance>> => {
  try {
    const offset = (page - 1) * pageSize;
    const { count, rows } = await Attendance.findAndCountAll({
      limit: pageSize,
      offset,
      order: [["date", "DESC"]],
    });

    return {
      totalItems: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: page,
      data: rows,
    };
  } catch (err) {
    console.error(err);
    throw new Error("Lấy danh sách chấm công thất bại");
  }
};

// Lấy chấm công theo ID
export const getAttendanceById = async (id: number) => {
  try {
    const attendance = await Attendance.findByPk(id);
    if (!attendance) throw new Error("Chấm công không tồn tại");
    return attendance;
  } catch (err) {
    console.error(err);
    throw new Error("Lấy chấm công thất bại");
  }
};

// Tạo mới chấm công
export const createAttendance = async (data: {
  employee_id: number;
  date: Date;
  working_hours?: number;
  total_checkin?: number;
  total_checkout?: number;
}) => {
  try {
    const newAttendance = await Attendance.create({
      ...data,
      working_hours: data.working_hours || 0,
      total_checkin: data.total_checkin || 0,
      total_checkout: data.total_checkout || 0,
    });

    return newAttendance.get({ plain: true });
  } catch (err) {
    console.error(err);
    throw new Error("Tạo chấm công thất bại");
  }
};

// Cập nhật chấm công
export const updateAttendance = async (
  id: number,
  data: Partial<{
    working_hours?: number;
    total_checkin?: number;
    total_checkout?: number;
  }>
) => {
  try {
    const [updatedCount] = await Attendance.update(data, { where: { id } });

    if (updatedCount === 0) {
      throw new Error("Không tìm thấy chấm công để cập nhật");
    }

    const updated = await Attendance.findByPk(id);
    if (!updated) throw new Error("Không tìm thấy bản ghi sau khi cập nhật");

    return updated;
  } catch (err) {
    console.error("Update Attendance Error:", err);
    throw new Error("Cập nhật chấm công thất bại");
  }
};

// Xóa chấm công
export const deleteAttendance = async (id: number) => {
  try {
    const deletedCount = await Attendance.destroy({ where: { id } });
    if (deletedCount === 0) throw new Error("Không tìm thấy chấm công để xóa");
    return deletedCount;
  } catch (err) {
    console.error(err);
    throw new Error("Xóa chấm công thất bại");
  }
};

// Lấy danh sách attendances theo employeeId có phân trang
export const getAttendancesByEmployeeId = async (
  employeeId: number,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResult<Attendance>> => {
  try {
    const offset = (page - 1) * pageSize;
    const { count, rows } = await Attendance.findAndCountAll({
      where: { employee_id: employeeId },
      limit: pageSize,
      offset,
      order: [["date", "DESC"]],
    });

    return {
      totalItems: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: page,
      data: rows,
    };
  } catch (err) {
    console.error(err);
    throw new Error("Lấy danh sách chấm công theo nhân viên thất bại");
  }
};
