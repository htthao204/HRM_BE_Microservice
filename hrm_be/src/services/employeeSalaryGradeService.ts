// src/services/employeeSalaryGradeService.ts
import { Op } from "sequelize";
import EmployeeSalaryGrade from "../models/employeeSalaryGradeModel";
import SalaryGrade from "../models/salaryGradeModel";
import EmployeeInformation from "../models/employeeModel";

export interface AssignGradePayload {
  employee_id: number;
  salary_grade_id: number;
  reason?: string;
  approved_by?: number;
}

export interface EmployeeSalaryGradePaginatedResult {
  rows: EmployeeSalaryGrade[];
  count: number;
  totalPages: number;
  currentPage: number;
}

export class EmployeeSalaryGradeService {
  // Gán bậc lương mới cho nhân viên (TỰ ĐỘNG HỦY BẬC LƯƠNG HIỆN TẠI)
  static async assignGrade(
    payload: AssignGradePayload
  ): Promise<EmployeeSalaryGrade> {
    const { employee_id, salary_grade_id, reason, approved_by } = payload;

    // Kiểm tra nhân viên và bậc lương có tồn tại
    const employee = await EmployeeInformation.findByPk(employee_id);
    const grade = await SalaryGrade.findByPk(salary_grade_id);
    if (!employee) throw new Error("Nhân viên không tồn tại");
    if (!grade) throw new Error("Bậc lương không tồn tại");
    if (!grade.is_active) throw new Error("Bậc lương đã bị vô hiệu hóa");

    // Tự động kết thúc bậc lương hiện tại
    await EmployeeSalaryGrade.update(
      {
        is_current: false,
        end_date: new Date(),
      },
      {
        where: {
          employee_id,
          is_current: true,
        },
      }
    );

    // Tạo bản ghi mới
    return await EmployeeSalaryGrade.create({
      employee_id,
      salary_grade_id,
      assigned_date: new Date(),
      reason: reason || "Gán bậc lương mới",
      approved_by,
      approved_at: approved_by ? new Date() : null,
      is_current: true,
    });
  }

  // Lấy bậc lương hiện tại của nhân viên
  static async getCurrentGrade(
    employee_id: number
  ): Promise<EmployeeSalaryGrade | null> {
    return await EmployeeSalaryGrade.findOne({
      where: { employee_id, is_current: true },
      include: [
        { model: SalaryGrade, as: "salaryGrade" },
        { model: EmployeeInformation, as: "employee" },
      ],
    });
  }

  // Lấy toàn bộ lịch sử bậc lương của nhân viên
  static async getHistory(
    employee_id: number,
    page: number = 1,
    limit: number = 10
  ): Promise<EmployeeSalaryGradePaginatedResult> {
    const offset = (page - 1) * limit;

    const { rows, count } = await EmployeeSalaryGrade.findAndCountAll({
      where: { employee_id },
      include: [
        { model: SalaryGrade, as: "salaryGrade" },
        {
          model: EmployeeInformation,
          as: "employee",
          attributes: ["full_name", "employee_code"],
        },
      ],
      order: [["assigned_date", "DESC"]],
      limit,
      offset,
    });

    return {
      rows,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    };
  }

  // Lấy tất cả nhân viên đang dùng 1 bậc lương
  static async getEmployeesByGrade(
    salary_grade_id: number,
    onlyCurrent: boolean = true
  ): Promise<EmployeeSalaryGrade[]> {
    const where: any = { salary_grade_id };
    if (onlyCurrent) where.is_current = true;

    return await EmployeeSalaryGrade.findAll({
      where,
      include: [
        {
          model: EmployeeInformation,
          as: "employee",
          attributes: ["id", "full_name", "employee_code"],
        },
      ],
      order: [["assigned_date", "DESC"]],
    });
  }

  // Tìm kiếm lịch sử gán bậc lương
  static async search(
    query?: string,
    employee_id?: number,
    salary_grade_id?: number,
    page: number = 1,
    limit: number = 10
  ): Promise<EmployeeSalaryGradePaginatedResult> {
    const offset = (page - 1) * limit;
    const where: any = { [Op.and]: [] };

    if (employee_id) where[Op.and].push({ employee_id });
    if (salary_grade_id) where[Op.and].push({ salary_grade_id });

    if (query) {
      where[Op.and].push({
        [Op.or]: [
          { "$employee.full_name$": { [Op.like]: `%${query}%` } },
          { "$employee.employee_code$": { [Op.like]: `%${query}%` } },
          { "$salaryGrade.grade_code$": { [Op.like]: `%${query}%` } },
          { "$salaryGrade.grade_name$": { [Op.like]: `%${query}%` } },
        ],
      });
    }

    const { rows, count } = await EmployeeSalaryGrade.findAndCountAll({
      where: where[Op.and].length ? where : undefined,
      include: [
        { model: EmployeeInformation, as: "employee" },
        { model: SalaryGrade, as: "salaryGrade" },
      ],
      order: [["assigned_date", "DESC"]],
      limit,
      offset,
    });

    return {
      rows,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    };
  }

  // Kết thúc bậc lương (dùng khi nhân viên nghỉ việc, chuyển bậc, v.v.)
  static async terminateGrade(
    assignment_id: number,
    end_date?: Date,
    reason?: string
  ): Promise<EmployeeSalaryGrade | null> {
    const assignment = await EmployeeSalaryGrade.findByPk(assignment_id);
    if (!assignment) return null;

    await assignment.update({
      is_current: false,
      end_date: end_date || new Date(),
      reason: reason || "Kết thúc bậc lương",
    });

    return assignment;
  }

  // Lấy thống kê: bao nhiêu người đang dùng từng bậc lương
  static async getGradeUsageStats(): Promise<any[]> {
    return await EmployeeSalaryGrade.findAll({
      where: { is_current: true },
      attributes: [
        "salary_grade_id",
        [
          EmployeeSalaryGrade.sequelize!.fn(
            "COUNT",
            EmployeeSalaryGrade.sequelize!.col("id")
          ),
          "employee_count",
        ],
      ],
      include: [
        {
          model: SalaryGrade,
          as: "salaryGrade",
          attributes: ["grade_code", "grade_name", "basic_salary"],
        },
      ],
      group: ["salary_grade_id", "salaryGrade.id"],
      order: [[EmployeeSalaryGrade.sequelize!.col("employee_count"), "DESC"]],
    });
  }

  // Xóa bản ghi (chỉ dùng khi lỗi dữ liệu)
  static async delete(assignment_id: number): Promise<boolean> {
    const deleted = await EmployeeSalaryGrade.destroy({
      where: { id: assignment_id },
    });
    return deleted > 0;
  }
}

export default EmployeeSalaryGradeService;
