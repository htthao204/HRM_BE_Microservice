import { Op } from "sequelize";
import AttendanceSummary from "../models/attendanceSummaryModel";
import { EmployeeInformation } from "../models/employeeModel";
import Department from "../models/departmentModel"; // THÊM IMPORT DEPARTMENT

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
): Promise<PaginatedResult<any>> => {
  const page = filter.page || 1;
  const pageSize = filter.pageSize || 10;
  const offset = (page - 1) * pageSize;

  const whereClause: any = {};

  if (filter.summaryMonth) {
    whereClause.summary_month = filter.summaryMonth;
  }

  try {
    const includeOptions: any = [
      {
        model: EmployeeInformation,
        as: "summaryEmployee",
        attributes: ["id", "fullName", "employeeCode", "departmentId"],
        include: [
          {
            model: Department,
            as: "employeeDepartment",
            attributes: ["id", "name", "code"],
          },
        ],
      },
    ];

    if (filter.employeeName) {
      includeOptions[0].where = {
        fullName: { [Op.like]: `%${filter.employeeName}%` },
      };
    }

    const { count, rows } = await AttendanceSummary.findAndCountAll({
      where: whereClause,
      include: includeOptions,
      order: [["summary_month", "DESC"]],
      offset,
      limit: pageSize,
      // 🟢 THÊM: Sử dụng raw: true để tránh circular references
      raw: true,
      nest: true,
    });

    // 🟢 SỬA: Xử lý dữ liệu an toàn hơn
    const processedData = rows.map((item: any) => {
      const workingDays = item.total_working_days || 0;
      const presentDays = item.total_present_days || 0;
      const actualHours = item.total_actual_hours || 0;

      // Tính toán các giá trị phái sinh
      const attendanceRate =
        workingDays > 0
          ? Number(((presentDays / workingDays) * 100).toFixed(1))
          : 0;

      const averageHoursPerDay =
        workingDays > 0 ? Number((actualHours / workingDays).toFixed(1)) : 0;

      // 🟢 SỬA: Lấy thông tin department an toàn
      const departmentInfo = item["summaryEmployee.employeeDepartment"] || {};
      const employeeInfo = {
        id: item["summaryEmployee.id"],
        fullName: item["summaryEmployee.fullName"],
        employeeCode: item["summaryEmployee.employeeCode"],
        departmentId: item["summaryEmployee.departmentId"],
      };

      // 🟢 SỬA: Tạo object mới hoàn toàn, không spread item
      const cleanItem = {
        // Thông tin cơ bản từ AttendanceSummary
        id: item.id,
        employee_id: item.employee_id,
        summary_month: item.summary_month,
        total_working_days: workingDays,
        total_present_days: presentDays,
        total_absent_days: item.total_absent_days || 0,
        total_late_days: item.total_late_days || 0,
        total_early_days: item.total_early_days || 0,
        total_leave_days: item.total_leave_days || 0,
        total_overtime_hours: item.total_overtime_hours || 0,
        total_actual_hours: actualHours,
        created_at: item.created_at,
        updated_at: item.updated_at,

        // Các trường tính toán
        attendance_rate: attendanceRate,
        average_hours_per_day: averageHoursPerDay,

        // Alias để frontend dễ sử dụng
        present: presentDays,
        late: item.total_late_days || 0,
        early: item.total_early_days || 0,
        absent: item.total_absent_days || 0,

        // Thông tin employee và department (đã được làm sạch)
        summaryEmployee: employeeInfo,
        employee: employeeInfo,

        // Thông tin department riêng
        department_name: departmentInfo.name || "Chưa xác định",
        department_code: departmentInfo.code || "",
        department: departmentInfo,
      };

      return cleanItem;
    });

    console.log(
      `✅ Processed ${processedData.length} records with department info`
    );

    return {
      totalItems: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: page,
      data: processedData,
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
    // Validate dữ liệu đầu vào
    if (!data.employee_id || !data.summary_month) {
      throw new Error("employee_id và summary_month là bắt buộc");
    }

    // Kiểm tra tồn tại
    const existing = await AttendanceSummary.findOne({
      where: {
        employee_id: data.employee_id,
        summary_month: data.summary_month,
      },
    });

    if (existing) {
      throw new Error("Tổng hợp tháng này của nhân viên đã tồn tại");
    }

    // Xử lý giá trị mặc định
    const summaryData = {
      ...data,
      total_working_days: data.total_working_days || 0,
      total_present_days: data.total_present_days || 0,
      total_absent_days: data.total_absent_days || 0,
      total_late_days: data.total_late_days || 0,
      total_early_days: data.total_early_days || 0,
      total_leave_days: data.total_leave_days || 0,
      total_overtime_hours: data.total_overtime_hours || 0,
      total_actual_hours: data.total_actual_hours || 0,
    };

    const summary = await AttendanceSummary.create(summaryData);

    // Lấy lại dữ liệu với include để trả về đầy đủ
    const result = await AttendanceSummary.findByPk(summary.id, {
      include: [
        {
          model: EmployeeInformation,
          as: "summaryEmployee",
          attributes: ["id", "fullName", "employeeCode", "departmentId"],
          include: [
            // THÊM INCLUDE DEPARTMENT
            {
              model: Department,
              as: "employeeDepartment",
              attributes: ["id", "name", "code"],
            },
          ],
        },
      ],
    });

    return result ? result.get({ plain: true }) : summary.get({ plain: true });
  } catch (err: any) {
    console.error("Create AttendanceSummary Error:", err);
    throw new Error(err.message || "Tạo tổng hợp chấm công thất bại");
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
    // Kiểm tra tồn tại trước khi update
    const existing = await AttendanceSummary.findByPk(id);
    if (!existing) {
      throw new Error("Không tìm thấy tổng hợp chấm công");
    }

    const [count] = await AttendanceSummary.update(data, {
      where: { id },
    });

    if (count === 0) {
      throw new Error("Cập nhật tổng hợp chấm công thất bại");
    }

    // Lấy dữ liệu đã cập nhật
    const updated = await AttendanceSummary.findByPk(id, {
      include: [
        {
          model: EmployeeInformation,
          as: "summaryEmployee",
          attributes: ["id", "fullName", "employeeCode", "departmentId"],
          include: [
            // THÊM INCLUDE DEPARTMENT
            {
              model: Department,
              as: "employeeDepartment",
              attributes: ["id", "name", "code"],
            },
          ],
        },
      ],
    });

    return updated;
  } catch (err: any) {
    console.error("Update AttendanceSummary Error:", err);
    throw new Error(err.message || "Cập nhật tổng hợp chấm công thất bại");
  }
};

/* ============================================================
 * 🟥 Xóa
 * ============================================================ */
export const deleteAttendanceSummary = async (id: number) => {
  try {
    // Kiểm tra tồn tại trước khi xóa
    const existing = await AttendanceSummary.findByPk(id);
    if (!existing) {
      throw new Error("Không tìm thấy tổng hợp chấm công để xóa");
    }

    const deletedCount = await AttendanceSummary.destroy({
      where: { id },
    });

    return deletedCount;
  } catch (err: any) {
    console.error("Delete AttendanceSummary Error:", err);
    throw new Error(err.message || "Xóa tổng hợp chấm công thất bại");
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
          as: "summaryEmployee",
          attributes: ["id", "fullName", "employeeCode", "departmentId"],
          include: [
            // THÊM INCLUDE DEPARTMENT
            {
              model: Department,
              as: "employeeDepartment",
              attributes: ["id", "name", "code"],
            },
          ],
        },
      ],
    });

    if (!summary) {
      throw new Error("Không tìm thấy tổng hợp chấm công");
    }

    return summary;
  } catch (err: any) {
    console.error("Get AttendanceSummary By ID Error:", err);
    throw new Error(err.message || "Lấy chi tiết tổng hợp chấm công thất bại");
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
    // Validate đầu vào
    if (!employeeId || !month) {
      throw new Error("employeeId và month là bắt buộc");
    }

    const summary = await AttendanceSummary.findOne({
      where: {
        employee_id: employeeId,
        summary_month: month,
      },
      include: [
        {
          model: EmployeeInformation,
          as: "summaryEmployee",
          attributes: ["id", "fullName", "employeeCode", "departmentId"],
          include: [
            // THÊM INCLUDE DEPARTMENT
            {
              model: Department,
              as: "employeeDepartment",
              attributes: ["id", "name", "code"],
            },
          ],
        },
      ],
    });

    // Nếu không tìm thấy, không throw error mà return null
    return summary;
  } catch (err: any) {
    console.error("Get AttendanceSummary By Employee And Month Error:", err);
    throw new Error("Không thể lấy tổng hợp chấm công theo nhân viên/tháng");
  }
};

