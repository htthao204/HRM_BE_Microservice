import ExcelJS from "exceljs";
// services/leaveService.ts
import { Op } from "sequelize";
import { Leave } from "../models/leaveModel";
import { EmployeeInformation } from "../models/employeeModel";
import { LeaveType } from "../models/leaveTypeModel";
import { LeaveCreationAttributes } from "../models/leaveModel";
import Department from "../models/departmentModel";
import sequelize from "../config/db";
interface ImportResult {
  total: number;
  success: number;
  errors: string[];
  duplicates: number;
  updated: number;
}
export interface LeaveBalance {
  leaveTypeId: number;
  leaveTypeName: string;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  maxDays?: number;
}

export interface LeaveBalanceSummary {
  totalAvailable: number;
  totalUsed: number;
  totalRemaining: number;
}

export interface LeaveBalanceData {
  balances: LeaveBalance[];
  summary: LeaveBalanceSummary;
  employeeId: number;
  year: number;
}
export const getLeaveBalance = async (
  employeeId: number,
  year?: number
): Promise<LeaveBalanceData> => {
  try {
    const currentYear = year || new Date().getFullYear();

    console.log(
      `🟢 Tính số ngày phép cho nhân viên ${employeeId}, năm ${currentYear}`
    );

    // 1. Kiểm tra nhân viên tồn tại
    const employee = await EmployeeInformation.findByPk(employeeId);
    if (!employee) {
      throw new Error(`Không tìm thấy nhân viên với ID: ${employeeId}`);
    }

    // 2. Lấy danh sách loại nghỉ phép đang hoạt động
    const leaveTypes = await LeaveType.findAll({
      where: { isActive: true },
      attributes: ["id", "name", "code", "defaultDays", "maxDays"],
    });

    console.log(`✅ Tìm thấy ${leaveTypes.length} loại nghỉ phép`);

    // 3. Lấy số ngày phép đã sử dụng trong năm
    const usedLeavesQuery = `
      SELECT 
        l.leave_type_id as "leaveTypeId",
        SUM(l.days_taken) as "totalUsedDays"
      FROM leaves l
      WHERE l.employee_id = :employeeId
        AND l.status = 'approved'
        AND EXTRACT(YEAR FROM l.start_date) = :year
      GROUP BY l.leave_type_id
    `;

    const usedLeaves: any[] = await sequelize.query(usedLeavesQuery, {
      replacements: { employeeId, year: currentYear },
      type: "SELECT",
    });

    console.log(`✅ Đã sử dụng ${usedLeaves.length} loại nghỉ phép`);

    // 4. Tính toán số ngày còn lại cho từng loại
    const balances: LeaveBalance[] = leaveTypes.map((leaveType) => {
      const usedLeave = usedLeaves.find(
        (ul) => ul.leaveTypeId === leaveType.id
      );
      const usedDays = usedLeave ? parseInt(usedLeave.totalUsedDays) || 0 : 0;

      // Số ngày tối đa = maxDays nếu có, không thì dùng defaultDays
      const maxDays = leaveType.maxDays || leaveType.defaultDays;
      const remainingDays = Math.max(0, maxDays - usedDays);

      return {
        leaveTypeId: leaveType.id,
        leaveTypeName: leaveType.name,
        totalDays: maxDays, // Tổng số ngày được phép
        usedDays: usedDays, // Số ngày đã dùng
        remainingDays: remainingDays, // Số ngày còn lại
        maxDays: maxDays,
      };
    });

    // 5. Tính tổng số liệu
    const summary: LeaveBalanceSummary = {
      totalAvailable: balances.reduce(
        (sum, balance) => sum + balance.totalDays,
        0
      ),
      totalUsed: balances.reduce((sum, balance) => sum + balance.usedDays, 0),
      totalRemaining: balances.reduce(
        (sum, balance) => sum + balance.remainingDays,
        0
      ),
    };

    console.log(
      `✅ Tính toán xong: Tổng ${summary.totalAvailable} ngày, đã dùng ${summary.totalUsed} ngày, còn lại ${summary.totalRemaining} ngày`
    );

    return {
      balances,
      summary,
      employeeId,
      year: currentYear,
    };
  } catch (error) {
    console.error("❌ Lỗi khi tính số ngày phép:", error);
    throw new Error(`Không thể tính số ngày phép: ${error.message}`);
  }
};

