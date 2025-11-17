import { Request, Response, NextFunction } from "express";
import { ResultResponse } from "../dto/response/resultResponse";
import {
  createEmployee,
  updateEmployee,
  getEmployeeById,
  getAllEmployees,
  deleteEmployee,
  getEmployeeDependents,
  getEmployeeJobInfo,
  createEmployeeTemplate,
  importEmployeesFromExcel,
  exportEmployeesToExcelBuffer,
  getEmployeeByAccountId,
} from "../services/employeeService";
import multer from "multer";
const storage = multer.memoryStorage();
const upload = multer({ storage });
// ===============================
// 🔹 Lấy danh sách nhân viên (phân trang + filters)
// ===============================
export const getAllEmployeesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt((req.query.page as string) || "1");
    const pageSize = parseInt((req.query.pageSize as string) || "10");

    const filters = {
      departmentId: req.query.departmentId
        ? parseInt(req.query.departmentId as string)
        : undefined,
      positionId: req.query.positionId
        ? parseInt(req.query.positionId as string)
        : undefined,
      status: req.query.status as string,
      search: req.query.search as string,
    };

    const result = await getAllEmployees(page, pageSize, filters);

    res.json(
      ResultResponse(true, 200, null, "Lấy danh sách nhân viên thành công", {
        data: result.data,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalItems: result.totalItems,
          pageSize: pageSize,
        },
      })
    );
  } catch (err) {
    next(err);
  }
};

// ===============================
// 🔹 Lấy chi tiết nhân viên (full info)
// ===============================
export const getEmployeeByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id))
      return res
        .status(400)
        .json(ResultResponse(false, 400, null, "ID nhân viên không hợp lệ"));

    const employee = await getEmployeeById(id);

    res.json(
      ResultResponse(
        true,
        200,
        null,
        "Lấy chi tiết nhân viên thành công",
        employee
      )
    );
  } catch (err) {
    next(err);
  }
};

// ===============================
// 🔹 Lấy thông tin công việc của nhân viên
// ===============================
export const getEmployeeJobInfoController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id))
      return res
        .status(400)
        .json(ResultResponse(false, 400, null, "ID nhân viên không hợp lệ"));

    const jobInfo = await getEmployeeJobInfo(id);

    res.json(
      ResultResponse(
        true,
        200,
        null,
        "Lấy thông tin công việc thành công",
        jobInfo
      )
    );
  } catch (err) {
    next(err);
  }
};

// ===============================
// 🔹 Tạo nhân viên mới
// ===============================
export const createEmployeeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const newEmployee = req.body;

    if (!newEmployee.fullName || !newEmployee.email)
      return res
        .status(400)
        .json(
          ResultResponse(false, 400, null, "FullName và Email là bắt buộc")
        );

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmployee.email))
      return res
        .status(400)
        .json(ResultResponse(false, 400, null, "Email không đúng định dạng"));

    const created = await createEmployee(newEmployee);

    res
      .status(201)
      .json(
        ResultResponse(true, 201, null, "Tạo nhân viên thành công", created)
      );
  } catch (err) {
    next(err);
  }
};

// ===============================
// 🔹 Cập nhật nhân viên
// ===============================
export const updateEmployeeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id))
      return res
        .status(400)
        .json(ResultResponse(false, 400, null, "ID nhân viên không hợp lệ"));

    const updated = await updateEmployee(id, req.body);
    res.json(
      ResultResponse(true, 200, null, "Cập nhật nhân viên thành công", updated)
    );
  } catch (err) {
    next(err);
  }
};

// ===============================
// 🔹 Xóa nhân viên
// ===============================
export const deleteEmployeeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id))
      return res
        .status(400)
        .json(ResultResponse(false, 400, null, "ID nhân viên không hợp lệ"));

    const deleted = await deleteEmployee(id);
    res.json(ResultResponse(true, 200, null, deleted.message));
  } catch (err) {
    next(err);
  }
};

