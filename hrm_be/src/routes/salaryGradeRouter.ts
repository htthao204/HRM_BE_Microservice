// src/routers/salaryGradeRouter.ts
import { Router } from "express";
import multer from "multer";
import { authentication } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/authorizeMiddleware";
import {
  getAllSalaryGradeController,
  getSalaryGradeByIdController,
  getSalaryGradeByPageController,
  searchSalaryGradeController,
  createSalaryGradeController,
  updateSalaryGradeController,
  deleteSalaryGradeController,
  toggleSalaryGradeStatusController,
  getActiveSalaryGradesController,
  exportSalaryGradesToExcelController,
  importSalaryGradesFromExcelController,
  downloadSalaryGradeTemplateController,
} from "../controllers/salaryGradeController";

const salaryGradeRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

// ===============================
// BASIC CRUD ROUTES
// ===============================

// Lấy tất cả bậc lương
salaryGradeRouter.get(
  "/all",
  authentication,
  // authorize("salary_grade_view_all"),
  getAllSalaryGradeController
);

// Lấy bậc lương theo ID
salaryGradeRouter.get(
  "/:id",
  authentication,
  // authorize("salary_grade_view"),
  getSalaryGradeByIdController
);

// Lấy theo phân trang
salaryGradeRouter.get(
  "/all/page",
  authentication,
  // authorize("salary_grade_view_all"),
  getSalaryGradeByPageController
);

// Tìm kiếm bậc lương (theo mã, tên, trạng thái)
salaryGradeRouter.get(
  "/search",
  authentication,
  // authorize("salary_grade_search"),
  searchSalaryGradeController
);

// Lấy các bậc lương đang hoạt động
salaryGradeRouter.get(
  "/active",
  authentication,
  // authorize("salary_grade_view_active"),
  getActiveSalaryGradesController
);

// Tạo bậc lương mới
salaryGradeRouter.post(
  "/",
  authentication,
  // authorize("salary_grade_create"),
  createSalaryGradeController
);

// Cập nhật bậc lương
salaryGradeRouter.put(
  "/:id",
  authentication,
  // authorize("salary_grade_update"),
  updateSalaryGradeController
);

// Xóa bậc lương
salaryGradeRouter.delete(
  "/:id",
  authentication,
  // authorize("salary_grade_delete"),
  deleteSalaryGradeController
);

// Cập nhật trạng thái active/inactive
salaryGradeRouter.patch(
  "/:id/status",
  authentication,
  // authorize("salary_grade_update_status"),
  toggleSalaryGradeStatusController
);

// ===============================
// EXCEL IMPORT/EXPORT ROUTES
// ===============================

// Xuất danh sách bậc lương ra Excel
salaryGradeRouter.get(
  "/export/excel",
  authentication,
  // authorize("salary_grade_export"),
  exportSalaryGradesToExcelController
);

// Nhập bậc lương từ file Excel
salaryGradeRouter.post(
  "/import/excel",
  authentication,
  // authorize("salary_grade_import"),
  upload.single("file"),
  importSalaryGradesFromExcelController
);

// Tải template Excel cho bậc lương
salaryGradeRouter.get(
  "/template/excel",
  authentication,
  // authorize("salary_grade_template"),
  downloadSalaryGradeTemplateController
);

export default salaryGradeRouter;
