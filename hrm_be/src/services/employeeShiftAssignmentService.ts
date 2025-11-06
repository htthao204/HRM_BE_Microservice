import ExcelJS from "exceljs";
// services/employeeShiftAssignmentService.ts
import { Op } from "sequelize";
import EmployeeShiftAssignment from "../models/employeeShiftAssignmentModel";
import { EmployeeInformation } from "../models/employeeModel";
import { WorkShift } from "../models/workShiftModel";

export interface EmployeeShiftAssignmentCreateRequest {
  employeeId: number;
  workShiftId: number;
  assignmentDate: string;
  assignmentType?: "regular" | "overtime" | "special";
  approvedBy?: number | null;
  status?: "scheduled" | "confirmed" | "cancelled";
  notes?: string | null;
}
export interface ImportResult {
  total: number;
  success: number;
  errors: string[];
  duplicates: number;
  updated: number;
}
export interface EmployeeShiftAssignmentUpdateRequest {
  workShiftId?: number;
  assignmentDate?: string;
  assignmentType?: "regular" | "overtime" | "special";
  approvedBy?: number | null;
  status?: "scheduled" | "confirmed" | "cancelled";
  notes?: string | null;
}
const getAssignmentTypeText = (type: string): string => {
  const typeMap: { [key: string]: string } = {
    regular: "Thường",
    overtime: "Tăng ca",
    special: "Đặc biệt",
  };
  return typeMap[type] || type;
};
const getStatusText = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    scheduled: "Đã lên lịch",
    confirmed: "Đã xác nhận",
    cancelled: "Đã hủy",
  };
  return statusMap[status] || status;
};
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
export const exportEmployeeShiftAssignmentsToExcel = async (filter?: {
  employeeIds?: number[];
  workShiftIds?: number[];
  assignmentType?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<ExcelJS.Workbook> => {
  try {
    console.log("Bắt đầu export phân ca làm việc với filter:", filter);

    // 🟪 XÂY DỰNG WHERE CLAUSE
    let whereClause = "WHERE 1=1";
    const replacements: any = {};

    // Filter theo employeeIds
    if (filter?.employeeIds && filter.employeeIds.length > 0) {
      const validIds = filter.employeeIds
        .filter((id) => !isNaN(Number(id)))
        .map(Number);
      if (validIds.length > 0) {
        whereClause += " AND esa.employee_id IN (:employeeIds)";
        replacements.employeeIds = validIds;
      }
    }

    // Filter theo workShiftIds
    if (filter?.workShiftIds && filter.workShiftIds.length > 0) {
      const validIds = filter.workShiftIds
        .filter((id) => !isNaN(Number(id)))
        .map(Number);
      if (validIds.length > 0) {
        whereClause += " AND esa.work_shift_id IN (:workShiftIds)";
        replacements.workShiftIds = validIds;
      }
    }

    // Filter theo assignmentType
    if (filter?.assignmentType && filter.assignmentType.trim() !== "") {
      whereClause += " AND esa.assignment_type = :assignmentType";
      replacements.assignmentType = filter.assignmentType.trim();
    }

    // Filter theo status
    if (filter?.status && filter.status.trim() !== "") {
      whereClause += " AND esa.status = :status";
      replacements.status = filter.status.trim();
    }

    // Filter theo date range
    if (filter?.dateFrom && filter?.dateTo) {
      whereClause += " AND esa.assignment_date BETWEEN :dateFrom AND :dateTo";
      replacements.dateFrom = filter.dateFrom;
      replacements.dateTo = filter.dateTo;
    }

    console.log("Where clause:", whereClause);

    // 🟪 RAW QUERY ĐỂ LẤY DỮ LIỆU
    const query = `
      SELECT 
        esa.id,
        esa.assignment_date as "assignmentDate",
        esa.assignment_type as "assignmentType",
        esa.status,
        esa.notes,
        esa.created_at as "createdAt",
        esa.updated_at as "updatedAt",
        ei.employee_code as "employeeCode",
        ei.full_name as "employeeName",
        ws.code as "shiftCode",
        ws.name as "shiftName",
        ws.start_time as "shiftStartTime",
        ws.end_time as "shiftEndTime",
        approver.employee_code as "approverCode",
        approver.full_name as "approverName"
      FROM employee_shift_assignments esa
      LEFT JOIN employee_information ei ON esa.employee_id = ei.id
      LEFT JOIN work_shifts ws ON esa.work_shift_id = ws.id
      LEFT JOIN employee_information approver ON esa.approved_by = approver.id
      ${whereClause}
      ORDER BY esa.assignment_date DESC, ei.full_name ASC
    `;

    const assignments: any[] = await sequelize.query(query, {
      replacements,
      type: "SELECT",
    });

    console.log(`✅ Tìm thấy ${assignments.length} phân ca làm việc`);

    // 🟪 TẠO WORKBOOK
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Phân ca làm việc");

    // Định nghĩa columns
    worksheet.columns = [
      { header: "STT", key: "stt", width: 8 },
      { header: "Mã NV", key: "employeeCode", width: 15 },
      { header: "Tên nhân viên", key: "employeeName", width: 25 },
      { header: "Ngày phân ca", key: "assignmentDate", width: 15 },
      { header: "Mã ca", key: "shiftCode", width: 15 },
      { header: "Tên ca", key: "shiftName", width: 20 },
      { header: "Giờ bắt đầu", key: "shiftStartTime", width: 12 },
      { header: "Giờ kết thúc", key: "shiftEndTime", width: 12 },
      { header: "Loại ca", key: "assignmentType", width: 15 },
      { header: "Trạng thái", key: "status", width: 15 },
      { header: "Người duyệt", key: "approverName", width: 20 },
      { header: "Mã người duyệt", key: "approverCode", width: 15 },
      { header: "Ghi chú", key: "notes", width: 30 },
      { header: "Ngày tạo", key: "createdAt", width: 15 },
      { header: "Ngày cập nhật", key: "updatedAt", width: 15 },
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
    assignments.forEach((assignment, index) => {
      const row = worksheet.addRow({
        stt: index + 1,
        employeeCode: assignment.employeeCode || "N/A",
        employeeName: assignment.employeeName || "N/A",
        assignmentDate: assignment.assignmentDate
          ? new Date(assignment.assignmentDate).toLocaleDateString("vi-VN")
          : "N/A",
        shiftCode: assignment.shiftCode || "N/A",
        shiftName: assignment.shiftName || "N/A",
        shiftStartTime: assignment.shiftStartTime || "N/A",
        shiftEndTime: assignment.shiftEndTime || "N/A",
        assignmentType: getAssignmentTypeText(assignment.assignmentType),
        status: getStatusText(assignment.status),
        approverName: assignment.approverName || "N/A",
        approverCode: assignment.approverCode || "N/A",
        notes: assignment.notes || "N/A",
        createdAt: assignment.createdAt
          ? new Date(assignment.createdAt).toLocaleDateString("vi-VN")
          : "N/A",
        updatedAt: assignment.updatedAt
          ? new Date(assignment.updatedAt).toLocaleDateString("vi-VN")
          : "N/A",
      });

      // Căn giữa cho các ô
      row.eachCell((cell, colNumber) => {
        if (colNumber !== 13 && colNumber !== 3) {
          // Trừ cột ghi chú và tên nhân viên
          cell.alignment = { vertical: "middle", horizontal: "center" };
        }
      });
    });

    // Căn trái cho các cột text dài
    worksheet.getColumn(3).alignment = {
      vertical: "middle",
      horizontal: "left",
    }; // Tên nhân viên
    worksheet.getColumn(13).alignment = {
      vertical: "middle",
      horizontal: "left",
    }; // Ghi chú

    // Auto filter
    if (assignments.length > 0) {
      worksheet.autoFilter = {
        from: "A1",
        to: `O${assignments.length + 1}`,
      };
    }

    console.log("✅ Xuất Excel phân ca làm việc thành công");
    return workbook;
  } catch (error: any) {
    console.error("❌ Lỗi xuất Excel phân ca làm việc:", error);
    throw new Error(`Không thể xuất file Excel: ${error.message}`);
  }
};

// 🟪 Xuất file Excel và trả về buffer
export const exportEmployeeShiftAssignmentsToExcelBuffer = async (
  filter?: any
): Promise<Buffer> => {
  try {
    console.log("🟢 Bắt đầu exportEmployeeShiftAssignmentsToExcelBuffer");
    console.log("Filter nhận được:", filter);

    const workbook = await exportEmployeeShiftAssignmentsToExcel(filter);
    const buffer = await workbook.xlsx.writeBuffer();

    console.log("✅ Tạo buffer thành công");
    return Buffer.from(buffer);
  } catch (error: any) {
    console.error("❌ Lỗi xuất Excel buffer:", error);
    throw new Error(`Không thể tạo file Excel: ${error.message}`);
  }
};

// 🟪 Nhập phân ca làm việc từ file Excel
export const importEmployeeShiftAssignmentsFromExcel = async (
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
        const assignmentDateStr = row.getCell(2).value?.toString().trim();
        const shiftCode = row.getCell(3).value?.toString().trim();
        const assignmentTypeText = row.getCell(4).value?.toString().trim();
        const statusText = row.getCell(5).value?.toString().trim();
        const approverCode = row.getCell(6).value?.toString().trim();
        const notes = row.getCell(7).value?.toString().trim();

        // Validate dữ liệu bắt buộc
        if (!employeeCode || !assignmentDateStr || !shiftCode) {
          results.errors.push(
            `Dòng ${rowNumber}: Thiếu thông tin bắt buộc (Mã NV, Ngày phân ca, Mã ca)`
          );
          continue;
        }

        // Parse date
        const assignmentDate = parseExcelDate(assignmentDateStr);
        if (!assignmentDate) {
          results.errors.push(
            `Dòng ${rowNumber}: Định dạng ngày không hợp lệ "${assignmentDateStr}"`
          );
          continue;
        }

        // Map assignment type
        const assignmentTypeMap: { [key: string]: string } = {
          thường: "regular",
          regular: "regular",
          "tăng ca": "overtime",
          overtime: "overtime",
          "đặc biệt": "special",
          special: "special",
        };

        const assignmentType =
          assignmentTypeMap[assignmentTypeText?.toLowerCase()] || "regular";

        // Map status
        const statusMap: { [key: string]: string } = {
          "đã lên lịch": "scheduled",
          scheduled: "scheduled",
          "đã xác nhận": "confirmed",
          confirmed: "confirmed",
          "đã hủy": "cancelled",
          cancelled: "cancelled",
        };

        const status = statusMap[statusText?.toLowerCase()] || "scheduled";

        // Tìm employee
        const employee = await EmployeeInformation.findOne({
          where: { employeeCode },
        });

        if (!employee) {
          results.errors.push(
            `Dòng ${rowNumber}: Không tìm thấy nhân viên với mã "${employeeCode}"`
          );
          continue;
        }

        // Tìm work shift
        const workShift = await WorkShift.findOne({
          where: { code: shiftCode },
        });

        if (!workShift) {
          results.errors.push(
            `Dòng ${rowNumber}: Không tìm thấy ca làm việc với mã "${shiftCode}"`
          );
          continue;
        }

        // Tìm approver nếu có
        let approvedBy = null;
        if (approverCode && approverCode.trim() !== "") {
          const approver = await EmployeeInformation.findOne({
            where: { employeeCode: approverCode },
          });
          if (approver) {
            approvedBy = approver.id;
          } else {
            results.errors.push(
              `Dòng ${rowNumber}: Không tìm thấy người duyệt với mã "${approverCode}"`
            );
          }
        }

        // Kiểm tra trùng lặp (cùng nhân viên, cùng ngày, cùng ca)
        const existingAssignment = await EmployeeShiftAssignment.findOne({
          where: {
            employeeId: employee.id,
            assignmentDate: assignmentDate.toISOString().split("T")[0],
            workShiftId: workShift.id,
          },
        });

        const assignmentData: any = {
          employeeId: employee.id,
          workShiftId: workShift.id,
          assignmentDate: assignmentDate.toISOString().split("T")[0],
          assignmentType,
          status,
          approvedBy,
          notes: notes || null,
        };

        if (existingAssignment) {
          // Cập nhật nếu đã tồn tại
          await existingAssignment.update(assignmentData);
          results.updated++;
        } else {
          // Tạo mới
          await EmployeeShiftAssignment.create(assignmentData);
          results.success++;
        }

        results.total++;
      } catch (rowError: any) {
        results.errors.push(`Dòng ${rowNumber}: ${rowError.message}`);
      }
    }

    return results;
  } catch (error: any) {
    console.error("Lỗi nhập Excel phân ca làm việc:", error);
    throw new Error(`Lỗi nhập file: ${error.message}`);
  }
};