// ===============================
// 🔹 Lấy danh sách người phụ thuộc
// ===============================
export const getEmployeeDependentsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const employeeId = parseInt(req.params.employeeId);
    if (isNaN(employeeId))
      return res
        .status(400)
        .json(ResultResponse(false, 400, null, "ID nhân viên không hợp lệ"));

    const deps = await getEmployeeDependents(employeeId);
    res.json(
      ResultResponse(true, 200, null, "Lấy người phụ thuộc thành công", deps)
    );
  } catch (err) {
    next(err);
  }
};
export const exportExcelController = async (req: Request, res: Response) => {
  try {
    console.log("🟢 Bắt đầu exportExcelController cho nhân viên");
    console.log("URL:", req.url);
    console.log("Method:", req.method);
    console.log("Query params:", req.query);

    const { departmentIds, positionIds, status, search } = req.query;

    const filter: any = {};

    // Xử lý departmentIds
    if (departmentIds) {
      console.log("departmentIds raw:", departmentIds);
      if (typeof departmentIds === "string") {
        const idArray = departmentIds
          .split(",")
          .map((id) => {
            const numId = Number(id.trim());
            return isNaN(numId) ? null : numId;
          })
          .filter((id) => id !== null) as number[];

        if (idArray.length > 0) {
          filter.departmentIds = idArray;
          console.log("departmentIds processed:", idArray);
        }
      } else if (Array.isArray(departmentIds)) {
        const idArray = departmentIds
          .map((id) => {
            const numId = Number(id);
            return isNaN(numId) ? null : numId;
          })
          .filter((id) => id !== null) as number[];

        if (idArray.length > 0) {
          filter.departmentIds = idArray;
        }
      }
    }

    // Xử lý positionIds
    if (positionIds) {
      console.log("positionIds raw:", positionIds);
      if (typeof positionIds === "string") {
        const idArray = positionIds
          .split(",")
          .map((id) => {
            const numId = Number(id.trim());
            return isNaN(numId) ? null : numId;
          })
          .filter((id) => id !== null) as number[];

        if (idArray.length > 0) {
          filter.positionIds = idArray;
          console.log("positionIds processed:", idArray);
        }
      }
    }

    if (status) {
      filter.status = status.toString();
      console.log("status:", filter.status);
    }
    if (search) {
      filter.search = search.toString();
      console.log("search:", filter.search);
    }

    console.log("Final filter parameters:", filter);

    const buffer = await exportEmployeesToExcelBuffer(filter);

    console.log("✅ Export thành công, gửi file...");

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=danh-sach-nhan-vien.xlsx"
    );
    res.setHeader("Content-Length", buffer.length);

    res.send(buffer);
  } catch (error: any) {
    console.error("❌ Lỗi trong exportExcelController:", error);
    console.error("Error stack:", error.stack);

    return res.status(500).json({
      success: false,
      message: "Lỗi khi xuất file Excel",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// 🟪 Nhập Excel nhân viên
export const importEmployeesFromExcelController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("🟢 Bắt đầu importEmployeesFromExcelController");

    if (!req.file) {
      return res
        .status(400)
        .json(
          ResultResponse(false, 400, null, "Vui lòng chọn file Excel để nhập")
        );
    }

    console.log("File received:", req.file.originalname, req.file.size);

    const results = await importEmployeesFromExcel(req.file.buffer);

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
    console.error("❌ Lỗi trong importEmployeesFromExcelController:", err);
    next(err);
  }
};

// 🟪 Download template nhân viên
export const downloadEmployeeTemplateController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("🟢 Bắt đầu downloadEmployeeTemplateController");

    const buffer = await createEmployeeTemplate();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=template-nhan-vien.xlsx"
    );
    res.setHeader("Content-Length", buffer.length);

    res.send(buffer);
  } catch (err: any) {
    console.error("❌ Lỗi trong downloadEmployeeTemplateController:", err);
    next(err);
  }
};

// Middleware upload file
export const uploadFile = upload.single("file");
// ===============================
// 🔹 Lấy employee bằng accountId
// ===============================
export const getEmployeeByAccountController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { accountId } = req.params;

    if (!accountId || isNaN(Number(accountId))) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, null, "Account ID không hợp lệ"));
    }

    const employee = await getEmployeeByAccountId(parseInt(accountId));

    if (!employee) {
      return res
        .status(404)
        .json(
          ResultResponse(false, 404, null, "Không tìm thấy thông tin nhân viên")
        );
    }

    res.json(
      ResultResponse(
        true,
        200,
        null,
        "Lấy thông tin nhân viên thành công",
        employee
      )
    );
  } catch (err: any) {
    console.error("Error in getEmployeeByAccountController:", err);
    next(err);
  }
};

// ===============================
// 🔹 Lấy employee của user hiện tại
// ===============================
export const getCurrentEmployeeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // ✅ Lấy accountId từ token (đã được auth middleware set)
    const accountId = (req as any).user?.id;

    if (!accountId) {
      return res
        .status(401)
        .json(ResultResponse(false, 401, null, "Unauthorized"));
    }

    const employee = await getEmployeeByAccountId(accountId);

    if (!employee) {
      return res
        .status(404)
        .json(
          ResultResponse(false, 404, null, "Không tìm thấy thông tin nhân viên")
        );
    }

    res.json(
      ResultResponse(
        true,
        200,
        null,
        "Lấy thông tin nhân viên thành công",
        employee
      )
    );
  } catch (err: any) {
    console.error("Error in getCurrentEmployeeController:", err);
    next(err);
  }
};
