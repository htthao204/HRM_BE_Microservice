import { Op } from "sequelize";
import AttendanceSummary from "../models/attendanceSummaryModel";
import { EmployeeInformation } from "../models/employeeModel";

interface PaginatedResult<T> {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  data: T[];
}

interface AttendanceSummaryFilter {
  employeeName?: string;
  summaryMonth?: string;
  page?: number;
  pageSize?: number;
}

/* ============================================================
 * 🟦 Lấy danh sách tổng hợp chấm công (lọc + phân trang)
 * ============================================================ */
export const getFilteredAttendanceSummaries = async (
  filter: AttendanceSummaryFilter
): Promise<PaginatedResult<AttendanceSummary>> => {
  const page = filter.page || 1;
  const pageSize = filter.pageSize || 10;
  const offset = (page - 1) * pageSize;

  const whereClause: any = {};

  if (filter.summaryMonth) {
    whereClause.summary_month = filter.summaryMonth;
  }

  try {
    const { count, rows } = await AttendanceSummary.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: EmployeeInformation,
          as: "summaryEmployee", // ✅ Sửa thành alias đúng từ associations
          attributes: ["id", "fullName", "employeeCode", "departmentId"],
          where: filter.employeeName
            ? { fullName: { [Op.like]: `%${filter.employeeName}%` } }
            : undefined,
        },
      ],
      order: [["summary_month", "DESC"]],
      offset,
      limit: pageSize,
    });

    return {
      totalItems: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: page,
      data: rows,
    };
  } catch (err) {
    console.error("Error fetching attendance summaries:", err);
    throw new Error("Không thể lấy danh sách tổng hợp chấm công");
  }
};

/* ============================================================
 * 🟩 Tạo mới
 * ============================================================ */
export const createAttendanceSummary = async (data: {
  employee_id: number;
  summary_month: string;
  total_working_days?: number;
  total_present_days?: number;
  total_absent_days?: number;
  total_late_days?: number;
  total_early_days?: number;
  total_leave_days?: number;
  total_overtime_hours?: number;
  total_actual_hours?: number;
}) => {
  try {
    const existing = await AttendanceSummary.findOne({
      where: {
        employee_id: data.employee_id,
        summary_month: data.summary_month,
      },
    });

    if (existing) {
      throw new Error("Tổng hợp tháng này của nhân viên đã tồn tại");
    }

    const summary = await AttendanceSummary.create(data);
    return summary.get({ plain: true });
  } catch (err) {
    console.error("Create AttendanceSummary Error:", err);
    throw new Error("Tạo tổng hợp chấm công thất bại");
  }
};

/* ============================================================
 * 🟨 Cập nhật
 * ============================================================ */
export const updateAttendanceSummary = async (
  id: number,
  data: Partial<AttendanceSummary>
) => {
  try {
    const [count] = await AttendanceSummary.update(data, { where: { id } });
    if (count === 0) throw new Error("Không tìm thấy tổng hợp chấm công");

    const updated = await AttendanceSummary.findByPk(id, {
      include: [
        {
          model: EmployeeInformation,
          as: "summaryEmployee", // ✅ Sửa thành alias đúng
          attributes: ["id", "fullName", "employeeCode"],
        },
      ],
    });
    return updated;
  } catch (err) {
    console.error("Update AttendanceSummary Error:", err);
    throw new Error("Cập nhật tổng hợp chấm công thất bại");
  }
};

/* ============================================================
 * 🟥 Xóa
 * ============================================================ */
export const deleteAttendanceSummary = async (id: number) => {
  try {
    const deletedCount = await AttendanceSummary.destroy({ where: { id } });
    if (deletedCount === 0)
      throw new Error("Không tìm thấy tổng hợp chấm công để xóa");
    return deletedCount;
  } catch (err) {
    console.error("Delete AttendanceSummary Error:", err);
    throw new Error("Xóa tổng hợp chấm công thất bại");
  }
};

/* ============================================================
 * 🟪 Lấy chi tiết theo ID
 * ============================================================ */
export const getAttendanceSummaryById = async (id: number) => {
  try {
    const summary = await AttendanceSummary.findByPk(id, {
      include: [
        {
          model: EmployeeInformation,
          as: "summaryEmployee", // ✅ Sửa thành alias đúng
          attributes: ["id", "fullName", "employeeCode", "departmentId"],
        },
      ],
    });
    if (!summary) throw new Error("Không tìm thấy tổng hợp chấm công");
    return summary;
  } catch (err) {
    console.error(err);
    throw new Error("Lấy chi tiết tổng hợp chấm công thất bại");
  }
};

/* ============================================================
 * 🟦 Lấy tổng hợp theo nhân viên + tháng
 * ============================================================ */
export const getAttendanceSummaryByEmployeeAndMonth = async (
  employeeId: number,
  month: string
) => {
  try {
    const summary = await AttendanceSummary.findOne({
      where: { employee_id: employeeId, summary_month: month },
      include: [
        {
          model: EmployeeInformation,
          as: "summaryEmployee", // ✅ Sửa thành alias đúng
          attributes: ["id", "fullName", "employeeCode", "departmentId"],
        },
      ],
    });
    return summary;
  } catch (err) {
    console.error(err);
    throw new Error("Không thể lấy tổng hợp chấm công theo nhân viên/tháng");
  }
};