// 🟪 Tạo template Excel cho phân ca làm việc
export const createEmployeeShiftAssignmentTemplate =
  async (): Promise<Buffer> => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Template phân ca làm việc");

    // Header với màu sắc
    worksheet.columns = [
      { header: "Mã NV (*)", key: "employeeCode", width: 15 },
      { header: "Ngày phân ca (*)", key: "assignmentDate", width: 15 },
      { header: "Mã ca (*)", key: "shiftCode", width: 15 },
      { header: "Loại ca", key: "assignmentType", width: 15 },
      { header: "Trạng thái", key: "status", width: 15 },
      { header: "Mã người duyệt", key: "approverCode", width: 15 },
      { header: "Ghi chú", key: "notes", width: 30 },
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
        assignmentDate: "2024-01-15",
        shiftCode: "CA1",
        assignmentType: "Thường",
        status: "Đã xác nhận",
        approverCode: "QL001",
        notes: "Phân ca thường xuyên",
      },
      {
        employeeCode: "NV002",
        assignmentDate: "2024-01-15",
        shiftCode: "CA2",
        assignmentType: "Tăng ca",
        status: "Đã lên lịch",
        approverCode: "",
        notes: "Tăng ca dự án",
      },
    ];

    sampleData.forEach((data) => {
      worksheet.addRow(data);
    });

    // Thêm ghi chú
    worksheet.addRow([]);
    worksheet.addRow(["Ghi chú:"]);
    worksheet.addRow(["(*) : Thông tin bắt buộc"]);
    worksheet.addRow(["Loại ca: Thường / Tăng ca / Đặc biệt"]);
    worksheet.addRow(["Trạng thái: Đã lên lịch / Đã xác nhận / Đã hủy"]);
    worksheet.addRow(["Mã NV & Mã ca: Phải tồn tại trong hệ thống"]);
    worksheet.addRow(["Định dạng ngày: YYYY-MM-DD hoặc DD/MM/YYYY"]);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  };
