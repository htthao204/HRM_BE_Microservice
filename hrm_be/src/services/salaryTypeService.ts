// src/services/SalaryTypeService.ts
import ExcelJS from "exceljs";
import { Op } from "sequelize";
import SalaryType from "../models/salaryTypeModel";
import {
  SalaryTypeRequest,
  createSalaryTypeRequest,
} from "../dto/request/salaryTypeRequest";

export interface SalaryTypeCreatePayload extends SalaryTypeRequest {}
export interface SalaryTypeUpdatePayload extends Partial<SalaryTypeRequest> {}

export interface SalaryTypeSearchResult {
  rows: SalaryType[];
  count: number;
}

export interface SalaryTypePaginatedResult {
  rows: SalaryType[];
  count: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface ImportResult {
  total: number;
  success: number;
  errors: string[];
  duplicates: number;
  updated: number;
}

export class SalaryTypeService {
  // ===============================
  // LẤY DANH SÁCH LOẠI LƯƠNG
  // ===============================
  static async getAll(): Promise<SalaryType[]> {
    return await SalaryType.findAll({
      order: [["created_at", "DESC"]],
    });
  }

  static async getById(id: number): Promise<SalaryType | null> {
    return await SalaryType.findByPk(id);
  }

  static async getByPage(
    page: number = 1,
    limit: number = 10
  ): Promise<SalaryTypePaginatedResult> {
    const offset = (page - 1) * limit;
    const { rows, count } = await SalaryType.findAndCountAll({
      limit,
      offset,
      order: [["created_at", "DESC"]],
    });

    return {
      rows,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      pageSize: limit,
    };
  }

  // Tìm kiếm + lọc nâng cao
  static async search(
    query?: string,
    category?: string,
    is_active?: boolean,
    page: number = 1,
    limit: number = 10
  ): Promise<SalaryTypePaginatedResult> {
    const offset = (page - 1) * limit;
    const where: any = {};

    if (query) {
      where[Op.or] = [
        { name: { [Op.like]: `%${query}%` } },
        { code: { [Op.like]: `%${query}%` } },
      ];
    }
    if (category) where.category = category;
    if (typeof is_active === "boolean") where.is_active = is_active;

    const { rows, count } = await SalaryType.findAndCountAll({
      where: Object.keys(where).length ? where : undefined,
      limit,
      offset,
      order: [
        ["is_active", "DESC"],
        ["created_at", "DESC"],
      ],
    });

    return {
      rows,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      pageSize: limit,
    };
  }

  // ===============================
  // CRUD CƠ BẢN
  // ===============================
  static async create(payload: SalaryTypeCreatePayload): Promise<SalaryType> {
    const request = createSalaryTypeRequest(payload);
    return await SalaryType.create(request);
  }

  static async update(
    id: number,
    payload: SalaryTypeUpdatePayload
  ): Promise<SalaryType | null> {
    const item = await SalaryType.findByPk(id);
    if (!item) return null;

    // ĐÃ SỬA LỖI "there" → "payload"
    const request = createSalaryTypeRequest({
      name: payload.name ?? item.name,
      code: payload.code ?? item.code,
      description: payload.description ?? item.description,
      category: payload.category ?? item.category,
      is_taxable: payload.is_taxable ?? item.is_taxable,
      is_active: payload.is_active ?? item.is_active,
    });

    await item.update(request);
    return item.reload(); // Trả về dữ liệu mới nhất
  }

  static async updateStatus(
    id: number,
    is_active: boolean
  ): Promise<SalaryType | null> {
    const item = await SalaryType.findByPk(id);
    if (!item) return null;
    await item.update({ is_active });
    return item.reload();
  }

  static async delete(id: number): Promise<boolean> {
    const deleted = await SalaryType.destroy({ where: { id } });
    return deleted > 0;
  }

  // ===============================
  // KIỂM TRA TRÙNG CODE
  // ===============================
  static async checkDuplicateCode(
    code: string,
    excludeId?: number
  ): Promise<boolean> {
    const where: any = { code };
    if (excludeId) where.id = { [Op.ne]: excludeId };

    const count = await SalaryType.count({ where });
    return count > 0;
  }

  // ===============================
  // LẤY DANH SÁCH ACTIVE CHO DROPDOWN
  // ===============================
  static async getActiveForDropdown(): Promise<SalaryType[]> {
    return await SalaryType.findAll({
      where: { is_active: true },
      attributes: ["id", "name", "code", "category"],
      order: [["name", "ASC"]],
    });
  }

