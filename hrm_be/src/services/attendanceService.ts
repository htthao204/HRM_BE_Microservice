import { Op, WhereOptions } from "sequelize";
import Attendance from "../models/attendanceModel";
import EmployeeInformation from "../models/employeeModel";
import Department from "../models/departmentModel";
import Position from "../models/positionModel";
import WorkShift from "../models/workShiftModel";
import ExcelJS from "exceljs";
import sequelize from "../config/db";

interface PaginatedResult<T> {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  data: T[];
}

interface AttendanceFilters {
  employeeName?: string;
  department?: string;
  status?: string;
  dateRange?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface GetAttendancesParams {
  page: number;
  pageSize: number;
  filters: AttendanceFilters;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

interface GetAttendancesByEmployeeParams {
  employeeId: number;
  page: number;
  pageSize: number;
  dateFrom?: string;
  dateTo?: string;
}

interface ImportResult {
  successCount: number;
  failedCount: number;
  errors: string[];
}

interface BulkOperationResult {
  deletedCount?: number;
  updatedCount?: number;
  successCount?: number;
  failedCount?: number;
  recalculatedCount?: number;
  syncedCount?: number;
  errors?: string[];
}

interface AttendanceStatistics {
  total: number;
  present: number;
  absent: number;
  late: number;
  earlyLeave: number;
  halfDay: number;
  totalHours: number;
}

// ==============================
// 🟩 Lấy danh sách attendances có phân trang + filter
// ==============================
export const getAllAttendances = async (
  params: GetAttendancesParams
): Promise<PaginatedResult<any>> => {
  try {
    const { page, pageSize, filters, sortBy, sortOrder } = params;
    const offset = (page - 1) * pageSize;

    // 🚨 FIX: Sử dụng sequelize thay vì db
    let query = `
      SELECT 
        a.*,
        ei.full_name as "employeeName",
        ei.employee_code as "employeeCode",
        d.name as "departmentName",
        p.name as "positionName",
        ws.name as "shiftName"
      FROM attendances a
      JOIN employee_information ei ON a.employee_id = ei.id
      LEFT JOIN departments d ON ei.department_id = d.id
      LEFT JOIN positions p ON ei.position_id = p.id
      LEFT JOIN work_shifts ws ON a.work_shift_id = ws.id
      WHERE 1=1
    `;

    let countQuery = `
      SELECT COUNT(DISTINCT a.id) as total
      FROM attendances a
      JOIN employee_information ei ON a.employee_id = ei.id
      LEFT JOIN departments d ON ei.department_id = d.id
      WHERE 1=1
    `;

    const queryParams: any[] = [];
    let paramCount = 0;

    // Filter conditions
    if (filters.dateFrom && filters.dateTo) {
      paramCount++;
      query += ` AND a.date BETWEEN $${paramCount} AND $${paramCount + 1}`;
      countQuery += ` AND a.date BETWEEN $${paramCount} AND $${paramCount + 1}`;
      queryParams.push(filters.dateFrom, filters.dateTo);
      paramCount += 2;
    }

    if (filters.status && filters.status !== "all") {
      paramCount++;
      query += ` AND a.status = $${paramCount}`;
      countQuery += ` AND a.status = $${paramCount}`;
      queryParams.push(filters.status);
    }

    if (filters.employeeName) {
      paramCount++;
      query += ` AND (ei.full_name ILIKE $${paramCount} OR ei.employee_code ILIKE $${paramCount})`;
      countQuery += ` AND (ei.full_name ILIKE $${paramCount} OR ei.employee_code ILIKE $${paramCount})`;
      queryParams.push(`%${filters.employeeName}%`);
    }

    if (filters.department && filters.department !== "all") {
      paramCount++;
      query += ` AND d.name = $${paramCount}`;
      countQuery += ` AND d.name = $${paramCount}`;
      queryParams.push(filters.department);
    }

    // Sort configuration
    const sortMapping: any = {
      date: "a.date",
      status: "a.status",
      employeeName: "ei.full_name",
      departmentName: "d.name",
      actualHours: "a.actual_hours",
    };

    const sortField = sortMapping[sortBy] || "a.date";
    query += ` ORDER BY ${sortField} ${sortOrder.toUpperCase()}`;

    // Pagination
    query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(pageSize, offset);

    console.log("Executing query with params:", {
      queryParams,
      page,
      pageSize,
    });

    // 🚨 FIX: Sử dụng sequelize thay vì db
    const result = await sequelize.transaction(async (transaction) => {
      const [dataResult, countResult] = await Promise.all([
        sequelize.query(query, {
          bind: queryParams,
          type: sequelize.QueryTypes.SELECT,
          transaction,
        }),
        sequelize.query(countQuery, {
          bind: queryParams.slice(0, -2), // Remove pagination params for count
          type: sequelize.QueryTypes.SELECT,
          transaction,
        }),
      ]);

      return { dataResult, countResult };
    });

    return {
      data: result.dataResult,
      totalItems: parseInt(result.countResult[0]?.total || "0"),
      totalPages: Math.ceil(
        parseInt(result.countResult[0]?.total || "0") / pageSize
      ),
      currentPage: page,
    };
  } catch (err) {
    console.error("Lỗi khi lấy danh sách chấm công:", err);

    // Error handling
    if (err.name === "SequelizeDatabaseError") {
      throw new Error("Lỗi cơ sở dữ liệu khi tải dữ liệu chấm công");
    } else if (err.name === "SequelizeTimeoutError") {
      throw new Error(
        "Timeout khi tải dữ liệu. Vui lòng thử lại với ít bản ghi hơn"
      );
    }

    throw new Error("Lấy danh sách chấm công thất bại");
  }
};

// ==============================
// 🟨 Lấy chấm công theo ID
// ==============================
export const getAttendanceById = async (id: number) => {
  try {
    const attendance = await Attendance.findByPk(id, {
      include: [
        {
          model: EmployeeInformation,
          as: "employee",
          include: [
            {
              model: Department,
              as: "department",
            },
            {
              model: Position,
              as: "position",
            },
          ],
        },
        {
          model: WorkShift,
          as: "workShift",
        },
      ],
    });

    if (!attendance) {
      throw new Error("Chấm công không tồn tại");
    }

    return attendance;
  } catch (err) {
    console.error("Lỗi khi lấy thông tin chấm công:", err);
    throw new Error("Lấy thông tin chấm công thất bại");
  }
};

// ==============================
// 🟦 Lấy danh sách theo employeeId có phân trang
// ==============================
export const getAttendancesByEmployeeId = async (
  params: GetAttendancesByEmployeeParams
): Promise<PaginatedResult<any>> => {
  try {
    const { employeeId, page, pageSize, dateFrom, dateTo } = params;
    const offset = (page - 1) * pageSize;

    const whereConditions: any = { employee_id: employeeId }; // 🚨 FIX: Sửa thành employee_id

    // Date filter
    if (dateFrom && dateTo) {
      whereConditions.date = {
        [Op.between]: [dateFrom, dateTo],
      };
    }

    const { count, rows } = await Attendance.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: EmployeeInformation,
          as: "employee",
          include: [
            {
              model: Department,
              as: "department",
            },
          ],
        },
        {
          model: WorkShift,
          as: "workShift",
        },
      ],
      limit: pageSize,
      offset,
      order: [["date", "DESC"]],
      distinct: true,
    });

    return {
      data: rows,
      totalItems: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: page,
    };
  } catch (err) {
    console.error("Lỗi khi lấy danh sách chấm công theo nhân viên:", err);
    throw new Error("Lấy danh sách chấm công theo nhân viên thất bại");
  }
};

