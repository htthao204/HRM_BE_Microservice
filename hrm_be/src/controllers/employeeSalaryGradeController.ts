// src/controllers/employeeSalaryGradeController.ts
import { Request, Response, NextFunction } from "express";
import { ResultResponse } from "../dto/response/resultResponse";
import EmployeeSalaryGradeService from "../services/employeeSalaryGradeService";

// Gán bậc lương mới cho nhân viên
export const assignGradeController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { employee_id, salary_grade_id, reason, approved_by } = req.body;

    if (!employee_id || !salary_grade_id) {
      res
        .status(400)
        .json(
          ResultResponse(
            false,
            400,
            null,
            "Thiếu employee_id hoặc salary_grade_id"
          )
        );
      return;
    }

    const assignment = await EmployeeSalaryGradeService.assignGrade({
      employee_id: Number(employee_id),
      salary_grade_id: Number(salary_grade_id),
      reason,
      approved_by: approved_by ? Number(approved_by) : undefined,
    });

    res
      .status(201)
      .json(
        ResultResponse(true, 201, null, "Gán bậc lương thành công", assignment)
      );
  } catch (err: any) {
    next(err);
  }
};

// Lấy bậc lương hiện tại của nhân viên
export const getCurrentGradeController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const employee_id = parseInt(req.params.employee_id, 10);
    if (isNaN(employee_id)) {
      res
        .status(400)
        .json(ResultResponse(false, 400, null, "employee_id không hợp lệ"));
      return;
    }

    const grade = await EmployeeSalaryGradeService.getCurrentGrade(employee_id);
    if (!grade) {
      res
        .status(404)
        .json(ResultResponse(false, 404, null, "Chưa gán bậc lương"));
      return;
    }

    res.json(ResultResponse(true, 200, null, null, grade));
  } catch (err: any) {
    next(err);
  }
};

// Lấy lịch sử gán bậc lương của nhân viên
export const getHistoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const employee_id = parseInt(req.params.employee_id, 10);
    if (isNaN(employee_id)) {
      res
        .status(400)
        .json(ResultResponse(false, 400, null, "employee_id không hợp lệ"));
      return;
    }

    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "10", 10);

    const result = await EmployeeSalaryGradeService.getHistory(
      employee_id,
      page,
      limit
    );

    res.json(
      ResultResponse(
        true,
        200,
        null,
        null,
        result.rows,
        result.count,
        result.totalPages,
        result.currentPage
      )
    );
  } catch (err: any) {
    next(err);
  }
};

// Tìm kiếm toàn bộ lịch sử gán bậc lương
export const searchAssignmentsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = (req.query.q as string) || "";
    const employee_id = req.query.employee_id
      ? parseInt(req.query.employee_id as string, 10)
      : undefined;
    const salary_grade_id = req.query.salary_grade_id
      ? parseInt(req.query.salary_grade_id as string, 10)
      : undefined;

    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "10", 10);

    const result = await EmployeeSalaryGradeService.search(
      query,
      employee_id,
      salary_grade_id,
      page,
      limit
    );

    res.json(
      ResultResponse(
        true,
        200,
        null,
        null,
        result.rows,
        result.count,
        result.totalPages,
        result.currentPage
      )
    );
  } catch (err: any) {
    next(err);
  }
};

// Lấy danh sách nhân viên đang dùng 1 bậc lương
export const getEmployeesByGradeController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const salary_grade_id = parseInt(req.params.salary_grade_id, 10);
    if (isNaN(salary_grade_id)) {
      res
        .status(400)
        .json(ResultResponse(false, 400, null, "salary_grade_id không hợp lệ"));
      return;
    }

    const onlyCurrent = (req.query.current as string) !== "false";
    const employees = await EmployeeSalaryGradeService.getEmployeesByGrade(
      salary_grade_id,
      onlyCurrent
    );

    res.json(
      ResultResponse(true, 200, null, null, employees, employees.length)
    );
  } catch (err: any) {
    next(err);
  }
};

// Kết thúc bậc lương (nghỉ việc, chuyển bậc, v.v.)
export const terminateGradeController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const assignment_id = parseInt(req.params.id, 10);
    if (isNaN(assignment_id)) {
      res.status(400).json(ResultResponse(false, 400, null, "ID không hợp lệ"));
      return;
    }

    const { end_date, reason } = req.body;

    const terminated = await EmployeeSalaryGradeService.terminateGrade(
      assignment_id,
      end_date ? new Date(end_date) : undefined,
      reason
    );

    if (!terminated) {
      res
        .status(404)
        .json(ResultResponse(false, 404, null, "Không tìm thấy bản ghi"));
      return;
    }

    res.json(
      ResultResponse(
        true,
        200,
        null,
        "Kết thúc bậc lương thành công",
        terminated
      )
    );
  } catch (err: any) {
    next(err);
  }
};

// Thống kê sử dụng bậc lương
export const getGradeUsageStatsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const stats = await EmployeeSalaryGradeService.getGradeUsageStats();
    res.json(
      ResultResponse(true, 200, null, "Thống kê bậc lương", stats, stats.length)
    );
  } catch (err: any) {
    next(err);
  }
};
