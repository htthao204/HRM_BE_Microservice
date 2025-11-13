import ExcelJS from "exceljs";
import { Op } from "sequelize";
import LateEarlyRule from "../models/lateEarlyRuleModel";
import SalaryGrade from "../models/salaryGradeModel";
import AttendanceSummary from "../models/attendanceSummaryModel";
import SalaryStructure from "../models/salaryStructureModel";
import SalaryType from "../models/salaryTypeModel";
import CalculationRule from "../models/calculationRule";
import CalculationRuleParameter from "../models/calculationRuleParameter";
import TaxConfiguration from "../models/taxConfiguration";
import TaxBracket from "../models/taxBracket";
import InsuranceRate from "../models/insuranceRate Model";
import SystemSetting from "../models/systemSettingModel";
import EmployeeInformation from "../models/employeeModel";
import Department from "../models/departmentModel";

export interface PayrollRuleSearchParams {
  query?: string;
  category?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

export interface PayrollCalculatePayload {
  employeeId: number;
  month: string; // YYYY-MM
  overrides?: Record<string, number>;
}

export interface PayrollResult {
  employee: {
    id: number;
    code: string;
    name: string;
    department: string;
  };
  period: string;
  summary: {
    gross: number;
    net: number;
    totalDeduction: number;
  };
  details: Array<{
    name: string;
    amount: number;
    ruleCode: string;
    formula?: string;
  }>;
  logs: string[];
}

export class PayrollRuleService {
  // ===============================
  // LẤY DANH SÁCH QUY TẮC
  // ===============================
  static async getAll(): Promise<CalculationRule[]> {
    return await CalculationRule.findAll({
      include: [{ model: CalculationRuleParameter, as: "parameters" }],
      order: [["execution_order", "ASC"]],
    });
  }

  static async getById(id: number): Promise<CalculationRule | null> {
    return await CalculationRule.findByPk(id, {
      include: [{ model: CalculationRuleParameter, as: "parameters" }],
    });
  }