// ==============================
// 🟦 Tạo mới chấm công
// ==============================
export const createAttendance = async (data: {
  employeeId: number;
  workDate: string;
  checkIn?: string;
  checkOut?: string;
  status: string;
  notes?: string;
  workShiftId?: number;
}) => {
  try {
    const {
      employeeId,
      workDate,
      checkIn,
      checkOut,
      status,
      notes,
      workShiftId,
    } = data;

    // Check if attendance already exists for this employee and date
    const existingAttendance = await Attendance.findOne({
      where: {
        employee_id: employeeId, // 🚨 FIX: Sửa thành employee_id
        date: workDate,
      },
    });

    if (existingAttendance) {
      throw new Error(
        "Đã tồn tại dữ liệu chấm công cho nhân viên này trong ngày này"
      );
    }

    // Calculate actual hours if checkIn and checkOut are provided
    let actualHours = 0;
    if (checkIn && checkOut) {
      const checkInTime = new Date(`1970-01-01T${checkIn}`);
      const checkOutTime = new Date(`1970-01-01T${checkOut}`);
      actualHours =
        (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60) - 1; // Subtract 1 hour for lunch
    }

    const newAttendance = await Attendance.create({
      employee_id: employeeId, // 🚨 FIX: Sửa thành employee_id
      date: workDate,
      work_shift_id: workShiftId, // 🚨 FIX: Sửa thành work_shift_id
      checkin_time: checkIn, // 🚨 FIX: Sửa thành checkin_time
      checkout_time: checkOut, // 🚨 FIX: Sửa thành checkout_time
      status,
      notes,
      expected_hours: 8, // 🚨 FIX: Sửa thành expected_hours
      actual_hours: actualHours, // 🚨 FIX: Sửa thành actual_hours
    });

    // Reload with associations
    return await getAttendanceById(newAttendance.id);
  } catch (err: any) {
    console.error("Lỗi khi tạo dữ liệu chấm công:", err);
    throw new Error(err.message || "Tạo dữ liệu chấm công thất bại");
  }
};

