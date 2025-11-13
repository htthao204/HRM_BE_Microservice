// src/services/salaryGradeService.ts
import ExcelJS from "exceljs";
import { Op, Transaction } from "sequelize";
import sequelize from "../config/db";
import SalaryGrade from "../models/salaryGradeModel";

export interface SalaryGradeCreatePayload {
  grade_code: string;
  grade_name: string;
  basic_salary: number | string;
  coefficient: number | string;
  min_salary: number | string;
  max_salary: number | string;
  description?: string | null;
  effective_date?: Date | string;
  is_active?: boolean;
}

export interface SalaryGradeUpdatePayload {
  grade_code?: string;
  grade_name?: string;
  basic_salary?: number | string;
  coefficient?: number | string;
  min_salary?: number | string;
  max_salary?: number | string;
  description?: string | null;
  effective_date?: Date | string;
  end_date?: Date | string | null;
  is_active?: boolean;
}

export interface SalaryGradeSearchResult {
  rows: SalaryGrade[];
  count: number;
}

export interface SalaryGradePaginatedResult {
  rows: SalaryGrade[];
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

export class SalaryGradeService {
  // Lấy tất cả bậc lương
  static async getAll(): Promise<SalaryGrade[]> {
    return await SalaryGrade.findAll({
      order: [["basic_salary", "DESC"]],
    });
  }

  // Lấy theo id
  static async getById(id: number): Promise<SalaryGrade | null> {
    return await SalaryGrade.findByPk(id);
  }

  // Lấy theo mã bậc lương
  static async getByCode(grade_code: string): Promise<SalaryGrade | null> {
    return await SalaryGrade.findOne({ where: { grade_code } });
  }

  // Lấy các bậc lương đang hoạt động
  static async getActive(): Promise<SalaryGrade[]> {
    return await SalaryGrade.findAll({
      where: { is_active: true, end_date: null },
      order: [["basic_salary", "DESC"]],
    });
  }

  // Phân trang
  static async getByPage(
    page: number = 1,
    limit: number = 10
  ): Promise<SalaryGradePaginatedResult> {
    const offset = (page - 1) * limit;
    const { rows, count } = await SalaryGrade.findAndCountAll({
      limit,
      offset,
      order: [["basic_salary", "DESC"]],
    });

    return {
      rows,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    };
  }

  // Tìm kiếm theo mã, tên hoặc trạng thái
  static async search(
    query: string,
    is_active?: boolean,
    page: number = 1,
    limit: number = 10
  ): Promise<SalaryGradePaginatedResult> {
    const offset = (page - 1) * limit;
    const where: any = { [Op.and]: [] };

    if (query) {
      where[Op.and].push({
        [Op.or]: [
          { grade_code: { [Op.like]: `%${query}%` } },
          { grade_name: { [Op.like]: `%${query}%` } },
        ],
      });
    }

    if (typeof is_active === "boolean") {
      where[Op.and].push({ is_active });
    }

    const { rows, count } = await SalaryGrade.findAndCountAll({
      where: where[Op.and].length ? where : undefined,
      limit,
      offset,
      order: [["basic_salary", "DESC"]],
    });

    return {
      rows,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    };
  }

  // Tạo mới bậc lương
  static async create(payload: SalaryGradeCreatePayload): Promise<SalaryGrade> {
    return await SalaryGrade.create({
      ...payload,
      basic_salary: Number(payload.basic_salary),
      coefficient: Number(payload.coefficient),
      min_salary: Number(payload.min_salary),
      max_salary: Number(payload.max_salary),
    });
  }

  // Cập nhật bậc lương
  static async update(
    id: number,
    payload: SalaryGradeUpdatePayload
  ): Promise<SalaryGrade | null> {
    const grade = await SalaryGrade.findByPk(id);
    if (!grade) return null;

    const updateData: any = { ...payload };
    if (payload.basic_salary !== undefined)
      updateData.basic_salary = Number(payload.basic_salary);
    if (payload.coefficient !== undefined)
      updateData.coefficient = Number(payload.coefficient);
    if (payload.min_salary !== undefined)
      updateData.min_salary = Number(payload.min_salary);
    if (payload.max_salary !== undefined)
      updateData.max_salary = Number(payload.max_salary);

    await grade.update(updateData);
    return grade;
  }

