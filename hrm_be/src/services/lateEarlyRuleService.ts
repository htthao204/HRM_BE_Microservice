import ExcelJS from "exceljs";
import { Op } from "sequelize";
import LateEarlyRule from "../models/lateEarlyRuleModel";

export const createLateEarlyRule = async (ruleData: any) => {
  const newRule = await LateEarlyRule.create(ruleData);
  return newRule.get({ plain: true });
};

export const getLateEarlyRuleById = async (id: number) => {
  const rule = await LateEarlyRule.findByPk(id);
  if (!rule) throw new Error("Quy định không tồn tại");
  return rule.get({ plain: true });
};

// 🟩 Lấy tất cả (có filter + phân trang)
export const getAllLateEarlyRules = async (
  page: number = 1,
  pageSize: number = 10,
  filter?: { query?: string; ruleType?: string; isActive?: boolean }
) => {
  const where: any = {};

  if (filter?.query) {
    where.name = { [Op.like]: `%${filter.query}%` };
  }
  if (filter?.ruleType) {
    where.ruleType = filter.ruleType;
  }
  if (typeof filter?.isActive === "boolean") {
    where.isActive = filter.isActive;
  }

  const offset = (page - 1) * pageSize;

  const { rows, count } = await LateEarlyRule.findAndCountAll({
    where,
    limit: pageSize,
    offset,
    order: [["createdAt", "DESC"]],
  });

  return {
    data: rows.map((r) => r.get({ plain: true })),
    totalItems: count,
    totalPages: Math.ceil(count / pageSize),
    currentPage: page,
  };
};

export const updateLateEarlyRule = async (id: number, ruleData: any) => {
  const [affectedRows] = await LateEarlyRule.update(ruleData, {
    where: { id },
  });
  if (affectedRows === 0) throw new Error("Quy định không tồn tại");

  const updated = await LateEarlyRule.findByPk(id);
  return updated?.get({ plain: true });
};

export const updateLateEarlyRuleStatus = async (
  id: number,
  isActive: boolean
) => {
  const rule = await LateEarlyRule.findByPk(id);
  if (!rule) throw new Error("Quy định không tồn tại");

  await rule.update({ isActive });
  return rule.get({ plain: true });
};

export const deleteLateEarlyRule = async (id: number) => {
  const deletedCount = await LateEarlyRule.destroy({ where: { id } });
  if (deletedCount === 0) throw new Error("Quy định không tồn tại");
  return deletedCount;
};