// ==============================
// 🟧 Cập nhật chấm công
// ==============================
export const updateAttendance = async (
  id: number,
  data: {
    checkIn?: string;
    checkOut?: string;
    status?: string;
    notes?: string;
    workShiftId?: number;
  }
) => {
  try {
    const attendance = await Attendance.findByPk(id);
    if (!attendance) {
      throw new Error("Không tìm thấy chấm công để cập nhật");
    }

    const { checkIn, checkOut, status, notes, workShiftId } = data;

    // Calculate actual hours if checkIn and checkOut are provided
    let actualHours = attendance.actual_hours; // 🚨 FIX: Sửa thành actual_hours
    if (checkIn && checkOut) {
      const checkInTime = new Date(`1970-01-01T${checkIn}`);
      const checkOutTime = new Date(`1970-01-01T${checkOut}`);
      actualHours =
        (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60) - 1;
    }

    await attendance.update({
      checkin_time: checkIn !== undefined ? checkIn : attendance.checkin_time, // 🚨 FIX
      checkout_time:
        checkOut !== undefined ? checkOut : attendance.checkout_time, // 🚨 FIX
      status: status || attendance.status,
      notes: notes !== undefined ? notes : attendance.notes,
      work_shift_id:
        workShiftId !== undefined ? workShiftId : attendance.work_shift_id, // 🚨 FIX
      actual_hours: actualHours, // 🚨 FIX
    });

    // Reload with associations
    return await getAttendanceById(id);
  } catch (err) {
    console.error("Lỗi khi cập nhật chấm công:", err);
    throw new Error("Cập nhật chấm công thất bại");
  }
};

// ==============================
// 🟧 Cập nhật trạng thái chấm công
// ==============================
export const updateAttendanceStatus = async (id: number, status: string) => {
  try {
    const attendance = await Attendance.findByPk(id);
    if (!attendance) {
      throw new Error("Không tìm thấy chấm công để cập nhật");
    }

    await attendance.update({ status });

    // Reload with associations
    return await getAttendanceById(id);
  } catch (err) {
    console.error("Lỗi khi cập nhật trạng thái chấm công:", err);
    throw new Error("Cập nhật trạng thái chấm công thất bại");
  }
};

// ==============================
// 🟥 Xóa chấm công
// ==============================
export const deleteAttendance = async (id: number) => {
  try {
    const attendance = await Attendance.findByPk(id);
    if (!attendance) {
      throw new Error("Không tìm thấy chấm công để xóa");
    }

    await attendance.destroy();
    return true;
  } catch (err) {
    console.error("Lỗi khi xóa chấm công:", err);
    throw new Error("Xóa chấm công thất bại");
  }
};