  // Cập nhật trạng thái
  static async updateStatus(
    id: number,
    is_active: boolean
  ): Promise<SalaryGrade | null> {
    const grade = await SalaryGrade.findByPk(id);
    if (!grade) return null;
    await grade.update({ is_active });
    return grade;
  }

  // Xóa bậc lương
  static async delete(id: number): Promise<boolean> {
    const deleted = await SalaryGrade.destroy({ where: { id } });
    return deleted > 0;
  }

  // Kiểm tra trùng mã bậc lương
  static async checkDuplicateCode(
    grade_code: string,
    excludeId?: number
  ): Promise<boolean> {
    const where: any = { grade_code };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    const count = await SalaryGrade.count({ where });
    return count > 0;
  }

  // ===============================
  // EXPORT TO EXCEL
  // ===============================
  static async exportToExcel(filter?: {
    is_active?: boolean;
  }): Promise<ExcelJS.Workbook> {
    try {
      console.log("Bắt đầu export bậc lương với filter:", filter);

      const where: any = {};
      if (filter?.is_active !== undefined) where.is_active = filter.is_active;

      const grades = await SalaryGrade.findAll({
        where,
        order: [["basic_salary", "DESC"]],
      });

      console.log(`Tìm thấy ${grades.length} bậc lương`);

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Danh sách bậc lương");

      worksheet.columns = [
        { header: "STT", key: "stt", width: 8 },
        { header: "Mã bậc", key: "grade_code", width: 12 },
        { header: "Tên bậc lương", key: "grade_name", width: 30 },
        { header: "Lương cơ bản", key: "basic_salary", width: 18 },
        { header: "Hệ số", key: "coefficient", width: 10 },
        { header: "Lương min", key: "min_salary", width: 18 },
        { header: "Lương max", key: "max_salary", width: 18 },
        { header: "Trạng thái", key: "status", width: 12 },
        { header: "Hiệu lực từ", key: "effective_date", width: 15 },
        { header: "Mô tả", key: "description", width: 40 },
      ];

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "1976D2" },
      };
      headerRow.alignment = { vertical: "middle", horizontal: "center" };

      grades.forEach((g, i) => {
        worksheet.addRow({
          stt: i + 1,
          grade_code: g.grade_code,
          grade_name: g.grade_name,
          basic_salary: Number(g.basic_salary).toLocaleString("vi-VN"),
          coefficient: Number(g.coefficient),
          min_salary: Number(g.min_salary).toLocaleString("vi-VN"),
          max_salary: Number(g.max_salary).toLocaleString("vi-VN"),
          status: g.is_active ? "Hoạt động" : "Ngừng",
          effective_date: g.effective_date
            ? new Date(g.effective_date).toLocaleDateString("vi-VN")
            : "",
          description: g.description || "N/A",
        });
      });

      // Căn giữa + định dạng tiền tệ
      worksheet.getColumn(4).numFmt = "#,##0";
      worksheet.getColumn(6).numFmt = "#,##0";
      worksheet.getColumn(7).numFmt = "#,##0";

      worksheet.autoFilter = grades.length > 0 ? "A1:J1" : undefined;

