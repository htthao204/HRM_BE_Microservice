// controllers/holidayController.ts
import { Request, Response, NextFunction } from "express";
import { ResultResponse } from "../dto/response/resultResponse";
import HolidayService from "../services/holidayService";

// Lấy tất cả holidays
export const getAllHolidayController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const holidays = await HolidayService.getAll();
    res.json(ResultResponse(true, 200, null, null, holidays, holidays.length));
  } catch (err: any) {
    next(err);
  }
};

// Lấy holiday theo ID
export const getHolidayByIdController = async (
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

    const holiday = await HolidayService.getById(id);
    if (!holiday) {
      res
        .status(404)
        .json(ResultResponse(false, 404, null, "Holiday không tồn tại"));
      return;
    }

    res.json(ResultResponse(true, 200, null, null, holiday));
  } catch (err: any) {
    next(err);
  }
};

// Lấy holidays theo phân trang
export const getHolidayByPageController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "10", 10);

    const { rows, count } = await HolidayService.getByPage(page, limit);
    res.json(ResultResponse(true, 200, null, null, rows, count));
  } catch (err: any) {
    next(err);
  }
};

// Tìm kiếm holidays
export const searchHolidayController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = (req.query.q as string) || "";

    const yearStr = req.query.year as string | undefined;
    const year =
      yearStr && yearStr.trim() !== "" ? parseInt(yearStr, 10) : undefined;

    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "10", 10);

    const { rows, count } = await HolidayService.search(
      query,
      year,
      page,
      limit
    );
    res.json(ResultResponse(true, 200, null, null, rows, count));
  } catch (err: any) {
    next(err);
  }
};

// Tạo holiday mới
export const createHolidayController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, holidayDate, year, isRecurring, description } = req.body;
    if (!name || !holidayDate || !year) {
      res
        .status(400)
        .json(ResultResponse(false, 400, null, "Tên, ngày và năm là bắt buộc"));
      return;
    }

    const newHoliday = await HolidayService.create({
      name,
      holidayDate,
      year,
      isRecurring,
      description,
    });
    res
      .status(201)
      .json(
        ResultResponse(true, 201, null, "Tạo holiday thành công", newHoliday)
      );
  } catch (err: any) {
    next(err);
  }
};

// Cập nhật holiday
export const updateHolidayController = async (
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

    const { name, holidayDate, year, isRecurring, description } = req.body;
    if (!name || !holidayDate || !year) {
      res
        .status(400)
        .json(ResultResponse(false, 400, null, "Tên, ngày và năm là bắt buộc"));
      return;
    }

    const updatedHoliday = await HolidayService.update(id, {
      name,
      holidayDate,
      year,
      isRecurring,
      description,
    });
    if (!updatedHoliday) {
      res
        .status(404)
        .json(ResultResponse(false, 404, null, "Holiday không tồn tại"));
      return;
    }

    res.json(
      ResultResponse(
        true,
        200,
        null,
        "Cập nhật holiday thành công",
        updatedHoliday
      )
    );
  } catch (err: any) {
    next(err);
  }
};

// Xóa holiday
export const deleteHolidayController = async (
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

    const deleted = await HolidayService.delete(id);
    if (!deleted) {
      res
        .status(404)
        .json(ResultResponse(false, 404, null, "Holiday không tồn tại"));
      return;
    }

    res.json(ResultResponse(true, 200, null, "Xóa holiday thành công"));
  } catch (err: any) {
    next(err);
  }
};

// Lấy ngày lễ theo năm
export const getHolidayByYearController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const yearStr = req.query.year as string | undefined;
    const year = yearStr ? parseInt(yearStr, 10) : NaN;

    if (isNaN(year)) {
      res.status(400).json(ResultResponse(false, 400, "Year không hợp lệ"));
      return;
    }

    const holidays = await HolidayService.getByYear(year);
    res.json(ResultResponse(true, 200, null, null, holidays, holidays.length));
  } catch (err: any) {
    next(err);
  }
};

// Cập nhật trạng thái active/inactive
export const toggleHolidayActiveController = async (
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

    const { isActive } = req.body;
    if (typeof isActive !== "boolean") {
      res
        .status(400)
        .json(ResultResponse(false, 400, null, "isActive phải là boolean"));
      return;
    }

    const updatedHoliday = await HolidayService.updateStatus(id, isActive);
    if (!updatedHoliday) {
      res
        .status(404)
        .json(ResultResponse(false, 404, null, "Holiday không tồn tại"));
      return;
    }

    res.json(
      ResultResponse(
        true,
        200,
        null,
        "Cập nhật trạng thái thành công",
        updatedHoliday
      )
    );
  } catch (err: any) {
    next(err);
  }
};

// ===============================
// 🔹 EXPORT HOLIDAYS TO EXCEL
// ===============================
export const exportHolidaysToExcelController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { year, isActive } = req.query;

    const filter: any = {};
    if (year && !isNaN(Number(year))) {
      filter.year = Number(year);
    }
    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    console.log("Export holidays filter:", filter);

    const buffer = await HolidayService.exportHolidaysToExcelBuffer(filter);

    // Set headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="danh-sach-ngay-le-${
        new Date().toISOString().split("T")[0]
      }.xlsx"`
    );
    res.setHeader("Content-Length", buffer.length);

    res.send(buffer);
  } catch (error: any) {
    console.error("❌ Lỗi export holidays Excel:", error);
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
// 🔹 IMPORT HOLIDAYS FROM EXCEL
// ===============================
export const importHolidaysFromExcelController = async (
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
    const results = await HolidayService.importHolidaysFromExcel(fileBuffer);

    res.json(
      ResultResponse(
        true,
        200,
        null,
        `Import thành công: ${results.success} bản ghi, Cập nhật: ${results.updated} bản ghi, Lỗi: ${results.errors.length}`,
        results
      )
    );
  } catch (error: any) {
    console.error("❌ Lỗi import holidays Excel:", error);
    res
      .status(500)
      .json(
        ResultResponse(
          false,
          500,
          null,
          `Lỗi import file Excel: ${error.message}`
        )
      );
  }
};

// ===============================
// 🔹 DOWNLOAD HOLIDAY TEMPLATE
// ===============================
export const downloadHolidayTemplateController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const buffer = await HolidayService.createHolidayTemplate();

    // Set headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=template-ngay-le.xlsx"
    );
    res.setHeader("Content-Length", buffer.length);

    res.send(buffer);
  } catch (error: any) {
    console.error("❌ Lỗi download template:", error);
    res
      .status(500)
      .json(
        ResultResponse(false, 500, null, `Lỗi tạo template: ${error.message}`)
      );
  }
};

// ===============================
// 🔹 GET ACTIVE HOLIDAYS
// ===============================
export const getActiveHolidaysController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const yearStr = req.query.year as string | undefined;
    const year = yearStr ? parseInt(yearStr, 10) : undefined;

    const holidays = await HolidayService.getActiveHolidays(year);
    res.json(ResultResponse(true, 200, null, null, holidays, holidays.length));
  } catch (err: any) {
    next(err);
  }
};

// ===============================
// 🔹 GET HOLIDAYS IN RANGE
// ===============================
export const getHolidaysInRangeController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      res
        .status(400)
        .json(
          ResultResponse(false, 400, null, "startDate và endDate là bắt buộc")
        );
      return;
    }

    const holidays = await HolidayService.getHolidaysInRange(
      startDate as string,
      endDate as string
    );
    res.json(ResultResponse(true, 200, null, null, holidays, holidays.length));
  } catch (err: any) {
    next(err);
  }
};