/* ============================================================
 * 🟦 Lấy yearly summary cho employee - CẬP NHẬT VỚI DEPARTMENT
 * ============================================================ */
/* ============================================================
 * 🟦 Lấy yearly summary cho employee - SỬA LỖI TYPE
 * ============================================================ */
export const getYearlySummaryForEmployee = async (
  employeeId: number,
  year: string
) => {
  try {
    console.log(
      `🔍 Fetching yearly summary for employee ${employeeId}, year ${year}`
    );

    const summaries = await AttendanceSummary.findAll({
      where: {
        employee_id: employeeId,
        summary_month: {
          [Op.like]: `${year}-%`,
        },
      },
      include: [
        {
          model: EmployeeInformation,
          as: "summaryEmployee",
          attributes: ["id", "fullName", "employeeCode", "departmentId"],
          include: [
            {
              model: Department,
              as: "employeeDepartment",
              attributes: ["id", "name", "code"],
            },
          ],
        },
      ],
      order: [["summary_month", "ASC"]],
    });

    console.log(
      `📊 Found ${summaries.length} monthly records for year ${year}:`,
      summaries.map((s) => s.summary_month)
    );

    // Xử lý dữ liệu để đảm bảo có đủ 12 tháng
    const monthlyData = [];
    const monthNames = [
      "Tháng 1",
      "Tháng 2",
      "Tháng 3",
      "Tháng 4",
      "Tháng 5",
      "Tháng 6",
      "Tháng 7",
      "Tháng 8",
      "Tháng 9",
      "Tháng 10",
      "Tháng 11",
      "Tháng 12",
    ];

    // Helper function để convert string sang number an toàn
    const safeNumber = (value: any): number => {
      if (value === null || value === undefined) return 0;
      const num = Number(value);
      return isNaN(num) ? 0 : num;
    };

    // Lấy thông tin department từ record đầu tiên (nếu có)
    const departmentInfo =
      summaries.length > 0
        ? summaries[0].summaryEmployee?.employeeDepartment
        : null;

    for (let i = 0; i < 12; i++) {
      const monthNumber = i + 1;
      const monthStr = `${year}-${String(monthNumber).padStart(2, "0")}`;
      const existingData = summaries.find((s) => s.summary_month === monthStr);

      console.log(
        `📅 Processing ${monthStr}:`,
        existingData ? "Found" : "Not found"
      );

      if (existingData) {
        const plainData = existingData.get({ plain: true });

        // SỬA: SỬ DỤNG safeNumber ĐỂ CONVERT TẤT CẢ GIÁ TRỊ
        let workingDays = safeNumber(plainData.total_working_days);
        let presentDays = safeNumber(plainData.total_present_days);

        // Fix dữ liệu không hợp lý: presentDays không thể > workingDays
        if (presentDays > workingDays) {
          console.warn(
            `⚠️  Data inconsistency in ${monthStr}: presentDays (${presentDays}) > workingDays (${workingDays})`
          );
          presentDays = Math.min(presentDays, workingDays);
        }

        const monthSummary = {
          month: monthNames[i],
          year: parseInt(year),
          present: presentDays,
          late: safeNumber(plainData.total_late_days),
          early: safeNumber(plainData.total_early_days),
          absent_days: safeNumber(plainData.total_absent_days),
          leave_days: safeNumber(plainData.total_leave_days),
          overtime_hours: safeNumber(plainData.total_overtime_hours),
          actual_hours: safeNumber(plainData.total_actual_hours),
          working_days: workingDays,
          attendance_rate:
            workingDays > 0
              ? Number(((presentDays / workingDays) * 100).toFixed(1))
              : 0,
          department_name: departmentInfo?.name || "Chưa xác định",
          department_code: departmentInfo?.code || "",
        };

        console.log(`✅ Month ${monthStr} data:`, monthSummary);
        monthlyData.push(monthSummary);
      } else {
        // Dữ liệu mặc định cho tháng không có dữ liệu
        const defaultMonth = {
          month: monthNames[i],
          year: parseInt(year),
          present: 0,
          late: 0,
          early: 0,
          absent_days: 0,
          leave_days: 0,
          overtime_hours: 0,
          actual_hours: 0,
          working_days: 0,
          attendance_rate: 0,
          department_name: departmentInfo?.name || "Chưa xác định",
          department_code: departmentInfo?.code || "",
        };

        console.log(`❌ Month ${monthStr}: Using default data`);
        monthlyData.push(defaultMonth);
      }
    }

    // Tính tổng quan năm - CHỈ TÍNH TỪ DỮ LIỆU THỰC TẾ
    const actualMonths = summaries.map((s) => {
      const plainData = s.get({ plain: true });

      // SỬA: SỬ DỤNG safeNumber CHO TẤT CẢ GIÁ TRỊ
      let workingDays = safeNumber(plainData.total_working_days);
      let presentDays = safeNumber(plainData.total_present_days);

      if (presentDays > workingDays) {
        presentDays = Math.min(presentDays, workingDays);
      }

      return {
        present: presentDays,
        late: safeNumber(plainData.total_late_days),
        early: safeNumber(plainData.total_early_days),
        absent_days: safeNumber(plainData.total_absent_days),
        overtime_hours: safeNumber(plainData.total_overtime_hours),
        working_days: workingDays,
        actual_hours: safeNumber(plainData.total_actual_hours),
      };
    });

    const summary = actualMonths.reduce(
      (acc, month) => ({
        present_days: acc.present_days + month.present,
        late_days: acc.late_days + month.late,
        early_days: acc.early_days + month.early,
        absent_days: acc.absent_days + month.absent_days,
        overtime_hours: acc.overtime_hours + month.overtime_hours,
        total_working_days: acc.total_working_days + month.working_days,
        total_actual_hours: acc.total_actual_hours + month.actual_hours,
      }),
      {
        present_days: 0,
        late_days: 0,
        early_days: 0,
        absent_days: 0,
        overtime_hours: 0,
        total_working_days: 0,
        total_actual_hours: 0,
      }
    );

    // Tính tổng giờ nếu không có dữ liệu
    if (summary.total_actual_hours === 0 && summary.present_days > 0) {
      summary.total_actual_hours = summary.present_days * 8; // Mặc định 8h/ngày
    }

    const attendance_rate =
      summary.total_working_days > 0
        ? Number(
            ((summary.present_days / summary.total_working_days) * 100).toFixed(
              1
            )
          )
        : 0;

    const average_hours_per_day =
      summary.present_days > 0
        ? Number((summary.total_actual_hours / summary.present_days).toFixed(1))
        : 0;

    // SỬA: ĐẢM BẢO TẤT CẢ GIÁ TRỊ ĐỀU LÀ NUMBER TRƯỚC KHI DÙNG toFixed
    const result = {
      monthly_data: monthlyData,
      summary: {
        present_days: summary.present_days,
        absent_days: summary.absent_days,
        late_days: summary.late_days,
        early_days: summary.early_days,
        overtime_hours: Number(summary.overtime_hours.toFixed(1)), // ĐÃ LÀ NUMBER NÊN toFixed ĐƯỢC
        attendance_rate: attendance_rate,
        average_hours_per_day: average_hours_per_day,
        total_working_days: summary.total_working_days,
        total_hours: Number(summary.total_actual_hours.toFixed(1)), // ĐÃ LÀ NUMBER NÊN toFixed ĐƯỢC
        department_name: departmentInfo?.name || "Chưa xác định",
        department_code: departmentInfo?.code || "",
      },
    };

    console.log(`📈 Final yearly summary for ${year}:`, result.summary);
    return result;
  } catch (err: any) {
    console.error("Get Yearly Summary Error:", err);
    throw new Error("Không thể lấy tổng quan chấm công theo năm");
  }
};
