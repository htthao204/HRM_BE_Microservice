// routers/countryRouter.ts
import { Router } from "express";
import multer from "multer";
import { authentication } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/authorizeMiddleware";
import {
  getCountriesController,
  getCountryByIdController,
  createCountryController,
  updateCountryController,
  deleteCountryController,
  deleteMultipleCountriesController,
  exportCountriesExcelController,
  importCountriesFromExcelController,
  downloadCountryTemplateController,
  getAllCountriesController,
  getCountriesDropdownController,
  checkCountryNameExistsController,
  checkCountryCodeExistsController,
  getCountriesByFilterController,
} from "../controllers/countryController";

const countryRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

// ===============================
// 🔹 PERMISSION DEFINITIONS
// ===============================
/*
country_view_all: Xem tất cả countries
country_view: Xem danh sách countries (phân trang)
country_create: Tạo country mới
country_update: Cập nhật country
country_delete: Xóa country
country_export: Xuất Excel
country_import: Nhập Excel
country_template: Tải template
country_check: Kiểm tra trùng
*/

// ===============================
// 🔹 BASIC CRUD ROUTES
// ===============================

// Lấy tất cả countries (không phân trang)
countryRouter.get(
  "/all",
  authentication,
  //authorize("country_view_all"),
  getAllCountriesController
);

// Lấy danh sách countries với phân trang
countryRouter.get(
  "/",
  authentication,
  //authorize("country_view"),
  getCountriesController
);

// Lấy danh sách countries với filter
countryRouter.get(
  "/filter",
  authentication,
  //authorize("country_view"),
  getCountriesByFilterController
);

// Lấy danh sách countries cho dropdown
countryRouter.get(
  "/dropdown",
  authentication,
  //authorize("country_view"),
  getCountriesDropdownController
);

// Kiểm tra trùng tên country
countryRouter.get(
  "/check/name",
  authentication,
  //authorize("country_check"),
  checkCountryNameExistsController
);

// Kiểm tra trùng mã country
countryRouter.get(
  "/check/code",
  authentication,
  //authorize("country_check"),
  checkCountryCodeExistsController
);

// Lấy country theo ID
countryRouter.get(
  "/:id",
  authentication,
  //authorize("country_view"),
  getCountryByIdController
);

// Tạo country mới
countryRouter.post(
  "/",
  authentication,
  //authorize("country_create"),
  createCountryController
);

// Xóa nhiều countries
countryRouter.post(
  "/delete-multiple",
  authentication,
  //authorize("country_delete"),
  deleteMultipleCountriesController
);

// Cập nhật country
countryRouter.put(
  "/:id",
  authentication,
  ///authorize("country_update"),
  updateCountryController
);

// Xóa country
countryRouter.delete(
  "/:id",
  authentication,
  //authorize("country_delete"),
  deleteCountryController
);

// ===============================
// 🔹 EXCEL IMPORT/EXPORT ROUTES
// ===============================

// Xuất danh sách countries ra Excel
countryRouter.get(
  "/export/excel",
  authentication,
  //authorize("country_export"),
  exportCountriesExcelController
);

// Nhập countries từ file Excel
countryRouter.post(
  "/import/excel",
  authentication,
  authorize("country_import"),
  // upload.single("file"),
  importCountriesFromExcelController
);

// Tải template Excel cho countries
countryRouter.get(
  "/template/excel",
  authentication,
  //authorize("country_template"),
  downloadCountryTemplateController
);

export default countryRouter;