// 🟪 Lấy số ngày phép còn lại với fallback data (cho demo)
export const getLeaveBalanceWithFallback = async (
  employeeId: number,
  year?: number
): Promise<LeaveBalanceData> => {
  try {
    return await getLeaveBalance(employeeId, year);
  } catch (error) {
    console.warn("⚠️ Sử dụng dữ liệu fallback cho số ngày phép");

    // Dữ liệu mẫu cho demo
    const currentYear = year || new Date().getFullYear();

    const balances: LeaveBalance[] = [
      {
        leaveTypeId: 1,
        leaveTypeName: "Phép năm",
        totalDays: 12,
        usedDays: 3,
        remainingDays: 9,
        maxDays: 12,
      },
      {
        leaveTypeId: 2,
        leaveTypeName: "Phép ốm",
        totalDays: 10,
        usedDays: 2,
        remainingDays: 8,
        maxDays: 10,
      },
      {
        leaveTypeId: 3,
        leaveTypeName: "Phép không lương",
        totalDays: 0,
        usedDays: 0,
        remainingDays: 0,
      },
      {
        leaveTypeId: 4,
        leaveTypeName: "Phép cưới",
        totalDays: 3,
        usedDays: 0,
        remainingDays: 3,
        maxDays: 3,
      },
      {
        leaveTypeId: 5,
        leaveTypeName: "Phép tang",
        totalDays: 3,
        usedDays: 1,
        remainingDays: 2,
        maxDays: 3,
      },
    ];

    const summary: LeaveBalanceSummary = {
      totalAvailable: balances.reduce(
        (sum, balance) => sum + balance.totalDays,
        0
      ),
      totalUsed: balances.reduce((sum, balance) => sum + balance.usedDays, 0),
      totalRemaining: balances.reduce(
        (sum, balance) => sum + balance.remainingDays,
        0
      ),
    };

    return {
      balances,
      summary,
      employeeId,
      year: currentYear,
    };
  }
};
export const getLeavesByFilter = async (
  page: number = 1,
  pageSize: number = 10,
  filter: any = {}
) => {
  const offset = (page - 1) * pageSize;
  const where: any = {};

  if (filter.employeeId) where.employeeId = filter.employeeId;
  if (filter.leaveTypeId) where.leaveTypeId = filter.leaveTypeId;
  if (filter.status) where.status = filter.status;

  // Parse ngày (nếu có) — chuyển sang Date string hoặc giữ nguyên tùy DB; Sequelize chấp nhận ISO string
  if (filter.startDateFrom || filter.startDateTo) {
    where.startDate = {};
    if (filter.startDateFrom)
      where.startDate[Op.gte] = new Date(filter.startDateFrom);
    if (filter.startDateTo)
      where.startDate[Op.lte] = new Date(filter.startDateTo);
  }

  if (filter.endDateFrom || filter.endDateTo) {
    where.endDate = {};
    if (filter.endDateFrom)
      where.endDate[Op.gte] = new Date(filter.endDateFrom);
    if (filter.endDateTo) where.endDate[Op.lte] = new Date(filter.endDateTo);
  }

  const include: any[] = [
    {
      model: EmployeeInformation,
      as: "leaveEmployee", // phải khớp alias association
      attributes: ["id", "employeeCode", "fullName", "email"], // dùng attribute names của model
      include: [
        {
          model: Department,
          as: "employeeDepartment", // phải khớp alias association
          attributes: ["id", "name"],
          where: filter.departmentId ? { id: filter.departmentId } : undefined,
          required: !!filter.departmentId,
        },
      ],
      where: filter.employeeName
        ? {
            [Op.or]: [
              { fullName: { [Op.iLike]: `%${filter.employeeName}%` } },
              { employeeCode: { [Op.iLike]: `%${filter.employeeName}%` } },
            ],
          }
        : undefined,
      required: !!(filter.employeeName || filter.departmentId),
    },
    {
      model: LeaveType,
      as: "leaveType",
      attributes: ["id", "name", "code"],
      where: filter.leaveTypeName
        ? { name: { [Op.iLike]: `%${filter.leaveTypeName}%` } }
        : undefined,
      required: !!filter.leaveTypeName,
    },
  ];

  const { count, rows } = await Leave.findAndCountAll({
    where,
    include,
    limit: pageSize,
    offset,
    order: [["startDate", "ASC"]],
    distinct: true,
  });

  return {
    totalItems: count,
    totalPages: Math.ceil(count / pageSize),
    currentPage: page,
    data: rows.map((r) => r.get({ plain: true })),
  };
};
export const getLeaveById = async (id: number) => {
  const leave = await Leave.findByPk(id, {
    include: [
      { model: EmployeeInformation, as: "leaveEmployee" },
      { model: LeaveType, as: "leaveType" },
      { model: EmployeeInformation, as: "leaveApprover" },
    ],
  });
  return leave?.get({ plain: true }) || null;
};