// ==============================
// 🟥 Xóa hàng loạt chấm công
// ==============================
export const bulkDeleteAttendances = async (
  ids: number[]
): Promise<BulkOperationResult> => {
  try {
    const deletedCount = await Attendance.destroy({
      where: {
        id: {
          [Op.in]: ids,
        },
      },
    });

    return { deletedCount };
  } catch (err) {
    console.error("Lỗi khi xóa hàng loạt chấm công:", err);
    throw new Error("Xóa hàng loạt chấm công thất bại");
  }
};

// ==============================
// 🟧 Cập nhật trạng thái hàng loạt
// ==============================
export const bulkUpdateAttendanceStatus = async (
  ids: number[],
  status: string
): Promise<BulkOperationResult> => {
  try {
    const [updatedCount] = await Attendance.update(
      { status },
      {
        where: {
          id: {
            [Op.in]: ids,
          },
        },
      }
    );

    return { updatedCount };
  } catch (err) {
    console.error("Lỗi khi cập nhật trạng thái hàng loạt:", err);
    throw new Error("Cập nhật trạng thái hàng loạt thất bại");
  }
};

// ==============================
// 🟩 Lấy thống kê chấm công
// ==============================
export const getAttendanceStatistics = async (params: {
  dateFrom?: string;
  dateTo?: string;
  department?: string;
}): Promise<AttendanceStatistics> => {
  try {
    const { dateFrom, dateTo, department } = params;

    const whereConditions: any = {};
    const employeeWhereConditions: any = {};

    // Date filter
    if (dateFrom && dateTo) {
      whereConditions.date = {
        [Op.between]: [dateFrom, dateTo],
      };
    }

    // Department filter
    if (department) {
      const dept = await Department.findOne({
        where: { name: department },
      });
      if (dept) {
        employeeWhereConditions.department_id = dept.id; // 🚨 FIX: Sửa thành department_id
      }
    }

    const attendances = await Attendance.findAll({
      where: whereConditions,
      include: [
        {
          model: EmployeeInformation,
          as: "employee",
          where:
            Object.keys(employeeWhereConditions).length > 0
              ? employeeWhereConditions
              : undefined,
          required: Object.keys(employeeWhereConditions).length > 0,
        },
      ],
    });

    const statistics: AttendanceStatistics = {
      total: attendances.length,
      present: 0,
      absent: 0,
      late: 0,
      earlyLeave: 0,
      halfDay: 0,
      totalHours: 0,
    };

    attendances.forEach((attendance: any) => {
      switch (attendance.status) {
        case "present":
          statistics.present++;
          break;
        case "absent":
          statistics.absent++;
          break;
        case "late":
          statistics.late++;
          break;
        case "early_leave":
          statistics.earlyLeave++;
          break;
        case "half_day":
          statistics.halfDay++;
          break;
      }
      statistics.totalHours += attendance.actual_hours || 0; // 🚨 FIX: Sửa thành actual_hours
    });

    return statistics;
  } catch (err) {
    console.error("Lỗi khi lấy thống kê chấm công:", err);
    throw new Error("Lấy thống kê chấm công thất bại");
  }
};

// ==============================
// 🟩 Lấy danh sách nhân viên
// ==============================
export const getEmployees = async () => {
  try {
    const employees = await EmployeeInformation.findAll({
      where: { status: "active" },
      include: [
        {
          model: Department,
          as: "department",
        },
      ],
      order: [["full_name", "ASC"]], // 🚨 FIX: Sửa thành full_name
    });

    return employees;
  } catch (err) {
    console.error("Lỗi khi lấy danh sách nhân viên:", err);
    throw new Error("Lấy danh sách nhân viên thất bại");
  }
};