// 🟪 Xuất danh sách quy định ra Excel
export const exportLateEarlyRulesToExcel = async (filter?: {
  query?: string;
  ruleType?: string;
  isActive?: boolean;
}) => {
  try {
    const where: any = {};

    if (filter?.query) {
      where.name = { [Op.like]: `%${filter.query}%` };
    }
    if (filter?.ruleType) {
      where.ruleType = filter.ruleType;
    }
    if (typeof filter?.isActive === "boolean") {
      where.isActive = filter.isActive;
    }

    // Lấy tất cả dữ liệu không phân trang
    const rules = await LateEarlyRule.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    // Tạo workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Quy định đi muộn về sớm");

    // Định nghĩa columns
    worksheet.columns = [
      { header: "STT", key: "stt", width: 8 },
      { header: "Mã quy định", key: "code", width: 15 },
      { header: "Tên quy định", key: "name", width: 30 },
      { header: "Loại quy định", key: "ruleType", width: 15 },
      { header: "Thời gian áp dụng", key: "effectiveTime", width: 20 },
      { header: "Thời gian kết thúc", key: "endTime", width: 20 },
      { header: "Phút cho phép", key: "allowedMinutes", width: 15 },
      { header: "Số lần cảnh báo", key: "warningCount", width: 15 },
      { header: "Đối tượng áp dụng", key: "applicableTo", width: 20 },
      { header: "Phòng ban áp dụng", key: "applicableDepartments", width: 25 },
      { header: "Chức vụ áp dụng", key: "applicablePositions", width: 25 },
      { header: "Nhân viên áp dụng", key: "applicableEmployees", width: 25 },
      { header: "Trạng thái", key: "status", width: 12 },
      { header: "Mô tả", key: "description", width: 40 },
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

    // Thêm dữ liệu
    rules.forEach((rule, index) => {
      const ruleData = rule.get({ plain: true });

      // Map ruleType
      const ruleTypeMap: { [key: string]: string } = {
        late: "Đi muộn",
        early: "Về sớm",
        both: "Cả hai",
      };

      // Map applicableTo
      const applicableToMap: { [key: string]: string } = {
        all: "Toàn công ty",
        department: "Phòng ban",
        position: "Chức vụ",
        individual: "Cá nhân",
      };

      worksheet.addRow({
        stt: index + 1,
        code: ruleData.code || "N/A",
        name: ruleData.name,
        ruleType: ruleTypeMap[ruleData.ruleType] || ruleData.ruleType,
        effectiveTime: ruleData.effectiveTime
          ? new Date(ruleData.effectiveTime).toLocaleDateString("vi-VN")
          : "N/A",
        endTime: ruleData.endTime
          ? new Date(ruleData.endTime).toLocaleDateString("vi-VN")
          : "N/A",
        allowedMinutes: ruleData.allowedMinutes || 0,
        warningCount: ruleData.warningCount || 0,
        applicableTo:
          applicableToMap[ruleData.applicableTo] || ruleData.applicableTo,
        applicableDepartments: Array.isArray(ruleData.applicableDepartments)
          ? ruleData.applicableDepartments.join(", ")
          : ruleData.applicableDepartments || "",
        applicablePositions: Array.isArray(ruleData.applicablePositions)
          ? ruleData.applicablePositions.join(", ")
          : ruleData.applicablePositions || "",
        applicableEmployees: Array.isArray(ruleData.applicableEmployees)
          ? ruleData.applicableEmployees.join(", ")
          : ruleData.applicableEmployees || "",
        status: ruleData.isActive ? "Đang hoạt động" : "Ngừng hoạt động",
        description: ruleData.description || "",
        createdAt: new Date(ruleData.createdAt).toLocaleDateString("vi-VN"),
      });
    });

    // Căn giữa các cột
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].forEach((colNumber) => {
      worksheet.getColumn(colNumber).alignment = {
        vertical: "middle",
        horizontal: "center",
      };
    });

    // Căn trái cho cột mô tả
    worksheet.getColumn(14).alignment = {
      vertical: "middle",
      horizontal: "left",
    };

    // Auto filter
    worksheet.autoFilter = {
      from: "A1",
      to: `O${rules.length + 1}`,
    };

    return workbook;
  } catch (error) {
    console.error("Lỗi xuất Excel quy định:", error);
    throw new Error("Không thể xuất file Excel");
  }
};