export const createLeave = async (data: LeaveCreationAttributes) => {
  const leave = await Leave.create(data);
  return leave.get({ plain: true });
};

export const updateLeave = async (
  id: number,
  data: Partial<LeaveCreationAttributes>
) => {
  const leave = await Leave.findByPk(id);
  if (!leave) throw new Error("Leave not found");
  await leave.update(data);
  return leave.get({ plain: true });
};

export const deleteLeave = async (id: number) => {
  const leave = await Leave.findByPk(id);
  if (!leave) throw new Error("Leave not found");
  await leave.destroy();
  return { message: "Leave deleted successfully" };
};
// 🟪 Export leaves to Excel - ĐÃ SỬA
export const exportLeavesToExcel = async (filter?: {
  employeeIds?: number[];
  leaveTypeIds?: number[];
  status?: string;
  startDateFrom?: string;
  startDateTo?: string;
  departmentId?: number;
  selectedIds?: number[]; // 👈 ĐÃ THÊM
}): Promise<ExcelJS.Workbook> => {
  try {
    console.log("Bắt đầu export đơn nghỉ phép với filter:", filter);

    // 🟪 XÂY DỰNG WHERE CLAUSE
    let whereClause = "WHERE 1=1";
    const replacements: any = {};

    // 👈 ƯU TIÊN selectedIds NẾU CÓ
    if (filter?.selectedIds && filter.selectedIds.length > 0) {
      const validIds = filter.selectedIds
        .filter((id) => !isNaN(Number(id)))
        .map(Number);
      if (validIds.length > 0) {
        whereClause += " AND l.id IN (:selectedIds)";
        replacements.selectedIds = validIds;
      }
    } else {
      // Các filter khác chỉ áp dụng khi KHÔNG có selectedIds

      // Filter theo employeeIds
      if (filter?.employeeIds && filter.employeeIds.length > 0) {
        const validIds = filter.employeeIds
          .filter((id) => !isNaN(Number(id)))
          .map(Number);
        if (validIds.length > 0) {
          whereClause += " AND l.employee_id IN (:employeeIds)";
          replacements.employeeIds = validIds;
        }
      }

      // Filter theo leaveTypeIds
      if (filter?.leaveTypeIds && filter.leaveTypeIds.length > 0) {
        const validIds = filter.leaveTypeIds
          .filter((id) => !isNaN(Number(id)))
          .map(Number);
        if (validIds.length > 0) {
          whereClause += " AND l.leave_type_id IN (:leaveTypeIds)";
          replacements.leaveTypeIds = validIds;
        }
      }

      // Filter theo status
      if (filter?.status && filter.status.trim() !== "") {
        whereClause += " AND l.status = :status";
        replacements.status = filter.status.trim();
      }

      // Filter theo startDate
      if (filter?.startDateFrom) {
        whereClause += " AND l.start_date >= :startDateFrom";
        replacements.startDateFrom = filter.startDateFrom;
      }
      if (filter?.startDateTo) {
        whereClause += " AND l.start_date <= :startDateTo";
        replacements.startDateTo = filter.startDateTo;
      }

      // Filter theo departmentId
      if (filter?.departmentId) {
        whereClause += " AND e.department_id = :departmentId";
        replacements.departmentId = filter.departmentId;
      }
    }

    console.log("Where clause:", whereClause);
    console.log("Replacements:", replacements);

    // 🟪 RAW QUERY ĐỂ LẤY DỮ LIỆU
    const query = `
      SELECT 
        l.id,
        l.start_date as "startDate",
        l.end_date as "endDate",
        l.days_taken as "daysTaken",
        l.reason,
        l.status,
        l.approved_at as "approvedAt",
        l.created_at as "createdAt",
        e."employee_code" as "employeeCode",
        e."full_name" as "employeeName",
        d.name as "departmentName",
        lt.name as "leaveTypeName",
        lt.code as "leaveTypeCode",
        a."full_name" as "approverName"
      FROM leaves l
      LEFT JOIN employee_information e ON l.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN leave_types lt ON l.leave_type_id = lt.id
      LEFT JOIN employee_information a ON l.approved_by = a.id
      ${whereClause}
      ORDER BY l.start_date DESC, l.created_at DESC
    `;

    const leaves: any[] = await sequelize.query(query, {
      replacements,
      type: "SELECT",
    });

    console.log(`✅ Tìm thấy ${leaves.length} đơn nghỉ phép`);

    // 🟪 TẠO WORKBOOK
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Danh sách đơn nghỉ phép");

    // Định nghĩa columns
    worksheet.columns = [
      { header: "STT", key: "stt", width: 8 },
      { header: "Mã NV", key: "employeeCode", width: 15 },
      { header: "Tên nhân viên", key: "employeeName", width: 25 },
      { header: "Phòng ban", key: "departmentName", width: 20 },
      { header: "Loại nghỉ phép", key: "leaveTypeName", width: 20 },
      { header: "Mã loại nghỉ", key: "leaveTypeCode", width: 15 },
      { header: "Ngày bắt đầu", key: "startDate", width: 15 },
      { header: "Ngày kết thúc", key: "endDate", width: 15 },
      { header: "Số ngày nghỉ", key: "daysTaken", width: 12 },
      { header: "Lý do", key: "reason", width: 30 },
      { header: "Trạng thái", key: "status", width: 15 },
      { header: "Người duyệt", key: "approverName", width: 20 },
      { header: "Ngày duyệt", key: "approvedAt", width: 15 },
      { header: "Ngày tạo", key: "createdAt", width: 15 },
    ];

    // Style cho header
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "2E86AB" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };

    // 🟪 THÊM DỮ LIỆU
    leaves.forEach((leave, index) => {
      const row = worksheet.addRow({
        stt: index + 1,
        employeeCode: leave.employeeCode || "N/A",
        employeeName: leave.employeeName || "N/A",
        departmentName: leave.departmentName || "N/A",
        leaveTypeName: leave.leaveTypeName || "N/A",
        leaveTypeCode: leave.leaveTypeCode || "N/A",
        startDate: leave.startDate
          ? new Date(leave.startDate).toLocaleDateString("vi-VN")
          : "N/A",
        endDate: leave.endDate
          ? new Date(leave.endDate).toLocaleDateString("vi-VN")
          : "N/A",
        daysTaken: leave.daysTaken || 0,
        reason: leave.reason || "",
        status: getStatusText(leave.status),
        approverName: leave.approverName || "Chưa duyệt",
        approvedAt: leave.approvedAt
          ? new Date(leave.approvedAt).toLocaleDateString("vi-VN")
          : "N/A",
        createdAt: leave.createdAt
          ? new Date(leave.createdAt).toLocaleDateString("vi-VN")
          : "N/A",
      });

      // Căn giữa cho các ô
      row.eachCell((cell, colNumber) => {
        if (colNumber !== 10 && colNumber !== 6 && colNumber !== 7) {
          // Trừ cột lý do và ngày
          cell.alignment = { vertical: "middle", horizontal: "center" };
        }
      });
    });

    // Căn trái cho cột lý do
    worksheet.getColumn(10).alignment = {
      vertical: "middle",
      horizontal: "left",
    };

    // Auto filter
    if (leaves.length > 0) {
      worksheet.autoFilter = {
        from: "A1",
        to: `N${leaves.length + 1}`,
      };
    }

    console.log("✅ Xuất Excel đơn nghỉ phép thành công");
    return workbook;
  } catch (error) {
    console.error("❌ Lỗi xuất Excel đơn nghỉ phép:", error);
    throw new Error(`Không thể xuất file Excel: ${error.message}`);
  }
};