      console.log("Xuất Excel bậc lương thành công");
      return workbook;
    } catch (error: any) {
      console.error("Lỗi xuất Excel:", error);
      throw new Error(`Không thể xuất file: ${error.message}`);
    }
  }

  static async exportToBuffer(filter?: any): Promise<Buffer> {
    const workbook = await this.exportToExcel(filter);
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // ===============================
  // IMPORT FROM EXCEL
  // ===============================
  static async importFromExcel(fileBuffer: Buffer): Promise<ImportResult> {
    const result: ImportResult = {
      total: 0,
      success: 0,
      errors: [],
      duplicates: 0,
      updated: 0,
    };

    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(fileBuffer);
      const ws = workbook.getWorksheet(1);
      if (!ws) throw new Error("Không có dữ liệu");

      for (let i = 2; i <= ws.rowCount; i++) {
        const row = ws.getRow(i);
        if (!row.getCell(1).value && !row.getCell(2).value) continue;

        const code = row.getCell(1).value?.toString().trim();
        const name = row.getCell(2).value?.toString().trim();
        const basic = row.getCell(3).value;
        const coeff = row.getCell(4).value;
        const min = row.getCell(5).value;
        const max = row.getCell(6).value;
        const status = row.getCell(7).value?.toString().trim();
        const desc = row.getCell(9).value?.toString().trim();

        if (!code || !name) {
          result.errors.push(`Dòng ${i}: Thiếu mã hoặc tên bậc lương`);
          continue;
        }

        try {
          const data: any = {
            grade_code: code,
            grade_name: name,
            basic_salary: this.parseNumber(basic),
            coefficient: this.parseNumber(coeff),
            min_salary: this.parseNumber(min),
            max_salary: this.parseNumber(max),
            description: desc || null,
            is_active: this.parseBoolean(status, true),
          };

          if (isNaN(data.basic_salary) || data.basic_salary <= 0) {
            result.errors.push(`Dòng ${i}: Lương cơ bản không hợp lệ`);
            continue;
          }

          const existing = await SalaryGrade.findOne({
            where: { grade_code: code },
          });
          if (existing) {
            await existing.update(data);
            result.updated++;
          } else {
            await SalaryGrade.create(data);
            result.success++;
          }
          result.total++;
        } catch (err: any) {
          result.errors.push(`Dòng ${i}: ${err.message}`);
        }
      }
      return result;
    } catch (error: any) {
      throw new Error(`Lỗi nhập file: ${error.message}`);
    }
  }

  // ===============================
  // TEMPLATE EXCEL
  // ===============================
  static async createTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("Template bậc lương");

    ws.columns = [
      { header: "Mã bậc (*)", key: "code", width: 12 },
      { header: "Tên bậc lương (*)", key: "name", width: 30 },
      { header: "Lương cơ bản (*)", key: "basic", width: 18 },
      { header: "Hệ số (*)", key: "coeff", width: 10 },
      { header: "Lương min (*)", key: "min", width: 18 },
      { header: "Lương max (*)", key: "max", width: 18 },
      { header: "Trạng thái", key: "status", width: 12 },
      { header: "Hiệu lực từ", key: "date", width: 15 },
      { header: "Mô tả", key: "desc", width: 40 },
    ];

    const header = ws.getRow(1);
    header.font = { bold: true, color: { argb: "FFFFFF" } };
    header.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "1976D2" },
    };

    // Mẫu
    ws.addRow({
      code: "M1",
      name: "Quản lý cấp cao",
      basic: 25000000,
      coeff: 3.5,
      min: 20000000,
      max: 30000000,
      status: "Hoạt động",
      date: "2025-01-01",
      desc: "Dành cho CEO, Giám đốc",
    });

    ws.addRow([]);
    ws.addRow(["Ghi chú: (*) bắt buộc"]);
    ws.addRow(["Trạng thái: Hoạt động / Ngừng"]);
    ws.addRow(["Lương: số tiền (không dấu phẩy, không chữ)"]);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // ===============================
  // HELPER METHODS
  // ===============================
  private static parseNumber(value: any): number {
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      return parseFloat(value.replace(/[^0-9.-]+/g, "")) || 0;
    }
    return 0;
  }

  private static parseBoolean(
    value: string | undefined,
    defaultValue: boolean = false
  ): boolean {
    if (!value) return defaultValue;
    const yes = ["có", "co", "yes", "true", "1", "active", "hoạt động"];
    const no = ["không", "no", "false", "0", "inactive", "ngừng"];
    const v = value.toLowerCase().trim();
    if (yes.includes(v)) return true;
    if (no.includes(v)) return false;
    return defaultValue;
  }
}

export default SalaryGradeService;