// 🟪 Xuất file Excel và trả về buffer (dùng cho API)
export const exportLateEarlyRulesToExcelBuffer = async (filter?: {
  query?: string;
  ruleType?: string;
  isActive?: boolean;
}) => {
  const workbook = await exportLateEarlyRulesToExcel(filter);
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};
// 🟪 Nhập quy định từ file Excel
export const importLateEarlyRulesFromExcel = async (fileBuffer: Buffer) => {
  const results = {
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

    // Validate header
    const expectedHeaders = [
      "Mã quy định",
      "Tên quy định",
      "Loại quy định",
      "Thời gian áp dụng",
      "Thời gian kết thúc",
      "Phút cho phép",
      "Số lần cảnh báo",
      "Đối tượng áp dụng",
      "Phòng ban áp dụng",
      "Chức vụ áp dụng",
      "Nhân viên áp dụng",
      "Mô tả",
    ];

    const headerRow = worksheet.getRow(1);
    const actualHeaders: string[] = [];

    headerRow.eachCell((cell) => {
      if (cell.value) actualHeaders.push(cell.value.toString().trim());
    });

    // Kiểm tra header có khớp không
    const isValidHeader = expectedHeaders.every((header) =>
      actualHeaders.some((actual) => actual.includes(header))
    );

    if (!isValidHeader) {
      throw new Error("File Excel không đúng định dạng template");
    }

    // Xử lý từng dòng dữ liệu (bắt đầu từ dòng 2)
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);

      // Bỏ qua dòng trống
      if (!row.getCell(1).value && !row.getCell(2).value) continue;

      try {
        // Lấy dữ liệu từ các cell
        const code = row.getCell(1).value?.toString().trim();
        const name = row.getCell(2).value?.toString().trim();
        const ruleTypeText = row.getCell(3).value?.toString().trim();
        const effectiveTimeStr = row.getCell(4).value?.toString().trim();
        const endTimeStr = row.getCell(5).value?.toString().trim();
        const allowedMinutes = parseInt(
          row.getCell(6).value?.toString() || "0"
        );
        const warningCount = parseInt(row.getCell(7).value?.toString() || "0");
        const applicableToText = row.getCell(8).value?.toString().trim();
        const applicableDepartmentsStr = row
          .getCell(9)
          .value?.toString()
          .trim();
        const applicablePositionsStr = row.getCell(10).value?.toString().trim();
        const applicableEmployeesStr = row.getCell(11).value?.toString().trim();
        const description = row.getCell(12).value?.toString().trim();

        // Validate dữ liệu bắt buộc
        if (!code || !name || !ruleTypeText) {
          results.errors.push(
            `Dòng ${rowNumber}: Thiếu thông tin bắt buộc (Mã, Tên, Loại quy định)`
          );
          continue;
        }

        // Map loại quy định
        const ruleTypeMap: { [key: string]: string } = {
          "đi muộn": "late",
          "về sớm": "early",
          "cả hai": "both",
          late: "late",
          early: "early",
          both: "both",
        };

        const ruleType = ruleTypeMap[ruleTypeText.toLowerCase()];
        if (!ruleType) {
          results.errors.push(
            `Dòng ${rowNumber}: Loại quy định không hợp lệ (${ruleTypeText})`
          );
          continue;
        }

        // Map đối tượng áp dụng
        const applicableToMap: { [key: string]: string } = {
          "toàn công ty": "all",
          "phòng ban": "department",
          "chức vụ": "position",
          "cá nhân": "individual",
          all: "all",
          department: "department",
          position: "position",
          individual: "individual",
        };

        const applicableTo =
          applicableToMap[applicableToText?.toLowerCase()] || "all";

        // Xử lý thời gian
        let effectiveTime: Date | null = null;
        let endTime: Date | null = null;

        if (effectiveTimeStr) {
          effectiveTime = parseExcelDate(effectiveTimeStr);
          if (!effectiveTime) {
            results.errors.push(
              `Dòng ${rowNumber}: Định dạng thời gian áp dụng không hợp lệ`
            );
            continue;
          }
        }

        if (endTimeStr) {
          endTime = parseExcelDate(endTimeStr);
          if (!endTime) {
            results.errors.push(
              `Dòng ${rowNumber}: Định dạng thời gian kết thúc không hợp lệ`
            );
            continue;
          }
        }

        // Xử lý mảng dữ liệu
        const applicableDepartments = applicableDepartmentsStr
          ? applicableDepartmentsStr
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s)
          : [];

        const applicablePositions = applicablePositionsStr
          ? applicablePositionsStr
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s)
          : [];

        const applicableEmployees = applicableEmployeesStr
          ? applicableEmployeesStr
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s)
          : [];

        // Kiểm tra trùng lặp
        const existingRule = await LateEarlyRule.findOne({
          where: { code },
        });

        const ruleData = {
          code,
          name,
          ruleType,
          effectiveTime,
          endTime,
          allowedMinutes: isNaN(allowedMinutes) ? 0 : allowedMinutes,
          warningCount: isNaN(warningCount) ? 0 : warningCount,
          applicableTo,
          applicableDepartments,
          applicablePositions,
          applicableEmployees,
          description: description || "",
          isActive: true,
        };

        if (existingRule) {
          // Cập nhật nếu đã tồn tại
          await existingRule.update(ruleData);
          results.updated++;
        } else {
          // Tạo mới
          await LateEarlyRule.create(ruleData);
          results.success++;
        }

        results.total++;
      } catch (rowError: any) {
        results.errors.push(`Dòng ${rowNumber}: ${rowError.message}`);
      }
    }

    return results;
  } catch (error: any) {
    console.error("Lỗi nhập Excel quy định:", error);
    throw new Error(`Lỗi nhập file: ${error.message}`);
  }
};