// 🟪 Xuất file Excel và trả về buffer - ĐÃ SỬA
export const exportLeavesToExcelBuffer = async (
  filter?: any
): Promise<Buffer> => {
  try {
    console.log("🟢 Bắt đầu exportLeavesToExcelBuffer");
    console.log("Filter nhận được:", filter);

    const workbook = await exportLeavesToExcel(filter);
    const buffer = await workbook.xlsx.writeBuffer();

    console.log("✅ Tạo buffer thành công");
    return Buffer.from(buffer);
  } catch (error) {
    console.error("❌ Lỗi xuất Excel buffer:", error);
    throw new Error(`Không thể tạo file Excel: ${error.message}`);
  }
};

// 🟪 Nhập đơn nghỉ phép từ file Excel
export const importLeavesFromExcel = async (
  fileBuffer: Buffer
): Promise<ImportResult> => {
  const results: ImportResult = {
    total: 0,
    success: 0,
    errors: [] as string[],
    duplicates: 0,
    updated: 0,
  };

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new Error("File Excel không có dữ liệu");
    }

    // Bắt đầu từ dòng 2 (bỏ qua header)
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);

      // Bỏ qua dòng trống
      if (!row.getCell(1).value && !row.getCell(2).value) continue;

      try {
        // Lấy dữ liệu từ các cell theo template
        const employeeCode = row.getCell(1).value?.toString().trim();
        const leaveTypeCode = row.getCell(2).value?.toString().trim();
        const startDateStr = row.getCell(3).value?.toString().trim();
        const endDateStr = row.getCell(4).value?.toString().trim();
        const reason = row.getCell(5).value?.toString().trim();
        const statusText = row.getCell(6).value?.toString().trim();

        // Validate dữ liệu bắt buộc
        if (!employeeCode || !leaveTypeCode || !startDateStr || !endDateStr) {
          results.errors.push(
            `Dòng ${rowNumber}: Thiếu thông tin bắt buộc (Mã NV, Mã loại nghỉ, Ngày bắt đầu, Ngày kết thúc)`
          );
          continue;
        }

        // Parse dates
        const startDate = this.parseExcelDate(startDateStr);
        const endDate = this.parseExcelDate(endDateStr);

        if (!startDate || !endDate) {
          results.errors.push(`Dòng ${rowNumber}: Ngày tháng không hợp lệ`);
          continue;
        }

        if (endDate < startDate) {
          results.errors.push(
            `Dòng ${rowNumber}: Ngày kết thúc phải sau ngày bắt đầu`
          );
          continue;
        }

        // Tính số ngày nghỉ
        const daysTaken =
          Math.ceil(
            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
          ) + 1;

        // Tìm employee
        const employee = await EmployeeInformation.findOne({
          where: { employeeCode },
        });

        if (!employee) {
          results.errors.push(
            `Dòng ${rowNumber}: Không tìm thấy nhân viên với mã ${employeeCode}`
          );
          continue;
        }

        // Tìm leave type
        const leaveType = await LeaveType.findOne({
          where: { code: leaveTypeCode },
        });

        if (!leaveType) {
          results.errors.push(
            `Dòng ${rowNumber}: Không tìm thấy loại nghỉ phép với mã ${leaveTypeCode}`
          );
          continue;
        }

        // Map status
        const statusMap: { [key: string]: string } = {
          "chờ duyệt": "pending",
          pending: "pending",
          "đã duyệt": "approved",
          approved: "approved",
          "từ chối": "rejected",
          rejected: "rejected",
          "đã hủy": "cancelled",
          cancelled: "cancelled",
        };

        const status = statusMap[statusText?.toLowerCase()] || "pending";

        // Kiểm tra trùng lặp (cùng nhân viên, cùng ngày)
        const existingLeave = await Leave.findOne({
          where: {
            employeeId: employee.id,
            leaveTypeId: leaveType.id,
            startDate,
            endDate,
          },
        });

        const leaveData: any = {
          employeeId: employee.id,
          leaveTypeId: leaveType.id,
          startDate,
          endDate,
          daysTaken,
          reason: reason || "",
          status,
        };

        if (existingLeave) {
          // Cập nhật nếu đã tồn tại
          await existingLeave.update(leaveData);
          results.updated++;
        } else {
          // Tạo mới
          await Leave.create(leaveData);
          results.success++;
        }

        results.total++;
      } catch (rowError: any) {
        results.errors.push(`Dòng ${rowNumber}: ${rowError.message}`);
      }
    }

    return results;
  } catch (error: any) {
    console.error("Lỗi nhập Excel đơn nghỉ phép:", error);
    throw new Error(`Lỗi nhập file: ${error.message}`);
  }
};

