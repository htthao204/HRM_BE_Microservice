// routers/holidayRouter.ts
import { Router } from "express";
import multer from "multer";
import { authentication } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/authorizeMiddleware";
import {
  createHolidayController,
  deleteHolidayController,
  getAllHolidayController,
  getHolidayByIdController,
  getHolidayByPageController,
  getHolidayByYearController,
  searchHolidayController,
  toggleHolidayActiveController,
  updateHolidayController,
  exportHolidaysToExcelController,
  importHolidaysFromExcelController,
  downloadHolidayTemplateController,
  getActiveHolidaysController,
  getHolidaysInRangeController,
} from "../controllers/holidayController";

const holidayRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

// ===============================
// 🔹 BASIC CRUD ROUTES
// ===============================

// Lấy tất cả holidays
holidayRouter.get(
  "/all",
  authentication,
  //authorize("holiday_view_all"),
  getAllHolidayController
);

// ===============================
// 🔹 EXCEL IMPORT/EXPORT ROUTES
// ===============================

// Xuất danh sách holidays ra Excel
holidayRouter.get(
  "/export/excel",
  authentication,
  //authorize("holiday_export"),
  exportHolidaysToExcelController
);

// Nhập holidays từ file Excel
holidayRouter.post(
  "/import/excel",
  authentication,
  //authorize("holiday_import"),
  upload.single("file"),
  importHolidaysFromExcelController
);

// Tải template Excel cho holidays
holidayRouter.get(
  "/template/excel",
  authentication,
  //authorize("holiday_template"),
  downloadHolidayTemplateController
);

// Lấy holidays theo phân trang
holidayRouter.get(
  "/all/page",
  authentication,
  //authorize("holiday_view_all"),
  getHolidayByPageController
);

// Tìm kiếm holidays
holidayRouter.get(
  "/search",
  authentication,
  //authorize("holiday_search"),
  searchHolidayController
);

// Lấy holidays theo năm
holidayRouter.get(
  "/by-year",
  authentication,
  //authorize("holiday_view_by_year"),
  getHolidayByYearController
);

// Lấy holidays active
holidayRouter.get(
  "/active",
  authentication,
  //authorize("holiday_view_active"),
  getActiveHolidaysController
);

// Lấy holidays trong khoảng thời gian
holidayRouter.get(
  "/range",
  authentication,
  //authorize("holiday_view_range"),
  getHolidaysInRangeController
);

// Tạo holiday
holidayRouter.post(
  "/",
  authentication,
  //authorize("holiday_create"),
  createHolidayController
);

// Cập nhật trạng thái holiday
holidayRouter.patch(
  "/:id/status",
  authentication,
  //authorize("holiday_update_status"),
  toggleHolidayActiveController
);

// Cập nhật holiday
holidayRouter.put(
  "/:id",
  authentication,
  //authorize("holiday_update"),
  updateHolidayController
);

// Xoá holiday
holidayRouter.delete(
  "/:id",
  authentication,
  //authorize("holiday_delete"),
  deleteHolidayController
);

// Lấy holiday theo ID
holidayRouter.get(
  "/:id",
  authentication,
  //authorize("holiday_view"),
  getHolidayByIdController
);

export default holidayRouter;