// 🟪 Hàm parse date từ Excel
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

    // Thử parse number (Excel serial date)
    const excelSerial = parseFloat(dateStr);
    if (!isNaN(excelSerial)) {
      // Chuyển đổi từ Excel serial date (base date: 1900-01-01)
      const baseDate = new Date(1900, 0, 1);
      return new Date(
        baseDate.getTime() + (excelSerial - 1) * 24 * 60 * 60 * 1000
      );
    }

    return null;
  } catch {
    return null;
  }
};

// 🟪 Tạo template Excel
export const createLateEarlyRulesTemplate = async (): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Template quy định");

  // Header với màu sắc
  worksheet.columns = [
    { header: "Mã quy định (*)", key: "code", width: 20 },
    { header: "Tên quy định (*)", key: "name", width: 30 },
    { header: "Loại quy định (*)", key: "ruleType", width: 15 },
    { header: "Thời gian áp dụng", key: "effectiveTime", width: 20 },
    { header: "Thời gian kết thúc", key: "endTime", width: 20 },
    { header: "Phút cho phép", key: "allowedMinutes", width: 15 },
    { header: "Số lần cảnh báo", key: "warningCount", width: 15 },
    { header: "Đối tượng áp dụng", key: "applicableTo", width: 20 },
    { header: "Phòng ban áp dụng", key: "applicableDepartments", width: 25 },
    { header: "Chức vụ áp dụng", key: "applicablePositions", width: 25 },
    { header: "Nhân viên áp dụng", key: "applicableEmployees", width: 25 },
    { header: "Mô tả", key: "description", width: 40 },
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
      code: "QM001",
      name: "Quy định đi muộn cho toàn công ty",
      ruleType: "Đi muộn",
      effectiveTime: "01/01/2024",
      endTime: "31/12/2024",
      allowedMinutes: 15,
      warningCount: 3,
      applicableTo: "Toàn công ty",
      applicableDepartments: "",
      applicablePositions: "",
      applicableEmployees: "",
      description: "Cho phép đi muộn 15 phút, cảnh báo sau 3 lần",
    },
    {
      code: "QM002",
      name: "Quy định về sớm phòng Kỹ thuật",
      ruleType: "Về sớm",
      effectiveTime: "01/01/2024",
      endTime: "",
      allowedMinutes: 10,
      warningCount: 2,
      applicableTo: "Phòng ban",
      applicableDepartments: "Kỹ thuật, Phát triển",
      applicablePositions: "",
      applicableEmployees: "",
      description: "Cho phép về sớm 10 phút cho phòng kỹ thuật",
    },
  ];

  sampleData.forEach((data, index) => {
    worksheet.addRow({
      ...data,
      stt: index + 1,
    });
  });

  // Thêm ghi chú
  worksheet.addRow([]);
  worksheet.addRow(["Ghi chú:"]);
  worksheet.addRow(["(*) : Thông tin bắt buộc"]);
  worksheet.addRow(["Loại quy định: Đi muộn / Về sớm / Cả hai"]);
  worksheet.addRow([
    "Đối tượng áp dụng: Toàn công ty / Phòng ban / Chức vụ / Cá nhân",
  ]);
  worksheet.addRow([
    "Phòng ban/Chức vụ/Nhân viên: Nhập nhiều giá trị cách nhau bằng dấu phẩy",
  ]);

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as Buffer;
};
