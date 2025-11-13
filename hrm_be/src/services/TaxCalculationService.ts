// src/services/TaxCalculationService.ts
import ExcelJS from "exceljs";
import { Op } from "sequelize";
import {
  createTaxBracketRequest,
  createTaxConfigRequest,
  TaxBracketRequest,
  TaxConfigRequest,
} from "../dto/request/taxRequest";
import TaxConfiguration from "../models/taxConfiguration";
import TaxBracket from "../models/taxBracket";

export interface TaxConfigCreatePayload extends TaxConfigRequest {}
export interface TaxConfigUpdatePayload extends Partial<TaxConfigRequest> {}
export interface TaxBracketCreatePayload extends TaxBracketRequest {}
export interface TaxBracketUpdatePayload extends Partial<TaxBracketRequest> {}

export interface TaxConfigSearchResult {
  rows: TaxConfiguration[];
  count: number;
}

export interface TaxConfigPaginatedResult {
  rows: TaxConfiguration[];
  count: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface TaxBracketPaginatedResult {
  rows: TaxBracket[];
  count: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface ImportTaxConfigResult {
  total: number;
  success: number;
  errors: string[];
  duplicates: number;
  updated: number;
}

export interface TaxPreviewInput {
  grossSalary: number;
  insuranceDeduction: number;
  dependents: number;
}

export interface TaxPreviewResult {
  taxableIncome: number;
  personalDeduction: number;
  dependentDeduction: number;
  totalDeduction: number;
  taxAmount: number;
  appliedBrackets: Array<{
    from: number;
    to: number | null;
    rate: number;
    incomeInBracket: number;
    taxInBracket: number;
  }>;
}

export class TaxCalculationService {
  // ===============================
  // TAX CONFIGURATION (Giảm trừ gia cảnh, lương tối thiểu)
  // ===============================
  static async getAllConfigs(): Promise<TaxConfiguration[]> {
    return await TaxConfiguration.findAll({
      order: [["effective_date", "DESC"]],
    });
  }

  static async getConfigById(id: number): Promise<TaxConfiguration | null> {
    return await TaxConfiguration.findByPk(id);
  }

  static async getActiveConfig(
    date: string = new Date().toISOString().slice(0, 10)
  ): Promise<TaxConfiguration | null> {
    return await TaxConfiguration.findOne({
      where: {
        effective_date: { [Op.lte]: date },
        is_active: true,
      },
      order: [["effective_date", "DESC"]],
    });
  }

  static async searchConfigs(
    query?: string,
    is_active?: boolean,
    page: number = 1,
    limit: number = 10
  ): Promise<TaxConfigPaginatedResult> {
    const offset = (page - 1) * limit;
    const where: any = {};

    if (query) {
      where[Op.or] = [{ description: { [Op.like]: `%${query}%` } }];
    }
    if (typeof is_active === "boolean") where.is_active = is_active;

    const { rows, count } = await TaxConfiguration.findAndCountAll({
      where: Object.keys(where).length ? where : undefined,
      limit,
      offset,
      order: [["effective_date", "DESC"]],
    });

    return {
      rows,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      pageSize: limit,
    };
  }

  static async createConfig(
    payload: TaxConfigCreatePayload
  ): Promise<TaxConfiguration> {
    const request = createTaxConfigRequest(payload);
    return await TaxConfiguration.create(request);
  }

  static async updateConfig(
    id: number,
    payload: TaxConfigUpdatePayload
  ): Promise<TaxConfiguration | null> {
    const config = await TaxConfiguration.findByPk(id);
    if (!config) return null;

    const request = createTaxConfigRequest({
      effective_date: payload.effective_date ?? config.effective_date,
      personal_deduction:
        payload.personal_deduction ?? config.personal_deduction,
      dependent_deduction:
        payload.dependent_deduction ?? config.dependent_deduction,
      region_min_salary: payload.region_min_salary ?? config.region_min_salary,
      description: payload.description ?? config.description,
      is_active: payload.is_active ?? config.is_active,
    });

    await config.update(request);
    return config.reload();
  }

  static async deleteConfig(id: number): Promise<boolean> {
    const deleted = await TaxConfiguration.destroy({ where: { id } });
    return deleted > 0;
  }

  // ===============================
  // TAX BRACKETS (Bảng thuế lũy tiến 7 bậc)
  // ===============================
  static async getAllBrackets(year?: number): Promise<TaxBracket[]> {
    const where: any = {};
    if (year) where.effective_year = year;

    return await TaxBracket.findAll({
      where,
      order: [["min_amount", "ASC"]],
    });
  }

  static async getBracketsByYear(year: number): Promise<TaxBracket[]> {
    return await this.getAllBrackets(year);
  }

  static async searchBrackets(
    year?: number,
    page: number = 1,
    limit: number = 10
  ): Promise<TaxBracketPaginatedResult> {
    const offset = (page - 1) * limit;
    const where: any = {};
    if (year) where.effective_year = year;

    const { rows, count } = await TaxBracket.findAndCountAll({
      where,
      limit,
      offset,
      order: [["min_amount", "ASC"]],
    });

    return {
      rows,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      pageSize: limit,
    };
  }

  static async createBracket(
    payload: TaxBracketCreatePayload
  ): Promise<TaxBracket> {
    const request = createTaxBracketRequest(payload);
    return await TaxBracket.create(request);
  }

  static async updateBracket(
    id: number,
    payload: TaxBracketUpdatePayload
  ): Promise<TaxBracket | null> {
    const bracket = await TaxBracket.findByPk(id);
    if (!bracket) return null;

    const request = createTaxBracketRequest({
      min_amount: payload.min_amount ?? bracket.min_amount,
      max_amount: payload.max_amount ?? bracket.max_amount,
      tax_rate: payload.tax_rate ?? bracket.tax_rate,
      deduction_amount: payload.deduction_amount ?? bracket.deduction_amount,
      effective_year: payload.effective_year ?? bracket.effective_year,
      description: payload.description ?? bracket.description,
    });

    await bracket.update(request);
    return bracket.reload();
  }

  static async deleteBracket(id: number): Promise<boolean> {
    const deleted = await TaxBracket.destroy({ where: { id } });
    return deleted > 0;
  }

  // ===============================
  // TÍNH THUẾ TNCN (Core Function)
  // ===============================
  static async calculatePIT(
    input: TaxPreviewInput & { employeeId?: number }
  ): Promise<TaxPreviewResult> {
    const { grossSalary, insuranceDeduction, dependents, employeeId } = input;

    const config = await this.getActiveConfig();
    if (!config) throw new Error("Không tìm thấy cấu hình thuế hiện hành");

    const personalDeduction = config.personal_deduction;
    const dependentDeduction = config.dependent_deduction * dependents;
    const totalDeduction =
      personalDeduction + dependentDeduction + insuranceDeduction;
    const taxableIncome = Math.max(0, grossSalary - totalDeduction);

    const brackets = await this.getBracketsByYear(new Date().getFullYear());
    let taxAmount = 0;
    let remaining = taxableIncome;
    const appliedBrackets: TaxPreviewResult["appliedBrackets"] = [];

    for (const b of brackets) {
      if (remaining <= 0) break;

      const from = b.min_amount;
      const to = b.max_amount ?? Infinity;
      const incomeInBracket = Math.min(remaining, to - from);
      const taxInBracket =
        incomeInBracket * b.tax_rate - (b.deduction_amount || 0);

      taxAmount += Math.max(0, taxInBracket);
      remaining -= incomeInBracket;

      appliedBrackets.push({
        from,
        to: b.max_amount ?? null,
        rate: b.tax_rate,
        incomeInBracket,
        taxInBracket: Math.max(0, taxInBracket),
      });
    }

    return {
      taxableIncome: Math.round(taxableIncome),
      personalDeduction,
      dependentDeduction,
      totalDeduction,
      taxAmount: Math.round(taxAmount),
      appliedBrackets,
    };
  }

  // Quick calculate (dùng cho preview)
  static quickPIT(
    gross: number,
    insurance: number,
    dependents: number = 0
  ): number {
    const personal = 11000000;
    const dependent = 4400000;
    const taxable = Math.max(
      0,
      gross - insurance - personal - dependent * dependents
    );

    const brackets = [
      { to: 5000000, rate: 0.05, deduct: 0 },
      { to: 10000000, rate: 0.1, deduct: 250000 },
      { to: 18000000, rate: 0.15, deduct: 750000 },
      { to: 32000000, rate: 0.2, deduct: 1650000 },
      { to: 52000000, rate: 0.25, deduct: 3250000 },
      { to: 80000000, rate: 0.3, deduct: 5850000 },
      { to: Infinity, rate: 0.35, deduct: 9850000 },
    ];

    let tax = 0;
    let prev = 0;
    for (const b of brackets) {
      if (taxable <= prev) break;
      const inBracket = Math.min(taxable - prev, b.to - prev);
      tax += inBracket * b.rate - b.deduct;
      prev = b.to;
    }
    return Math.round(Math.max(0, tax));
  }

  // ===============================
  // EXPORT TAX CONFIG + BRACKETS
  // ===============================
  static async exportTaxConfigToExcel(): Promise<ExcelJS.Workbook> {
    const configs = await this.getAllConfigs();
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("Cấu hình thuế");

    ws.columns = [
      { header: "Ngày hiệu lực", key: "effective_date", width: 15 },
      { header: "Giảm trừ bản thân", key: "personal", width: 20 },
      { header: "Giảm trừ NPT", key: "dependent", width: 18 },
      { header: "Lương tối thiểu vùng", key: "min_salary", width: 22 },
      { header: "Mô tả", key: "description", width: 40 },
      { header: "Trạng thái", key: "is_active", width: 12 },
    ];

    const header = ws.getRow(1);
    header.font = { bold: true, color: { argb: "FFFFFF" } };
    header.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "1976D2" },
    };

    configs.forEach((c) => {
      ws.addRow({
        effective_date: new Date(c.effective_date).toLocaleDateString("vi-VN"),
        personal: this.formatCurrency(c.personal_deduction),
        dependent: this.formatCurrency(c.dependent_deduction),
        min_salary: this.formatCurrency(c.region_min_salary),
        description: c.description || "N/A",
        is_active: c.is_active ? "Hoạt động" : "Ngừng",
      });
    });

    // Sheet 2: Bảng thuế
    const brackets = await this.getBracketsByYear(2025);
    const ws2 = workbook.addWorksheet("Bảng thuế lũy tiến");
    ws2.columns = [
      { header: "Từ (VND)", key: "from", width: 18 },
      { header: "Đến (VND)", key: "to", width: 18 },
      { header: "Thuế suất", key: "rate", width: 12 },
      { header: "Khấu trừ nhanh", key: "deduct", width: 20 },
      { header: "Năm", key: "year", width: 10 },
    ];

    const h2 = ws2.getRow(1);
    h2.font = { bold: true, color: { argb: "FFFFFF" } };
    h2.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "D32F2F" },
    };

    brackets.forEach((b) => {
      ws2.addRow({
        from: this.formatCurrency(b.min_amount),
        to: b.max_amount ? this.formatCurrency(b.max_amount) : "Trở lên",
        rate: (b.tax_rate * 100).toFixed(1) + "%",
        deduct: this.formatCurrency(b.deduction_amount || 0),
        year: b.effective_year,
      });
    });

    return workbook;
  }

  static async exportTaxConfigBuffer(): Promise<Buffer> {
    const workbook = await this.exportTaxConfigToExcel();
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // ===============================
  // IMPORT + TEMPLATE
  // ===============================
  static async createTaxTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("Template cấu hình thuế");

    ws.columns = [
      { header: "Ngày hiệu lực (*)", key: "date", width: 18 },
      { header: "Giảm trừ bản thân (*)", key: "personal", width: 22 },
      { header: "Giảm trừ NPT (*)", key: "dependent", width: 20 },
      { header: "Lương tối thiểu vùng", key: "min_salary", width: 22 },
      { header: "Mô tả", key: "desc", width: 40 },
      { header: "Trạng thái", key: "active", width: 12 },
    ];

    const header = ws.getRow(1);
    header.font = { bold: true, color: { argb: "FFFFFF" } };
    header.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "1976D2" },
    };

    ws.addRow({
      date: "2025-01-01",
      personal: "11000000",
      dependent: "4400000",
      min_salary: "4680000",
      desc: "Cập nhật theo Nghị định 2025",
      active: "Có",
    });

    ws.addRow([]);
    ws.addRow(["GHI CHÚ: Ngày hiệu lực định dạng YYYY-MM-DD"]);
    ws.addRow(["Trạng thái: Có / Không"]);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // ===============================
  // HELPER
  // ===============================
  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat("vi-VN").format(amount) + " ₫";
  }
}

export default TaxCalculationService;
