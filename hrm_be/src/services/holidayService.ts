// services/holidayService.ts
import ExcelJS from "exceljs";
import { Op, Transaction } from "sequelize";
import sequelize from "../config/db";
import Holiday from "../models/holidayModel";

export interface HolidayCreatePayload {
  name: string;
  holidayDate: Date | string;
  year: number;
  isRecurring?: boolean;
  description?: string | null;
  isActive?: boolean;
}

export interface HolidayUpdatePayload {
  name?: string;
  holidayDate?: Date | string;
  year?: number;
  isRecurring?: boolean;
  description?: string | null;
  isActive?: boolean;
}

export interface HolidaySearchResult {
  rows: Holiday[];
  count: number;
}

export interface HolidayPaginatedResult {
  rows: Holiday[];
  count: number;
  totalPages: number;
  currentPage: number;
}

export interface ImportResult {
  total: number;
  success: number;
  errors: string[];
  duplicates: number;
  updated: number;
}

export class HolidayService {
  // Lấy tất cả holidays
  static async getAll(): Promise<Holiday[]> {
    return await Holiday.findAll({
      order: [["holidayDate", "ASC"]],
    });
  }

  // Lấy theo id
  static async getById(id: number): Promise<Holiday | null> {
    return await Holiday.findByPk(id);
  }

  // Lấy theo năm
  static async getByYear(year: number): Promise<Holiday[]> {
    return await Holiday.findAll({
      where: { year },
      order: [["holidayDate", "ASC"]],
    });
  }

  // Lấy theo phân trang
  static async getByPage(
    page: number = 1,
    limit: number = 10
  ): Promise<HolidayPaginatedResult> {
    const offset = (page - 1) * limit;
    const { rows, count } = await Holiday.findAndCountAll({
      limit,
      offset,
      order: [["holidayDate", "ASC"]],
    });

    return {
      rows,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    };
  }

  // Tìm kiếm theo tên hoặc năm
  static async search(
    query: string,
    year?: number,
    page: number = 1,
    limit: number = 10
  ): Promise<HolidayPaginatedResult> {
    const offset = (page - 1) * limit;
    const where: any = {
      [Op.and]: [],
    };

    if (query) {
      where[Op.and].push({
        name: { [Op.like]: `%${query}%` },
      });
    }

    if (typeof year === "number" && !isNaN(year)) {
      where[Op.and].push({ year });
    }

    const { rows, count } = await Holiday.findAndCountAll({
      where: where[Op.and].length ? where : undefined,
      limit,
      offset,
      order: [["holidayDate", "ASC"]],
    });

    return {
      rows,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    };
  }

  // Tạo holiday mới
  static async create(payload: HolidayCreatePayload): Promise<Holiday> {
    return await Holiday.create(payload);
  }

  // Cập nhật holiday
  static async update(
    id: number,
    payload: HolidayUpdatePayload
  ): Promise<Holiday | null> {
    const holiday = await Holiday.findByPk(id);
    if (!holiday) return null;
    await holiday.update(payload);
    return holiday;
  }

  // Cập nhật trạng thái active/inactive
  static async updateStatus(
    id: number,
    isActive: boolean
  ): Promise<Holiday | null> {
    const holiday = await Holiday.findByPk(id);
    if (!holiday) return null;
    await holiday.update({ isActive });
    return holiday;
  }

  // Xóa holiday
  static async delete(id: number): Promise<boolean> {
    const deletedCount = await Holiday.destroy({ where: { id } });
    return deletedCount > 0;
  }

  // Kiểm tra ngày lễ trùng
  static async checkDuplicateDate(
    holidayDate: Date | string,
    excludeId?: number
  ): Promise<boolean> {
    const where: any = {
      holidayDate,
    };

    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }

