// src/controllers/salaryGradeController.ts
import { Request, Response, NextFunction } from "express";
import { ResultResponse } from "../dto/response/resultResponse";
import SalaryGradeService from "../services/salaryGradeService";

// Lấy tất cả bậc lương
export const getAllSalaryGradeController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const grades = await SalaryGradeService.getAll();
    res.json(ResultResponse(true, 200, null, null, grades, grades.length));
  } catch (err: any) {
    next(err);
  }
};

// Lấy bậc lương theo ID
export const getSalaryGradeByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json(ResultResponse(false, 400, null, "ID không hợp lệ"));
      return;
    }

    const grade = await SalaryGradeService.getById(id);
    if (!grade) {
      res
        .status(404)
        .json(ResultResponse(false, 404, null, "Bậc lương không tồn tại"));
      return;
    }

    res.json(ResultResponse(true, 200, null, null, grade));
  } catch (err: any) {
    next(err);
  }
};

// Lấy theo phân trang
export const getSalaryGradeByPageController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "10", 10);

    const result = await SalaryGradeService.getByPage(page, limit);
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

// Tìm kiếm bậc lương
export const searchSalaryGradeController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = (req.query.q as string) || "";
    const isActiveStr = req.query.is_active as string | undefined;
    const is_active =
      isActiveStr === "true"
        ? true
        : isActiveStr === "false"
        ? false
        : undefined;

    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "10", 10);

    const result = await SalaryGradeService.search(
      query,
      is_active,
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

// Tạo bậc lương mới
export const createSalaryGradeController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      grade_code,
      grade_name,
      basic_salary,
      coefficient,
      min_salary,
      max_salary,
      description,
      effective_date,
    } = req.body;

    if (
      !grade_code ||
      !grade_name ||
      !basic_salary ||
      !coefficient ||
      !min_salary ||
      !max_salary
    ) {
      res
        .status(400)
        .json(
          ResultResponse(
            false,
            400,
            null,
            "Các trường bắt buộc: mã, tên, lương cơ bản, hệ số, min, max"
          )
        );
      return;
    }

    // Kiểm tra trùng mã
    const exists = await SalaryGradeService.checkDuplicateCode(grade_code);
    if (exists) {
      res
        .status(400)
        .json(
          ResultResponse(
            false,
            400,
            null,
            `Mã bậc lương "${grade_code}" đã tồn tại`
          )
        );
      return;
    }

    const newGrade = await SalaryGradeService.create({
      grade_code,
      grade_name,
      basic_salary,
      coefficient,
      min_salary,
      max_salary,
      description,
      effective_date,
    });

    res
      .status(201)
      .json(
        ResultResponse(true, 201, null, "Tạo bậc lương thành công", newGrade)
      );
  } catch (err: any) {
    next(err);
  }
};

// Cập nhật bậc lương
export const updateSalaryGradeController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json(ResultResponse(false, 400, null, "ID không hợp lệ"));
      return;
    }

    const {
      grade_code,
      grade_name,
      basic_salary,
      coefficient,
      min_salary,
      max_salary,
      description,
      effective_date,
      end_date,
    } = req.body;

    if (
      !grade_code ||
      !grade_name ||
      !basic_salary ||
      !coefficient ||
      !min_salary ||
      !max_salary
    ) {
      res
        .status(400)
        .json(
          ResultResponse(
            false,
            400,
            null,
            "Các trường bắt buộc không được để trống"
          )
        );
      return;
    }

    // Kiểm tra trùng mã (trừ chính nó)
    const exists = await SalaryGradeService.checkDuplicateCode(grade_code, id);
    if (exists) {
      res
        .status(400)
        .json(
          ResultResponse(
            false,
            400,
            null,
            `Mã bậc lương "${grade_code}" đã được sử dụng`
          )
        );
      return;
    }

    const updatedGrade = await SalaryGradeService.update(id, {
      grade_code,
      grade_name,
      basic_salary,
      coefficient,
      min_salary,
      max_salary,
      description,
      effective_date,
      end_date,
    });

    if (!updatedGrade) {
      res
        .status(404)
        .json(ResultResponse(false, 404, null, "Bậc lương không tồn tại"));
      return;
    }

    res.json(
      ResultResponse(
        true,
        200,
        null,
        "Cập nhật bậc lương thành công",
        updatedGrade
      )
    );
  } catch (err: any) {
    next(err);
  }
};