  static async search(params: PayrollRuleSearchParams = {}): Promise<{
    rows: CalculationRule[];
    count: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  }> {
    const { query, category, is_active, page = 1, limit = 10 } = params;
    const offset = (page - 1) * limit;
    const where: any = {};

    if (query) {
      where[Op.or] = [
        { name: { [Op.like]: `%${query}%` } },
        { rule_code: { [Op.like]: `%${query}%` } },
      ];
    }
    if (category) where.rule_category = category;
    if (typeof is_active === "boolean") where.is_active = is_active;

    const { rows, count } = await CalculationRule.findAndCountAll({
      where: Object.keys(where).length ? where : undefined,
      include: [{ model: CalculationRuleParameter, as: "parameters" }],
      limit,
      offset,
      order: [["execution_order", "ASC"]],
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
  // LẤY CẤU HÌNH LƯƠNG (TAX, BH, BẬC LƯƠNG...)
  // ===============================
  static async getConfig() {
    const [
      taxConfig,
      taxBrackets,
      insuranceRates,
      settings,
      lateRules,
      salaryGrades,
    ] = await Promise.all([
      TaxConfiguration.findOne({ order: [["effective_date", "DESC"]] }),
      TaxBracket.findAll({ order: [["min_amount", "ASC"]] }),
      InsuranceRate.findAll(),
      SystemSetting.findAll(),
      LateEarlyRule.findAll({ where: { is_active: true } }),
      SalaryGrade.findAll({ where: { is_active: true } }),
    ]);

    const settingsMap = Object.fromEntries(
      settings.map((s) => [s.setting_key, s.setting_value])
    );

    return {
      tax: {
        personalDeduction: taxConfig?.personal_deduction ?? 11000000,
        dependentDeduction: taxConfig?.dependent_deduction ?? 4400000,
        brackets: taxBrackets.map((b) => ({
          from: b.min_amount,
          to: b.max_amount,
          rate: b.tax_rate,
          deduct: b.deduction_amount,
        })),
      },
      insurance: Object.fromEntries(
        insuranceRates.map((i) => [
          i.insurance_type,
          { employee: i.employee_rate, employer: i.employer_rate },
        ])
      ),
      standardWorkingDays: Number(settingsMap.standard_working_days || 22),
      defaultWorkHours: Number(settingsMap.default_work_hours || 8),
      lateEarlyRules: lateRules,
      salaryGrades,
    };
  }

  // ===============================
  // TÍNH LƯƠNG PREVIEW (SIÊU MẠNH)
  // ===============================
  static async calculate(
    payload: PayrollCalculatePayload
  ): Promise<PayrollResult> {
    const { employeeId, month, overrides = {} } = payload;

    // 1. Lấy thông tin nhân viên
    const employee = await EmployeeInformation.findByPk(employeeId, {
      include: [{ model: Department, as: "department" }],
    });
    if (!employee) throw new Error("Employee not found");

    // 2. Lấy dữ liệu đầu vào
    const attendance = await AttendanceSummary.findOne({
      where: { employee_id: employeeId, summary_month: month },
    });

    const salaryItems = await SalaryStructure.findAll({
      where: { employee_id: employeeId, is_active: true },
      include: [{ model: SalaryType, as: "salaryType" }],
    });

    const dependents = await EmployeeDependent.count({
      where: { employee_id: employeeId, tax_registration: true },
    });

    // 3. Context
    const context: any = {
      base_salary:
        salaryItems.find((s) => s.salaryType.code === "BASIC")?.amount || 0,
      actual_working_days:
        (attendance?.total_present_days || 0) +
        (attendance?.total_late_days || 0),
      standard_working_days: 22,
      overtime_hours: attendance?.total_overtime_hours || 0,
      late_minutes: attendance?.total_late_minutes || 0,
      number_of_dependents: dependents,
      ...overrides,
    };

    // Merge config
    const config = await this.getConfig();
    Object.assign(context, config);

    // 4. Lấy rules
    const rules = await CalculationRule.findAll({
      where: { is_active: true },
      include: [{ model: CalculationRuleParameter, as: "parameters" }],
      order: [["execution_order", "ASC"]],
    });

    const details: PayrollResult["details"] = [];
    const logs: string[] = [];
    let gross = 0;
    let totalDeduction = 0;

    for (const rule of rules) {
      try {
        let amount = 0;

        if (rule.rule_type === "FORMULA" || rule.rule_type === "PERCENTAGE") {
          amount = math.evaluate(rule.formula_template, context);
        } else if (rule.rule_type === "FIXED_AMOUNT") {
          amount = Number(rule.formula_template) || 0;
        }

        amount = Number(amount.toFixed(0));

        context[rule.rule_code] = amount;

        if (
          ["SALARY", "ALLOWANCE", "BONUS", "OVERTIME"].includes(
            rule.rule_category
          )
        ) {
          gross += amount;
        } else {
          totalDeduction += Math.abs(amount);
        }

        details.push({
          name: rule.name,
          amount,
          ruleCode: rule.rule_code,
          formula: rule.formula_template,
        });

        logs.push(`${rule.rule_code} → ${amount.toLocaleString()}₫`);
      } catch (err: any) {
        logs.push(`${rule.rule_code} → LỖI: ${err.message}`);
      }
    }

    return {
      employee: {
        id: employee.id,
        code: employee.employee_code,
        name: employee.full_name,
        department: employee.department?.name || "",
      },
      period: month,
      summary: {
        gross,
        net: gross - totalDeduction,
        totalDeduction,
      },
      details,
      logs,
    };
  }

  // ===============================
  // EXPORT TO EXCEL
  // ===============================
  static async exportToExcel(): Promise<ExcelJS.Workbook> {
    const rules = await CalculationRule.findAll({
      include: [{ model: CalculationRuleParameter, as: "parameters" }],
      order: [["execution_order", "ASC"]],
    });

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("Quy tắc tính lương");

    ws.columns = [
      { header: "STT", key: "stt", width: 8 },
      { header: "Tên quy tắc", key: "name", width: 35 },
      { header: "Mã", key: "code", width: 20 },
      { header: "Nhóm", key: "category", width: 15 },
      { header: "Loại", key: "type", width: 15 },
      { header: "Công thức", key: "formula", width: 60 },
      { header: "Thứ tự", key: "order", width: 10 },
      { header: "Hệ thống", key: "system", width: 12 },
      { header: "Hoạt động", key: "active", width: 12 },
    ];

    const header = ws.getRow(1);
    header.font = { bold: true, color: { argb: "FFFFFF" } };
    header.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "1976D2" },
    };

    rules.forEach((rule, i) => {
      ws.addRow({
        stt: i + 1,
        name: rule.name,
        code: rule.rule_code,
        category: this.formatCategory(rule.rule_category),
        type: this.formatType(rule.rule_type),
        formula: rule.formula_template,
        order: rule.execution_order,
        system: rule.is_system_rule ? "Có" : "Không",
        active: rule.is_active ? "Có" : "Không",
      });
    });

    return workbook;
  }

  static async exportToBuffer(): Promise<Buffer> {
    const workbook = await this.exportToExcel();
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // ===============================
  // HELPER
  // ===============================
  private static formatCategory(cat: string): string {
    const map: any = {
      SALARY: "Lương",
      ALLOWANCE: "Phụ cấp",
      DEDUCTION: "Khấu trừ",
      INSURANCE: "Bảo hiểm",
      TAX: "Thuế",
      BONUS: "Thưởng",
      OVERTIME: "Tăng ca",
    };
    return map[cat] || cat;
  }

  private static formatType(type: string): string {
    const map: any = {
      FORMULA: "Công thức",
      PERCENTAGE: "Phần trăm",
      FIXED_AMOUNT: "Cố định",
    };
    return map[type] || type;
  }
}

export default PayrollRuleService;