    const count = await Holiday.count({ where });
    return count > 0;
  }

  // Lấy các ngày lễ active
  static async getActiveHolidays(year?: number): Promise<Holiday[]> {
    const where: any = { isActive: true };

    if (year) {
      where.year = year;
    }

    return await Holiday.findAll({
      where,
      order: [["holidayDate", "ASC"]],
    });
  }

  // Lấy các ngày lễ trong khoảng thời gian
  static async getHolidaysInRange(
    startDate: Date | string,
    endDate: Date | string
  ): Promise<Holiday[]> {
    return await Holiday.findAll({
      where: {
        holidayDate: {
          [Op.between]: [startDate, endDate],
        },
        isActive: true,
      },
      order: [["holidayDate", "ASC"]],
    });
  }

  // ===============================
  // 🔹 EXPORT HOLIDAYS TO EXCEL
  // ===============================
  static async exportHolidaysToExcel(filter?: {
    year?: number;
    isActive?: boolean;
  }): Promise<ExcelJS.Workbook> {
    try {
      console.log("Bắt đầu export holidays với filter:", filter);

      // Build where clause
      const where: any = {};
      if (filter?.year) where.year = filter.year;
      if (filter?.isActive !== undefined) where.isActive = filter.isActive;

      const holidays = await Holiday.findAll({
        where,
        order: [["holidayDate", "ASC"]],
      });

      console.log(`✅ Tìm thấy ${holidays.length} ngày lễ`);

      // Create workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Danh sách ngày lễ");

      // Define columns
      worksheet.columns = [
        { header: "STT", key: "stt", width: 8 },
        { header: "Tên ngày lễ", key: "name", width: 30 },
        { header: "Ngày lễ", key: "holidayDate", width: 15 },
        { header: "Năm", key: "year", width: 10 },
        { header: "Lặp lại hàng năm", key: "isRecurring", width: 15 },
        { header: "Trạng thái", key: "isActive", width: 12 },
        { header: "Mô tả", key: "description", width: 40 },
        { header: "Ngày tạo", key: "createdAt", width: 15 },
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

      // Add data
      holidays.forEach((holiday, index) => {
        const row = worksheet.addRow({
          stt: index + 1,
          name: holiday.name,
          holidayDate: new Date(holiday.holidayDate).toLocaleDateString(
            "vi-VN"
          ),
          year: holiday.year,
          isRecurring: holiday.isRecurring ? "Có" : "Không",
          isActive: holiday.isActive ? "Hoạt động" : "Không hoạt động",
          description: holiday.description || "N/A",
          createdAt: holiday.createdAt
            ? new Date(holiday.createdAt).toLocaleDateString("vi-VN")
            : "N/A",
        });

        // Center align most cells
        row.eachCell((cell, colNumber) => {
          if (colNumber !== 1 && colNumber !== 7) {
            // Exclude name and description columns
            cell.alignment = { vertical: "middle", horizontal: "center" };
          }
        });
      });

      // Left align for text columns
      worksheet.getColumn(2).alignment = {
        vertical: "middle",
        horizontal: "left",
      }; // Name
      worksheet.getColumn(7).alignment = {
        vertical: "middle",
        horizontal: "left",
      }; // Description

      // Auto filter
      if (holidays.length > 0) {
        worksheet.autoFilter = {
          from: "A1",
          to: `H${holidays.length + 1}`,
        };
      }

      console.log("✅ Xuất Excel holidays thành công");
      return workbook;
    } catch (error: any) {
      console.error("❌ Lỗi xuất Excel holidays:", error);
      throw new Error(`Không thể xuất file Excel: ${error.message}`);
    }
  }

  // Export to buffer
  static async exportHolidaysToExcelBuffer(filter?: any): Promise<Buffer> {
    try {
      console.log("🟢 Bắt đầu exportHolidaysToExcelBuffer");
      console.log("Filter nhận được:", filter);

      const workbook = await this.exportHolidaysToExcel(filter);
      const buffer = await workbook.xlsx.writeBuffer();

      console.log("✅ Tạo buffer thành công");
      return Buffer.from(buffer);
    } catch (error: any) {
      console.error("❌ Lỗi xuất Excel buffer:", error);
      throw new Error(`Không thể tạo file Excel: ${error.message}`);
    }
  }

  // ===============================
  // 🔹 IMPORT HOLIDAYS FROM EXCEL
  // ===============================
  static async importHolidaysFromExcel(
    fileBuffer: Buffer
  ): Promise<ImportResult> {
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

      // Start from row 2 (skip header)
      for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);

        // Skip empty rows
        if (!row.getCell(1).value && !row.getCell(2).value) continue;

        try {
          // Get data from cells according to template
          const name = row.getCell(1).value?.toString().trim();
          const holidayDateStr = row.getCell(2).value?.toString().trim();
          const yearStr = row.getCell(3).value?.toString().trim();
          const isRecurringStr = row.getCell(4).value?.toString().trim();
          const isActiveStr = row.getCell(5).value?.toString().trim();
          const description = row.getCell(6).value?.toString().trim();

          // Validate required data
          if (!name || !holidayDateStr) {
            results.errors.push(
              `Dòng ${rowNumber}: Thiếu thông tin bắt buộc (Tên ngày lễ, Ngày lễ)`
            );
            continue;
          }

          // Parse date
          const holidayDate = this.parseExcelDate(holidayDateStr);
          if (!holidayDate) {
            results.errors.push(
              `Dòng ${rowNumber}: Ngày lễ không hợp lệ "${holidayDateStr}"`
            );
            continue;
          }

          // Parse year
          let year = holidayDate.getFullYear();
          if (yearStr) {
            const parsedYear = parseInt(yearStr);
            if (!isNaN(parsedYear)) {
              year = parsedYear;
            }
          }

          // Parse boolean values
          const isRecurring = this.parseBoolean(isRecurringStr);
          const isActive = this.parseBoolean(isActiveStr, true);

          // Check for duplicate date
          const existingHoliday = await Holiday.findOne({
            where: { holidayDate },
          });

          const holidayData: any = {
            name,
            holidayDate,
            year,
            isRecurring,
            isActive,
            description: description || null,
          };

          if (existingHoliday) {
            // Update existing
            await existingHoliday.update(holidayData);
            results.updated++;
          } else {
            // Create new
            await Holiday.create(holidayData);
            results.success++;
          }

          results.total++;
        } catch (rowError: any) {
          results.errors.push(`Dòng ${rowNumber}: ${rowError.message}`);
        }
      }

      return results;
    } catch (error: any) {
      console.error("Lỗi nhập Excel holidays:", error);
      throw new Error(`Lỗi nhập file: ${error.message}`);
    }
  }

  // ===============================
  // 🔹 CREATE HOLIDAY TEMPLATE
  // ===============================
  static async createHolidayTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Template ngày lễ");

    // Header với màu sắc
    worksheet.columns = [
      { header: "Tên ngày lễ (*)", key: "name", width: 30 },
      { header: "Ngày lễ (*)", key: "holidayDate", width: 15 },
      { header: "Năm", key: "year", width: 10 },
      { header: "Lặp lại hàng năm", key: "isRecurring", width: 15 },
      { header: "Trạng thái", key: "isActive", width: 12 },
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
        name: "Tết Dương lịch",
        holidayDate: "2024-01-01",
        year: "2024",
        isRecurring: "Có",
        isActive: "Có",
        description: "Nghỉ Tết Dương lịch",
      },
      {
        name: "Giỗ Tổ Hùng Vương",
        holidayDate: "2024-04-18",
        year: "2024",
        isRecurring: "Có",
        isActive: "Có",
        description: "Giỗ Tổ Hùng Vương",
      },
      {
        name: "Ngày Quốc khánh",
        holidayDate: "2024-09-02",
        year: "2024",
        isRecurring: "Có",
        isActive: "Có",
        description: "Ngày Quốc khánh 2/9",
      },
    ];

    sampleData.forEach((data) => {
      worksheet.addRow(data);
    });

    // Thêm ghi chú
    worksheet.addRow([]);
    worksheet.addRow(["Ghi chú:"]);
    worksheet.addRow(["(*) : Thông tin bắt buộc"]);
    worksheet.addRow(["Lặp lại hàng năm: Có / Không"]);
    worksheet.addRow(["Trạng thái: Có / Không"]);
    worksheet.addRow(["Định dạng ngày: YYYY-MM-DD hoặc DD/MM/YYYY"]);
    worksheet.addRow(["Năm: Nếu để trống sẽ tự động lấy năm từ ngày lễ"]);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // ===============================
  // 🔹 HELPER METHODS
  // ===============================

  // Parse date từ Excel
  private static parseExcelDate(dateStr: string): Date | null {
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
  }

  // Parse boolean từ string
  private static parseBoolean(
    value: string | undefined,
    defaultValue: boolean = false
  ): boolean {
    if (!value) return defaultValue;

    const trueValues = ["có", "co", "yes", "true", "1", "active", "hoạt động"];
    const falseValues = [
      "không",
      "no",
      "false",
      "0",
      "inactive",
      "không hoạt động",
    ];

    const lowerValue = value.toLowerCase().trim();
    if (trueValues.includes(lowerValue)) return true;
    if (falseValues.includes(lowerValue)) return false;

    return defaultValue;
  }
}

// Export mặc định
export default HolidayService;