// ==============================
// 🟩 Lấy danh sách ca làm việc
// ==============================
export const getWorkShifts = async () => {
  try {
    const workShifts = await WorkShift.findAll({
      where: { is_active: true }, // 🚨 FIX: Sửa thành is_active
      order: [["name", "ASC"]],
    });

    return workShifts;
  } catch (err) {
    console.error("Lỗi khi lấy danh sách ca làm việc:", err);
    throw new Error("Lấy danh sách ca làm việc thất bại");
  }
};

// ==============================
// 🟦 Import từ Excel
// ==============================
export const importAttendancesFromExcel = async (
  file: any
): Promise<ImportResult> => {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer);

    const worksheet = workbook.worksheets[0];
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // Start from row 2 (skip header)
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      try {
        const row = worksheet.getRow(rowNumber);
        const employeeCode = row.getCell(1).value?.toString();
        const workDate = row.getCell(2).value?.toString();
        const checkIn = row.getCell(3).value?.toString();
        const checkOut = row.getCell(4).value?.toString();
        const status = row.getCell(5).value?.toString();
        const notes = row.getCell(6).value?.toString();

        // Validate required fields
        if (!employeeCode || !workDate) {
          errors.push(
            `Dòng ${rowNumber}: Thiếu mã nhân viên hoặc ngày làm việc`
          );
          failedCount++;
          continue;
        }

        // Find employee by code
        const employee = await EmployeeInformation.findOne({
          where: { employee_code: employeeCode }, // 🚨 FIX: Sửa thành employee_code
        });

        if (!employee) {
          errors.push(
            `Dòng ${rowNumber}: Không tìm thấy nhân viên với mã ${employeeCode}`
          );
          failedCount++;
          continue;
        }

        // Create attendance
        await Attendance.create({
          employee_id: employee.id, // 🚨 FIX
          date: workDate,
          checkin_time: checkIn, // 🚨 FIX
          checkout_time: checkOut, // 🚨 FIX
          status: status || "present",
          notes,
          expected_hours: 8, // 🚨 FIX
          actual_hours: calculateActualHours(checkIn, checkOut), // 🚨 FIX
        });

        successCount++;
      } catch (error: any) {
        errors.push(`Dòng ${rowNumber}: ${error.message}`);
        failedCount++;
      }
    }

    return { successCount, failedCount, errors };
  } catch (err) {
    console.error("Lỗi khi import dữ liệu chấm công:", err);
    throw new Error("Import dữ liệu chấm công thất bại");
  }
};

// ==============================
// 🟦 Export ra Excel
// ==============================
export const exportAttendancesToExcel = async (
  filters: any
): Promise<ExcelJS.Workbook> => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Dữ liệu chấm công");

    // Add headers
    worksheet.columns = [
      { header: "Mã NV", key: "employeeCode", width: 15 },
      { header: "Họ tên", key: "employeeName", width: 25 },
      { header: "Phòng ban", key: "departmentName", width: 20 },
      { header: "Ngày làm việc", key: "workDate", width: 15 },
      { header: "Giờ vào", key: "checkIn", width: 10 },
      { header: "Giờ ra", key: "checkOut", width: 10 },
      { header: "Trạng thái", key: "status", width: 12 },
      { header: "Số giờ thực tế", key: "actualHours", width: 15 },
      { header: "Ghi chú", key: "notes", width: 30 },
    ];

    // Get data based on filters
    const params: GetAttendancesParams = {
      page: 1,
      pageSize: 10000, // Large number to get all records
      filters: filters || {},
      sortBy: "date",
      sortOrder: "desc",
    };

    const result = await getAllAttendances(params);

    // Add data rows
    result.data.forEach((attendance: any) => {
      worksheet.addRow({
        employeeCode: attendance.employeeCode,
        employeeName: attendance.employeeName,
        departmentName: attendance.departmentName,
        workDate: attendance.date,
        checkIn: attendance.checkin_time, // 🚨 FIX
        checkOut: attendance.checkout_time, // 🚨 FIX
        status: getStatusDisplayName(attendance.status),
        actualHours: attendance.actual_hours, // 🚨 FIX
        notes: attendance.notes,
      });
    });

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE6E6FA" },
    };

    return workbook;
  } catch (err) {
    console.error("Lỗi khi export dữ liệu chấm công:", err);
    throw new Error("Export dữ liệu chấm công thất bại");
  }
};