export interface EmployeeShiftAssignmentFilter {
  employeeId?: number;
  workShiftId?: number;
  assignmentType?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ==========================
// Tạo mới
// ==========================
export const createEmployeeShiftAssignment = async (
  data: EmployeeShiftAssignmentCreateRequest
) => {
  const newAssignment = await EmployeeShiftAssignment.create(data);
  return newAssignment;
};

// ==========================
// Lấy tất cả
// ==========================
export const getAllEmployeeShiftAssignments = async () => {
  const assignments = await EmployeeShiftAssignment.findAll({
    include: [
      { model: EmployeeInformation, as: "assignmentEmployee" },
      { model: EmployeeInformation, as: "shiftApprover" },
      { model: WorkShift, as: "assignedWorkShift" },
    ],
  });
  return assignments;
};

// ==========================
// Lấy theo ID
// ==========================
export const getEmployeeShiftAssignmentById = async (id: number) => {
  const record = await EmployeeShiftAssignment.findByPk(id, {
    include: [
      { model: EmployeeInformation, as: "assignmentEmployee" },
      { model: EmployeeInformation, as: "shiftApprover" },
      { model: WorkShift, as: "assignedWorkShift" },
    ],
  });
  return record;
};

// ==========================
// Cập nhật
// ==========================
export const updateEmployeeShiftAssignment = async (
  id: number,
  data: EmployeeShiftAssignmentUpdateRequest
) => {
  const record = await EmployeeShiftAssignment.findByPk(id);
  if (!record) return null;
  await record.update(data);
  return record;
};

// ==========================
// Xóa
// ==========================
export const deleteEmployeeShiftAssignment = async (id: number) => {
  const deletedCount = await EmployeeShiftAssignment.destroy({
    where: { id },
  });
  return deletedCount > 0;
};

// ==========================
// Lấy theo employeeId
// ==========================
export const getEmployeeShiftAssignmentsByEmployee = async (
  employeeId: number
) => {
  return await EmployeeShiftAssignment.findAll({
    where: { employeeId },
    include: [
      { model: EmployeeInformation, as: "assignmentEmployee" },
      { model: EmployeeInformation, as: "shiftApprover" },
      { model: WorkShift, as: "assignedWorkShift" },
    ],
    order: [["assignmentDate", "DESC"]],
  });
};

// ==========================
// Lấy theo khoảng ngày
// ==========================
export const getEmployeeShiftAssignmentsByDateRange = async (
  startDate: string,
  endDate: string
) => {
  return await EmployeeShiftAssignment.findAll({
    where: {
      assignmentDate: {
        [Op.between]: [startDate, endDate],
      },
    },
    include: [
      { model: EmployeeInformation, as: "employee" },
      { model: WorkShift, as: "workShift" },
    ],
    order: [["assignmentDate", "DESC"]],
  });
};

// ==========================
// Lọc theo nhiều điều kiện
// ==========================
export const getEmployeeShiftAssignmentsByFilter = async (
  page: number,
  pageSize: number,
  filter: EmployeeShiftAssignmentFilter
) => {
  const where: any = {};

  if (filter.employeeId) where.employeeId = filter.employeeId;
  if (filter.workShiftId) where.workShiftId = filter.workShiftId;
  if (filter.assignmentType) where.assignmentType = filter.assignmentType;
  if (filter.status) where.status = filter.status;
  if (filter.dateFrom && filter.dateTo) {
    where.assignmentDate = {
      [Op.between]: [filter.dateFrom, filter.dateTo],
    };
  }

  const offset = (page - 1) * pageSize;
  const { rows, count } = await EmployeeShiftAssignment.findAndCountAll({
    where,
    include: [
      { model: EmployeeInformation, as: "assignmentEmployee" },
      { model: EmployeeInformation, as: "shiftApprover" },
      { model: WorkShift, as: "assignedWorkShift" },
    ],
    order: [["assignmentDate", "DESC"]],
    offset,
    limit: pageSize,
  });

  return {
    data: rows,
    totalItems: count,
    currentPage: page,
    totalPages: Math.ceil(count / pageSize),
  };
};