  // ===============================
  // EXPORT TO EXCEL
  // ===============================
  static async exportToExcel(filter?: {
    category?: string;
    is_active?: boolean;
  }): Promise<ExcelJS.Workbook> {
    const where: any = {};
    if (filter?.category) where.category = filter.category;
    if (filter?.is_active !== undefined) where.is_active = filter.is_active;

    const items = await SalaryType.findAll({
      where,
      order: [["created_at", "DESC"]],
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Danh sách loại lương");

    worksheet.columns = [
      { header: "STT", key: "stt", width: 8 },
      { header: "Tên loại lương", key: "name", width: 30 },
      { header: "Mã", key: "code", width: 15 },
      { header: "Nhóm", key: "category", width: 15 },
      { header: "Chịu thuế", key: "is_taxable", width: 12 },
      { header: "Trạng thái", key: "is_active", width: 12 },
      { header: "Mô tả", key: "description", width: 40 },
      { header: "Ngày tạo", key: "created_at", width: 15 },
    ];

    // Header style
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "1976D2" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };

    items.forEach((item, index) => {
      worksheet.addRow({
        stt: index + 1,
        name: item.name,
        code: item.code || "N/A",
        category: this.formatCategory(item.category),
        is_taxable: item.is_taxable ? "Có" : "Không",
        is_active: item.is_active ? "Hoạt động" : "Tạm dừng",
        description: item.description || "N/A",
        created_at: item.created_at
          ? new Date(item.created_at).toLocaleDateString("vi-VN")
          : "N/A",
      });
    });

    if (items.length > 0) {
      worksheet.autoFilter = `A1:H${items.length + 1}`;
    }

    return workbook;
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

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) throw new Error("File Excel trống");

    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      const name = row.getCell(1).value?.toString().trim();
      const code = row.getCell(2).value?.toString().trim();
      const categoryStr = row.getCell(3).value?.toString().trim();
      const is_taxableStr = row.getCell(4).value?.toString().trim();
      const is_activeStr = row.getCell(5).value?.toString().trim();
      const description = row.getCell(6).value?.toString().trim();

      if (!name || !code) {
        result.errors.push(`Dòng ${i}: Thiếu tên hoặc mã`);
        continue;
      }

      const category = this.parseCategory(categoryStr);
      if (!category) {
        result.errors.push(`Dòng ${i}: Nhóm không hợp lệ "${categoryStr}"`);
        continue;
      }

      const is_taxable = this.parseBoolean(is_taxableStr, false);
      const is_active = this.parseBoolean(is_activeStr, true);

      try {
        const exists = await SalaryType.findOne({ where: { code } });
        if (exists) {
          await exists.update({
            name,
            description,
            category,
            is_taxable,
            is_active,
          });
          result.updated++;
        } else {
          await SalaryType.create({
            name,
            code,
            description,
            category,
            is_taxable,
            is_active,
          });
          result.success++;
        }
        result.total++;
      } catch (err: any) {
        result.errors.push(`Dòng ${i}: ${err.message}`);
      }
    }

    return result;
  }

  // ===============================
  // TEMPLATE EXCEL
  // ===============================
  static async createTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("Template loại lương");

    ws.columns = [
      { header: "Tên loại lương (*)", key: "name", width: 30 },
      { header: "Mã (*)", key: "code", width: 15 },
      { header: "Nhóm (*)", key: "category", width: 15 },
      { header: "Chịu thuế", key: "is_taxable", width: 12 },
      { header: "Trạng thái", key: "is_active", width: 12 },
      { header: "Mô tả", key: "description", width: 40 },
    ];

    const header = ws.getRow(1);
    header.font = { bold: true, color: { argb: "FFFFFF" } };
    header.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "1976D2" },
    };
    header.alignment = { vertical: "middle", horizontal: "center" };

    const samples = [
      {
        name: "Lương cơ bản",
        code: "BASIC",
        category: "basic",
        is_taxable: "Có",
        is_active: "Có",
        description: "Lương chính",
      },
      {
        name: "Phụ cấp ăn trưa",
        code: "MEAL",
        category: "allowance",
        is_taxable: "Không",
        is_active: "Có",
        description: "Phụ cấp ăn trưa",
      },
      {
        name: "Thưởng hiệu suất",
        code: "BONUS_PERF",
        category: "bonus",
        is_taxable: "Có",
        is_active: "Có",
        description: "Thưởng KPI",
      },
    ];
    samples.forEach((s) => ws.addRow(s));

    ws.addRow([]);
    ws.addRow(["GHI CHÚ:"]);
    ws.addRow(["(*) Bắt buộc"]);
    ws.addRow(["Nhóm: basic | allowance | bonus | deduction | overtime"]);
    ws.addRow(["Chịu thuế/Trạng thái: Có / Không"]);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // ===============================
  // HELPER
  // ===============================
  private static formatCategory(cat: string): string {
    const map: Record<string, string> = {
      basic: "Lương cơ bản",
      allowance: "Phụ cấp",
      bonus: "Thưởng",
      deduction: "Khấu trừ",
      overtime: "Tăng ca",
    };
    return map[cat] || cat;
  }

  private static parseCategory(str?: string): string | null {
    if (!str) return null;
    const lower = str.toLowerCase().trim();
    const map: Record<string, string> = {
      "lương cơ bản": "basic",
      basic: "basic",
      "phụ cấp": "allowance",
      allowance: "allowance",
      thưởng: "bonus",
      bonus: "bonus",
      "khấu trừ": "deduction",
      deduction: "deduction",
      "tăng ca": "overtime",
      overtime: "overtime",
    };
    return map[lower] || null;
  }

  private static parseBoolean(
    str?: string,
    defaultVal: boolean = false
  ): boolean {
    if (!str) return defaultVal;
    const yes = ["có", "yes", "true", "1", "hoạt động"];
    const no = ["không", "no", "false", "0", "tạm dừng"];
    const val = str.toLowerCase().trim();
    if (yes.includes(val)) return true;
    if (no.includes(val)) return false;
    return defaultVal;
  }
}

export default SalaryTypeService;
