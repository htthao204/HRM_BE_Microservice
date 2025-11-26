// controllers/countryController.ts
import { Request, Response, NextFunction } from "express";
import multer from "multer";
import {
  getCountriesByFilter,
  getCountryById,
  createCountry,
  updateCountry,
  deleteCountry,
  deleteMultipleCountries,
  createCountryTemplate,
  importCountriesFromExcel,
  exportCountriesToExcelBuffer,
  getAllCountries,
  getCountriesForDropdown,
} from "../services/countryService";
import { ResultResponse } from "../dto/response/resultResponse";

const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * Lấy danh sách quốc gia với phân trang và filter
 */
export const getCountriesByFilterController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;

    const filter = {
      search: req.query.search ? String(req.query.search).trim() : undefined,
      countryCode: req.query.countryCode
        ? String(req.query.countryCode).trim()
        : undefined,
    };

    const countries = await getCountriesByFilter(page, pageSize, filter);

    return res.status(200).json(
      ResultResponse(
        true,
        200,
        null,
        null,
        countries.data, // data
        countries.totalItems // totalItem
      )
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Lấy tất cả quốc gia (không phân trang - cho dropdown)
 */
export const getAllCountriesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const countries = await getAllCountries();
    res.status(200).json(ResultResponse(true, 200, null, null, countries));
  } catch (err) {
    next(err);
  }
};

/**
 * Lấy danh sách quốc gia cho dropdown
 */
export const getCountriesDropdownController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const countries = await getCountriesForDropdown();
    res.status(200).json(ResultResponse(true, 200, null, null, countries));
  } catch (err) {
    next(err);
  }
};

/**
 * Lấy chi tiết quốc gia theo ID
 */
export const getCountryByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const country = await getCountryById(Number(req.params.id));
    res.status(200).json(ResultResponse(true, 200, null, null, country));
  } catch (err) {
    next(err);
  }
};

/**
 * Tạo quốc gia mới
 */
export const createCountryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, country_code } = req.body;

    // Validation cơ bản
    if (!name || name.trim() === "") {
      return res
        .status(400)
        .json(ResultResponse(false, 400, null, "Tên quốc gia là bắt buộc"));
    }

    const countryData = {
      name: name.trim(),
      country_code: country_code ? country_code.trim() : null,
    };

    const country = await createCountry(countryData);
    res
      .status(201)
      .json(
        ResultResponse(true, 201, null, "Tạo quốc gia thành công", country)
      );
  } catch (err) {
    next(err);
  }
};

/**
 * Cập nhật quốc gia
 */
export const updateCountryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    const { name, country_code } = req.body;

    // Validation cơ bản
    if (!name || name.trim() === "") {
      return res
        .status(400)
        .json(ResultResponse(false, 400, null, "Tên quốc gia là bắt buộc"));
    }

    const updateData = {
      name: name.trim(),
      country_code: country_code ? country_code.trim() : null,
    };

    const country = await updateCountry(id, updateData);
    res
      .status(200)
      .json(
        ResultResponse(true, 200, null, "Cập nhật quốc gia thành công", country)
      );
  } catch (err) {
    next(err);
  }
};

/**
 * Xóa quốc gia
 */
export const deleteCountryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await deleteCountry(Number(req.params.id));
    res
      .status(200)
      .json(ResultResponse(true, 200, null, result.message, result));
  } catch (err) {
    next(err);
  }
};

/**
 * Xóa nhiều quốc gia
 */
export const deleteMultipleCountriesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, null, "Danh sách ID là bắt buộc"));
    }

    const result = await deleteMultipleCountries(ids);
    res
      .status(200)
      .json(ResultResponse(true, 200, null, result.message, result));
  } catch (err) {
    next(err);
  }
};

/**
 * Xuất danh sách quốc gia ra Excel
 */
export const exportCountriesExcelController = async (
  req: Request,
  res: Response
) => {
  try {
    console.log("🟢 Bắt đầu exportCountriesExcelController");

    const { search, countryCode } = req.query;

    const filter: any = {};

    if (search) filter.search = search.toString();
    if (countryCode) filter.countryCode = countryCode.toString();

    console.log("Filter parameters:", filter);

    const buffer = await exportCountriesToExcelBuffer(filter);

    console.log(" Export thành công, gửi file...");

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=danh-sach-quoc-gia.xlsx"
    );
    res.send(buffer);
  } catch (error: any) {
    console.error("❌ Lỗi trong exportCountriesExcelController:", error);

    return res
      .status(500)
      .json(
        ResultResponse(
          false,
          500,
          null,
          "Lỗi khi xuất file Excel",
          process.env.NODE_ENV === "development" ? error.message : undefined
        )
      );
  }
};

/**
 * Nhập quốc gia từ file Excel
 */
export const importCountriesFromExcelController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json(
          ResultResponse(false, 400, null, "Vui lòng chọn file Excel để nhập")
        );
    }

    const results = await importCountriesFromExcel(req.file.buffer);

    let message = `Nhập file thành công: ${results.success} bản ghi mới`;
    if (results.updated > 0) {
      message += `, ${results.updated} bản ghi cập nhật`;
    }
    if (results.errors.length > 0) {
      message += `, ${results.errors.length} lỗi`;
    }

    res.json(ResultResponse(true, 200, null, message, results));
  } catch (err: any) {
    next(err);
  }
};

/**
 * Download template Excel cho quốc gia
 */
export const downloadCountryTemplateController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const buffer = await createCountryTemplate();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=template-quoc-gia.xlsx"
    );

    res.send(buffer);
  } catch (err: any) {
    next(err);
  }
};

/**
 * Middleware upload file
 */
export const uploadFile = upload.single("file");

/**
 * Lấy danh sách quốc gia (tương thích với các query parameter khác nhau)
 */
export const getCountriesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt((req.query.page as string) || "1");
    const pageSize = parseInt((req.query.pageSize as string) || "10");

    const filter = {
      search: req.query.search as string,
      countryCode: req.query.countryCode as string,
    };

    const result = await getCountriesByFilter(page, pageSize, filter);

    res.json(
      ResultResponse(true, 200, null, null, result.data, result.totalItems)
    );
  } catch (err: any) {
    next(err);
  }
};

/**
 * Kiểm tra trùng tên quốc gia
 */
export const checkCountryNameExistsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, excludeId } = req.query;

    if (!name) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, null, "Tên quốc gia là bắt buộc"));
    }

    // Trong service, bạn có thể thêm hàm checkCountryNameExists
    // Ở đây tôi sẽ mô phỏng logic kiểm tra
    const countries = await getAllCountries();
    const exists = countries.some(
      (country) =>
        country.name.toLowerCase() === name.toString().toLowerCase() &&
        (!excludeId || country.id !== Number(excludeId))
    );

    res.json(ResultResponse(true, 200, null, null, { exists }));
  } catch (err) {
    next(err);
  }
};

/**
 * Kiểm tra trùng mã quốc gia
 */
export const checkCountryCodeExistsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code, excludeId } = req.query;

    if (!code) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, null, "Mã quốc gia là bắt buộc"));
    }

    // Trong service, bạn có thể thêm hàm checkCountryCodeExists
    const countries = await getAllCountries();
    const exists = countries.some(
      (country) =>
        country.country_code &&
        country.country_code.toLowerCase() === code.toString().toLowerCase() &&
        (!excludeId || country.id !== Number(excludeId))
    );

    res.json(ResultResponse(true, 200, null, null, { exists }));
  } catch (err) {
    next(err);
  }
};
