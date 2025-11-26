// controllers/departmentController.ts
import { Request, Response, NextFunction } from "express";
import { ResultResponse } from "../dto/response/resultResponse";
import { DepartmentRequest } from "../dto/request/departmentRequest";
import { DepartmentSearchDTO } from "../dto/search/DepartmentSearchDTO";
import multer from "multer";
import * as DepartmentService from "../services/departmentService"; // THÊM IMPORT

// Cấu hình multer cho file upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 🟪 Xuất Excel - ĐÃ SỬA: sử dụng exportDepartmentsToExcel từ service
export const exportExcelController = async (req: Request, res: Response) => {
  try {
    const { ids, query, status } = req.query;

    const filter: any = {};

    if (ids) {
      if (typeof ids === "string") {
        let idArray: number[] = [];

        if (ids.startsWith("[") && ids.endsWith("]")) {
          // Format: "[1,2,3]"
          try {
            idArray = JSON.parse(ids);
          } catch (parseError) {
            console.warn("Không thể parse IDs array:", ids);
          }
        } else {
          // Format: "1,2,3"
          idArray = ids
            .split(",")
            .map((id) => {
              const numId = Number(id.trim());
              return isNaN(numId) ? null : numId;
            })
            .filter((id) => id !== null) as number[];
        }

        if (idArray.length > 0) {
          filter.ids = idArray;
          console.log(` Export theo ${idArray.length} IDs:`, idArray);
        }
      } else if (Array.isArray(ids)) {
        // Nếu ids là array trực tiếp
        const idArray = ids
          .map((id) => {
            const numId = Number(id);
            return isNaN(numId) ? null : numId;
          })
          .filter((id) => id !== null) as number[];

        if (idArray.length > 0) {
          filter.ids = idArray;
          console.log(` Export theo ${idArray.length} IDs:`, idArray);
        }
      }
    }

    // 🟪 XỬ LÝ QUERY
    if (query && query.toString().trim() !== "") {
      filter.query = query.toString().trim();
      console.log(` Export theo query: "${filter.query}"`);
    }

    // 🟪 XỬ LÝ STATUS
    if (status && status.toString().trim() !== "") {
      filter.status = status.toString().trim();
      console.log(` Export theo status: "${filter.status}"`);
    }

    console.log("Final filter parameters:", filter);

    // 🟪 SỬA: Sử dụng exportDepartmentsToExcel từ service
    const buffer = await DepartmentService.exportDepartmentsToExcel();

    console.log(" Export thành công, gửi file...");

    // Set headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=departments.xlsx"
    );
    res.setHeader("Content-Length", buffer.length);

    res.send(buffer);
  } catch (error) {
    console.error("❌ Lỗi trong exportExcelController:", error);

    return res.status(500).json({
      success: false,
      message: "Lỗi khi xuất file Excel",
      error:
        process.env.NODE_ENV === "development"
          ? (error as any).message
          : undefined,
    });
  }
};

// 🟪 Nhập Excel - ĐÃ SỬA: Sử dụng DepartmentService
export const importDepartmentsFromExcelController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      res
        .status(400)
        .json(
          ResultResponse(false, 400, null, "Vui lòng chọn file Excel để nhập")
        );
      return;
    }

    // 🟪 SỬA: Cần thêm function importFromExcel trong service
    const results = await DepartmentService.importFromExcel(req.file.buffer);

    res.json(
      ResultResponse(
        true,
        200,
        null,
        `Nhập file thành công: ${results.success} bản ghi mới, ${results.updated} bản ghi cập nhật`,
        results
      )
    );
  } catch (err: any) {
    next(err);
  }
};

// 🟪 Download template - ĐÃ SỬA: Sử dụng DepartmentService
export const downloadDepartmentTemplateController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 🟪 SỬA: Cần thêm function createDepartmentTemplate trong service
    const buffer = await DepartmentService.createDepartmentTemplate();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=template-phong-ban.xlsx"
    );

    res.send(buffer);
  } catch (err: any) {
    next(err);
  }
};

// Middleware upload file (dùng cho route)
export const uploadFile = upload.single("file");

// Lấy tất cả phòng ban (phân trang)
export const getAllDepartmentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt((req.query.page as string) || "1");
    const pageSize = parseInt((req.query.pageSize as string) || "10");

    const result = await DepartmentService.getAllDepartments(page, pageSize);

    res.json(
      ResultResponse(true, 200, null, null, result.data, result.totalItems)
    );
  } catch (err: any) {
    next(err);
  }
};