// 🟪 Tạo template Excel
export const createLeaveTemplate = async (): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Template đơn nghỉ phép");

  // Header với màu sắc
  worksheet.columns = [
    { header: "Mã nhân viên (*)", key: "employeeCode", width: 15 },
    { header: "Mã loại nghỉ (*)", key: "leaveTypeCode", width: 15 },
    { header: "Ngày bắt đầu (*)", key: "startDate", width: 15 },
    { header: "Ngày kết thúc (*)", key: "endDate", width: 15 },
    { header: "Lý do", key: "reason", width: 30 },
    { header: "Trạng thái", key: "status", width: 15 },
  ];

  // Style header
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "2E86AB" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };

  // Thêm dữ liệu mẫu
  const sampleData = [
    {
      employeeCode: "NV001",
      leaveTypeCode: "ANNUAL",
      startDate: "2024-01-15",
      endDate: "2024-01-20",
      reason: "Nghỉ phép năm",
      status: "Chờ duyệt",
    },
    {
      employeeCode: "NV002",
      leaveTypeCode: "SICK",
      startDate: "2024-01-10",
      endDate: "2024-01-11",
      reason: "Nghỉ ốm",
      status: "Đã duyệt",
    },
  ];

  sampleData.forEach((data) => {
    worksheet.addRow(data);
  });

  // Thêm ghi chú
  worksheet.addRow([]);
  worksheet.addRow(["Ghi chú:"]);
  worksheet.addRow(["(*) : Thông tin bắt buộc"]);
  worksheet.addRow(["Trạng thái: Chờ duyệt / Đã duyệt / Từ chối / Đã hủy"]);
  worksheet.addRow(["Mã nhân viên: Phải tồn tại trong hệ thống"]);
  worksheet.addRow(["Mã loại nghỉ: Phải tồn tại trong hệ thống"]);
  worksheet.addRow(["Định dạng ngày: YYYY-MM-DD hoặc DD/MM/YYYY"]);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

// 🟪 Hàm hỗ trợ - Chuyển đổi status
const getStatusText = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    pending: "Chờ duyệt",
    approved: "Đã duyệt",
    rejected: "Từ chối",
    cancelled: "Đã hủy",
  };
  return statusMap[status] || status;
};

// 🟪 Hàm hỗ trợ - Parse date từ Excel
const parseExcelDate = (dateStr: string): Date | null => {
  try {
    // Thử parse theo định dạng Việt Nam
    const viDateMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (viDateMatch) {
      const [_, day, month, year] = viDateMatch;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    // Thử parse theo ISO
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }

    return null;
  } catch {
    return null;
  }
};