// ==============================
// 🟦 Tải template
// ==============================
export const downloadTemplate = async (): Promise<ExcelJS.WorkBook> => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Template");

    // Add headers
    worksheet.columns = [
      { header: "Mã NV*", key: "employeeCode", width: 15 },
      { header: "Ngày làm việc* (YYYY-MM-DD)", key: "workDate", width: 20 },
      { header: "Giờ vào (HH:MM)", key: "checkIn", width: 15 },
      { header: "Giờ ra (HH:MM)", key: "checkOut", width: 15 },
      { header: "Trạng thái", key: "status", width: 12 },
      { header: "Ghi chú", key: "notes", width: 30 },
    ];

    // Add sample data
    worksheet.addRow({
      employeeCode: "NV001",
      workDate: "2024-01-15",
      checkIn: "08:00",
      checkOut: "17:00",
      status: "present",
      notes: "Làm việc đầy đủ",
    });

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE6E6FA" },
    };

    // Add instruction note
    worksheet.addRow([]);
    worksheet.addRow(["*: Bắt buộc"]);
    worksheet.addRow([
      "Trạng thái: present, absent, late, early_leave, half_day",
    ]);

    return workbook;
  } catch (err) {
    console.error("Lỗi khi tạo template:", err);
    throw new Error("Tạo template thất bại");
  }
};

// ==============================
// 🟦 Tính toán lại dữ liệu
// ==============================
export const recalculateAttendance = async (
  startDate: string,
  endDate: string,
  employeeId?: number
): Promise<BulkOperationResult> => {
  try {
    const whereConditions: any = {
      date: {
        [Op.between]: [startDate, endDate],
      },
    };

    if (employeeId) {
      whereConditions.employee_id = employeeId; // 🚨 FIX
    }

    const attendances = await Attendance.findAll({
      where: whereConditions,
    });

    let recalculatedCount = 0;

    for (const attendance of attendances) {
      if (attendance.checkin_time && attendance.checkout_time) {
        // 🚨 FIX
        const actualHours = calculateActualHours(
          attendance.checkin_time, // 🚨 FIX
          attendance.checkout_time // 🚨 FIX
        );

        if (actualHours !== attendance.actual_hours) {
          // 🚨 FIX
          await attendance.update({ actual_hours: actualHours }); // 🚨 FIX
          recalculatedCount++;
        }
      }
    }

    return { recalculatedCount };
  } catch (err) {
    console.error("Lỗi khi tính toán lại chấm công:", err);
    throw new Error("Tính toán lại chấm công thất bại");
  }
};

// ==============================
// 🟦 Đồng bộ từ logs
// ==============================
export const syncAttendanceFromLogs = async (params: {
  startDate?: string;
  endDate?: string;
  employeeId?: number;
}): Promise<BulkOperationResult> => {
  try {
    // TODO: Implement sync logic with attendance logs
    // This would involve querying the attendance_logs table and updating attendances
    return { syncedCount: 0 };
  } catch (err) {
    console.error("Lỗi khi đồng bộ dữ liệu từ logs:", err);
    throw new Error("Đồng bộ dữ liệu từ logs thất bại");
  }
};

// ==============================
// 🔧 HELPER FUNCTIONS
// ==============================

const calculateActualHours = (checkIn?: string, checkOut?: string): number => {
  if (!checkIn || !checkOut) return 0;

  try {
    const checkInTime = new Date(`1970-01-01T${checkIn}`);
    const checkOutTime = new Date(`1970-01-01T${checkOut}`);
    const hours =
      (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60) - 1; // Subtract 1 hour for lunch
    return Math.max(0, hours); // Ensure non-negative
  } catch {
    return 0;
  }
};

const getStatusDisplayName = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    present: "Có mặt",
    absent: "Vắng mặt",
    late: "Đi muộn",
    early_leave: "Về sớm",
    half_day: "Nửa ngày",
  };
  return statusMap[status] || status;
};