// Tạo phòng ban
export const createDepartmentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const payload: DepartmentRequest = req.body;
    if (!payload.name) {
      res
        .status(400)
        .json(ResultResponse(false, 400, null, "Tên phòng ban là bắt buộc"));
      return;
    }

    const department = await DepartmentService.createDepartment(payload);

    res
      .status(201)
      .json(
        ResultResponse(true, 201, null, "Tạo phòng ban thành công", department)
      );
  } catch (err: any) {
    next(err);
  }
};

// Cập nhật phòng ban
export const updateDepartmentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);
    const payload: DepartmentRequest = req.body;

    if (!payload.name) {
      res
        .status(400)
        .json(ResultResponse(false, 400, null, "Tên phòng ban là bắt buộc"));
      return;
    }

    const department = await DepartmentService.updateDepartment(id, payload);

    if (!department) {
      res
        .status(404)
        .json(ResultResponse(false, 404, null, "Phòng ban không tồn tại"));
      return;
    }

    res
      .status(200)
      .json(
        ResultResponse(
          true,
          200,
          null,
          "Cập nhật phòng ban thành công",
          department
        )
      );
  } catch (err: any) {
    next(err);
  }
};

// Xóa phòng ban
export const deleteDepartmentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await DepartmentService.deleteDepartment(id);

    if (!deleted) {
      res
        .status(404)
        .json(ResultResponse(false, 404, null, "Phòng ban không tồn tại"));
      return;
    }

    res
      .status(200)
      .json(ResultResponse(true, 200, null, "Xóa phòng ban thành công"));
  } catch (err: any) {
    next(err);
  }
};

// Lấy phòng ban theo ID
export const getDepartmentByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);
    const department = await DepartmentService.getDepartmentById(id);

    if (!department) {
      res
        .status(404)
        .json(ResultResponse(false, 404, null, "Phòng ban không tồn tại"));
      return;
    }

    res
      .status(200)
      .json(
        ResultResponse(true, 200, null, "Lấy phòng ban thành công", department)
      );
  } catch (err: any) {
    next(err);
  }
};

// Lấy phòng ban theo managerId
export const getDepartmentByManagerIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const managerId = parseInt(req.params.managerId);
    if (isNaN(managerId)) {
      res
        .status(400)
        .json(ResultResponse(false, 400, null, "Manager ID không hợp lệ"));
      return;
    }

    const departments = await DepartmentService.getDepartmentsByManagerId(
      managerId
    );

    if (!departments.length) {
      res
        .status(404)
        .json(ResultResponse(false, 404, null, "Không tìm thấy phòng ban nào"));
      return;
    }

    res
      .status(200)
      .json(
        ResultResponse(true, 200, null, "Lấy phòng ban thành công", departments)
      );
  } catch (err: any) {
    next(err);
  }
};

// Lấy phòng ban theo filter + phân trang
export const getAllDepartmentFilterController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt((req.query.page as string) || "1");
    const pageSize = parseInt((req.query.pageSize as string) || "10");

    const dto: DepartmentSearchDTO = {
      name: (req.query.name as string)?.trim(),
      cid: (req.query.cid as string)?.trim(),
      location: (req.query.location as string)?.trim(),
      managerName: (req.query.managerName as string)?.trim(),
      disContinue:
        req.query.disContinue !== undefined && req.query.disContinue !== ""
          ? req.query.disContinue === "true"
          : undefined,
    };

    const hasFilter = Object.values(dto).some(
      (v) => v !== undefined && v !== ""
    );

    const result = await DepartmentService.getAllDepartmentsFilter(
      page,
      pageSize,
      hasFilter ? dto : undefined
    );

    res.json(
      ResultResponse(true, 200, null, null, result.data, result.totalItems)
    );
  } catch (err: any) {
    next(err);
  }
};

// Lấy danh sách phòng ban đơn giản (cho dropdown) - THÊM MỚI
export const getAllDepartmentsSimpleController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const departments = await DepartmentService.getAllDepartmentsSimple();
    res.json(
      ResultResponse(
        true,
        200,
        null,
        "Lấy danh sách phòng ban thành công",
        departments
      )
    );
  } catch (err: any) {
    next(err);
  }
};

// Thống kê phòng ban - THÊM MỚI
export const getDepartmentStatisticsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const statistics = await DepartmentService.getDepartmentStatistics();
    res.json(
      ResultResponse(true, 200, null, "Lấy thống kê thành công", statistics)
    );
  } catch (err: any) {
    next(err);
  }
};