// Xóa bậc lương
export const deleteSalaryGradeController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json(ResultResponse(false, 400, null, "ID không hợp lệ"));
      return;
    }

    const deleted = await SalaryGradeService.delete(id);
    if (!deleted) {
      res
        .status(404)
        .json(ResultResponse(false, 404, null, "Bậc lương không tồn tại"));
      return;
    }

    res.json(ResultResponse(true, 200, null, "Xóa bậc lương thành công"));
  } catch (err: any) {
    next(err);
  }
};

// Cập nhật trạng thái active/inactive
export const toggleSalaryGradeStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json(ResultResponse(false, 400, null, "ID không hợp lệ"));
      return;
    }

    const { is_active } = req.body;
    if (typeof is_active !== "boolean") {
      res
        .status(400)
        .json(ResultResponse(false, 400, null, "is_active phải là boolean"));
      return;
    }

    const updated = await SalaryGradeService.updateStatus(id, is_active);
    if (!updated) {
      res
        .status(404)
        .json(ResultResponse(false, 404, null, "Bậc lương không tồn tại"));
      return;
    }

    res.json(
      ResultResponse(
        true,
        200,
        null,
        `Bậc lương đã được ${is_active ? "kích hoạt" : "vô hiệu hóa"}`,
        updated
      )
    );
  } catch (err: any) {
    next(err);
  }
};

// Lấy các bậc lương đang hoạt động
export const getActiveSalaryGradesController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const grades = await SalaryGradeService.getActive();
    res.json(ResultResponse(true, 200, null, null, grades, grades.length));
  } catch (err: any) {
    next(err);
  }
};

// ===============================
// EXPORT SALARY GRADES TO EXCEL
// ===============================
export const exportSalaryGradesToExcelController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { is_active } = req.query;
    const filter: any = {};
    if (is_active !== undefined) {
      filter.is_active = is_active === "true";
    }

    console.log("Export salary grades filter:", filter);

    const buffer = await SalaryGradeService.exportToBuffer(filter);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="danh-sach-bac-luong-${
        new Date().toISOString().split("T")[0]
      }.xlsx"`
    );
    res.setHeader("Content-Length", buffer.length);

    res.send(buffer);
  } catch (error: any) {
    console.error("Lỗi export bậc lương Excel:", error);
    res
      .status(500)
      .json(
        ResultResponse(
          false,
          500,
          null,
          `Lỗi xuất file Excel: ${error.message}`
        )
      );
  }
};

// ===============================
// IMPORT SALARY GRADES FROM EXCEL
// ===============================
export const importSalaryGradesFromExcelController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      res
        .status(400)
        .json(ResultResponse(false, 400, null, "Không có file được tải lên"));
      return;
    }

    const fileBuffer = req.file.buffer;
    const results = await SalaryGradeService.importFromExcel(fileBuffer);

    res.json(
      ResultResponse(
        true,
        200,
        null,
        `Import thành công: ${results.success} thêm mới, ${results.updated} cập nhật, ${results.errors.length} lỗi`,
        results
      )
    );
  } catch (error: any) {
    console.error("Lỗi import bậc lương Excel:", error);
    res
      .status(500)
      .json(
        ResultResponse(false, 500, null, `Lỗi import file: ${error.message}`)
      );
  }
};

// ===============================
// DOWNLOAD SALARY GRADE TEMPLATE
// ===============================
export const downloadSalaryGradeTemplateController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const buffer = await SalaryGradeService.createTemplate();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=template-bac-luong.xlsx"
    );
    res.setHeader("Content-Length", buffer.length);

    res.send(buffer);
  } catch (error: any) {
    console.error("Lỗi download template bậc lương:", error);
    res
      .status(500)
      .json(
        ResultResponse(false, 500, null, `Lỗi tạo template: ${error.message}`)
      );
  }
};
