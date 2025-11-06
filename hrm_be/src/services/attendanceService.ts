import Attendance from "../models/attendanceModel";

interface PaginatedResult<T> {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  data: T[];
}

// ==============================
// 🟩 Lấy danh sách attendances có phân trang
// ==============================
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

// ==============================
// 🟨 Lấy chấm công theo ID
// ==============================
export const getAttendanceById = async (id: number) => {
  const attendance = await Attendance.findByPk(id);
  if (!attendance) throw new Error("Chấm công không tồn tại");
  return attendance;
};

// ==============================
// 🟦 Tạo mới chấm công
// ==============================
export const createAttendance = async (data: {
  employeeId: number;
  date: Date;
  workShiftId?: number;
  status?: string;
  notes?: string;
}) => {
  const newAttendance = await Attendance.create({
    employeeId: data.employeeId,
    date: data.date,
    workShiftId: data.workShiftId || null,
    status: data.status || "present",
    notes: data.notes || null,
  });
  return newAttendance;
};

// ==============================
// 🟧 Cập nhật chấm công
// ==============================
export const updateAttendance = async (
  id: number,
  data: Partial<{
    expectedHours: number;
    actualHours: number;
    checkinTime: Date;
    checkoutTime: Date;
    lateMinutes: number;
    earlyMinutes: number;
    overtimeHours: number;
    status: string;
    notes: string;
  }>
) => {
  const attendance = await Attendance.findByPk(id);
  if (!attendance) throw new Error("Không tìm thấy chấm công");

  await attendance.update(data);
  return attendance;
};

// ==============================
// 🟥 Xóa chấm công
// ==============================
export const deleteAttendance = async (id: number) => {
  const deleted = await Attendance.destroy({ where: { id } });
  if (!deleted) throw new Error("Không tìm thấy chấm công để xóa");
  return true;
};

// ==============================
// 🟦 Lấy danh sách theo employeeId có phân trang
// ==============================
export const getAttendancesByEmployeeId = async (
  employeeId: number,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResult<Attendance>> => {
  const offset = (page - 1) * pageSize;
  const { count, rows } = await Attendance.findAndCountAll({
    where: { employeeId }, // ✅ đúng key theo model
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
};
