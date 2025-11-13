// services/countryService.ts
import { Op } from "sequelize";
import ExcelJS from "exceljs";

import sequelize from "../config/db";
import Country from "../models/countryModel";

interface CountryAttributes {
  id: number;
  name: string;
  country_code?: string | null;
}

interface CountryCreationAttributes {
  name: string;
  country_code?: string | null;
}

interface ImportResult {
  total: number;
  success: number;
  errors: string[];
  duplicates: number;
  updated: number;
}

interface FilterOptions {
  search?: string;
  countryCode?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Lấy danh sách quốc gia với phân trang và filter
 */
export const getCountriesByFilter = async (
  page: number = 1,
  pageSize: number = 10,
  filter: FilterOptions = {}
) => {
  try {
    const offset = (page - 1) * pageSize;
    const where: any = {};

    // Filter theo tên hoặc mã quốc gia
    if (filter.search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${filter.search}%` } },
        { country_code: { [Op.iLike]: `%${filter.search}%` } },
      ];
    }

    // Filter theo mã quốc gia
    if (filter.countryCode) {
      where.country_code = { [Op.iLike]: `%${filter.countryCode}%` };
    }

    const { count, rows } = await Country.findAndCountAll({
      where,
      limit: pageSize,
      offset,
      order: [["name", "ASC"]],
      distinct: true,
    });

    return {
      totalItems: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: page,
      pageSize,
      data: rows.map((country) => country.get({ plain: true })),
    };
  } catch (error) {
    console.error("Error getting countries:", error);
    throw new Error("Không thể lấy danh sách quốc gia");
  }
};

/**
 * Lấy tất cả quốc gia (không phân trang)
 */
export const getAllCountries = async () => {
  try {
    const countries = await Country.findAll({
      order: [["name", "ASC"]],
    });
    return countries.map((country) => country.get({ plain: true }));
  } catch (error) {
    console.error("Error getting all countries:", error);
    throw new Error("Không thể lấy danh sách quốc gia");
  }
};

/**
 * Lấy thông tin quốc gia theo ID
 */
export const getCountryById = async (id: number) => {
  try {
    const country = await Country.findByPk(id);
    if (!country) {
      throw new Error("Không tìm thấy quốc gia");
    }
    return country.get({ plain: true });
  } catch (error) {
    console.error("Error getting country by id:", error);
    throw error;
  }
};

/**
 * Tạo quốc gia mới
 */
export const createCountry = async (data: CountryCreationAttributes) => {
  try {
    // Kiểm tra trùng tên quốc gia
    const existingCountry = await Country.findOne({
      where: {
        name: { [Op.iLike]: data.name },
      },
    });

    if (existingCountry) {
      throw new Error("Tên quốc gia đã tồn tại");
    }

    // Kiểm tra trùng mã quốc gia (nếu có)
    if (data.country_code) {
      const existingCode = await Country.findOne({
        where: {
          country_code: { [Op.iLike]: data.country_code },
        },
      });

      if (existingCode) {
        throw new Error("Mã quốc gia đã tồn tại");
      }
    }

    const country = await Country.create(data);
    return country.get({ plain: true });
  } catch (error) {
    console.error("Error creating country:", error);
    throw error;
  }
};

/**
 * Cập nhật thông tin quốc gia
 */
export const updateCountry = async (
  id: number,
  data: Partial<CountryCreationAttributes>
) => {
  try {
    const country = await Country.findByPk(id);
    if (!country) {
      throw new Error("Không tìm thấy quốc gia");
    }

    // Kiểm tra trùng tên quốc gia (trừ bản ghi hiện tại)
    if (data.name) {
      const existingCountry = await Country.findOne({
        where: {
          name: { [Op.iLike]: data.name },
          id: { [Op.ne]: id },
        },
      });

      if (existingCountry) {
        throw new Error("Tên quốc gia đã tồn tại");
      }
    }

    // Kiểm tra trùng mã quốc gia (trừ bản ghi hiện tại)
    if (data.country_code) {
      const existingCode = await Country.findOne({
        where: {
          country_code: { [Op.iLike]: data.country_code },
          id: { [Op.ne]: id },
        },
      });

      if (existingCode) {
        throw new Error("Mã quốc gia đã tồn tại");
      }
    }

    await country.update(data);
    return country.get({ plain: true });
  } catch (error) {
    console.error("Error updating country:", error);
    throw error;
  }
};

/**
 * Xóa quốc gia
 */
export const deleteCountry = async (id: number) => {
  try {
    const country = await Country.findByPk(id);
    if (!country) {
      throw new Error("Không tìm thấy quốc gia");
    }

    await country.destroy();
    return { message: "Xóa quốc gia thành công" };
  } catch (error) {
    console.error("Error deleting country:", error);

    // Kiểm tra xem có lỗi khóa ngoại không
    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new Error(
        "Không thể xóa quốc gia vì đang được sử dụng trong hệ thống"
      );
    }

    throw error;
  }
};

/**
 * Xóa nhiều quốc gia
 */
export const deleteMultipleCountries = async (ids: number[]) => {
  try {
    const result = await Country.destroy({
      where: {
        id: {
          [Op.in]: ids,
        },
      },
    });

    return {
      message: `Đã xóa ${result} quốc gia thành công`,
      deletedCount: result,
    };
  } catch (error) {
    console.error("Error deleting multiple countries:", error);

    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new Error(
        "Không thể xóa một số quốc gia vì đang được sử dụng trong hệ thống"
      );
    }

    throw error;
  }
};

/**
 * Xuất danh sách quốc gia ra Excel
 */
export const exportCountriesToExcel = async (
  filter?: FilterOptions
): Promise<ExcelJS.Workbook> => {
  try {
    console.log("Bắt đầu export quốc gia với filter:", filter);

    const where: any = {};

    if (filter?.search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${filter.search}%` } },
        { country_code: { [Op.iLike]: `%${filter.search}%` } },
      ];
    }

    const countries = await Country.findAll({
      where,
      order: [["name", "ASC"]],
    });

    console.log(`✅ Tìm thấy ${countries.length} quốc gia`);

    // Tạo workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Danh sách quốc gia");

    // Định nghĩa columns
    worksheet.columns = [
      { header: "STT", key: "stt", width: 8 },
      { header: "Tên quốc gia", key: "name", width: 30 },
      { header: "Mã quốc gia", key: "country_code", width: 15 },
      { header: "ID", key: "id", width: 10 },
    ];

    // Style cho header
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "2E86AB" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };

    // Thêm dữ liệu
    countries.forEach((country, index) => {
      const countryData = country.get({ plain: true });
      const row = worksheet.addRow({
        stt: index + 1,
        name: countryData.name,
        country_code: countryData.country_code || "N/A",
        id: countryData.id,
      });

      // Căn giữa cho các ô
      row.eachCell((cell) => {
        cell.alignment = { vertical: "middle", horizontal: "center" };
      });
    });

    // Auto filter
    if (countries.length > 0) {
      worksheet.autoFilter = {
        from: "A1",
        to: `D${countries.length + 1}`,
      };
    }

    console.log("✅ Xuất Excel quốc gia thành công");
    return workbook;
  } catch (error) {
    console.error("❌ Lỗi xuất Excel quốc gia:", error);
    throw new Error(`Không thể xuất file Excel: ${error.message}`);
  }
};

/**
 * Xuất file Excel và trả về buffer
 */
export const exportCountriesToExcelBuffer = async (
  filter?: FilterOptions
): Promise<Buffer> => {
  try {
    console.log("🟢 Bắt đầu exportCountriesToExcelBuffer");
    console.log("Filter nhận được:", filter);

    const workbook = await exportCountriesToExcel(filter);
    const buffer = await workbook.xlsx.writeBuffer();

    console.log("✅ Tạo buffer thành công");
    return Buffer.from(buffer);
  } catch (error) {
    console.error("❌ Lỗi xuất Excel buffer:", error);
    throw new Error(`Không thể tạo file Excel: ${error.message}`);
  }
};

/**
 * Nhập quốc gia từ file Excel
 */
export const importCountriesFromExcel = async (
  fileBuffer: Buffer
): Promise<ImportResult> => {
  const results: ImportResult = {
    total: 0,
    success: 0,
    errors: [] as string[],
    duplicates: 0,
    updated: 0,
  };

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new Error("File Excel không có dữ liệu");
    }

    // Bắt đầu từ dòng 2 (bỏ qua header)
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);

      // Bỏ qua dòng trống
      if (!row.getCell(1).value && !row.getCell(2).value) continue;

      try {
        // Lấy dữ liệu từ các cell theo template
        const name = row.getCell(1).value?.toString().trim();
        const countryCode = row.getCell(2).value?.toString().trim();

        // Validate dữ liệu bắt buộc
        if (!name) {
          results.errors.push(`Dòng ${rowNumber}: Thiếu tên quốc gia`);
          continue;
        }

        // Kiểm tra trùng tên
        const existingByName = await Country.findOne({
          where: { name: { [Op.iLike]: name } },
        });

        // Kiểm tra trùng mã quốc gia (nếu có)
        let existingByCode = null;
        if (countryCode) {
          existingByCode = await Country.findOne({
            where: { country_code: { [Op.iLike]: countryCode } },
          });
        }

        const countryData: any = {
          name,
          country_code: countryCode || null,
        };

        if (existingByName || existingByCode) {
          // Cập nhật nếu đã tồn tại
          const countryToUpdate = existingByName || existingByCode;
          if (countryToUpdate) {
            await countryToUpdate.update(countryData);
            results.updated++;
          }
        } else {
          // Tạo mới
          await Country.create(countryData);
          results.success++;
        }

        results.total++;
      } catch (rowError: any) {
        results.errors.push(`Dòng ${rowNumber}: ${rowError.message}`);
      }
    }

    return results;
  } catch (error: any) {
    console.error("Lỗi nhập Excel quốc gia:", error);
    throw new Error(`Lỗi nhập file: ${error.message}`);
  }
};

/**
 * Tạo template Excel cho quốc gia
 */
export const createCountryTemplate = async (): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Template quốc gia");

  // Header với màu sắc
  worksheet.columns = [
    { header: "Tên quốc gia (*)", key: "name", width: 30 },
    { header: "Mã quốc gia", key: "country_code", width: 15 },
  ];

  // Style header
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "2E86AB" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };

  // Thêm dữ liệu mẫu
  const sampleData = [
    {
      name: "Việt Nam",
      country_code: "VN",
    },
    {
      name: "United States",
      country_code: "US",
    },
    {
      name: "Japan",
      country_code: "JP",
    },
  ];

  sampleData.forEach((data) => {
    const row = worksheet.addRow(data);
    row.eachCell((cell) => {
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });
  });

  // Thêm ghi chú
  worksheet.addRow([]);
  worksheet.addRow(["Ghi chú:"]);
  worksheet.addRow(["(*) : Thông tin bắt buộc"]);
  worksheet.addRow(["Tên quốc gia: Không được trùng lặp"]);
  worksheet.addRow(["Mã quốc gia: Không được trùng lặp (nếu có)"]);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

/**
 * Lấy danh sách quốc gia cho dropdown
 */
export const getCountriesForDropdown = async () => {
  try {
    const countries = await Country.findAll({
      attributes: ["id", "name", "country_code"],
      order: [["name", "ASC"]],
    });

    return countries.map((country) => ({
      value: country.id,
      label: country.name,
      code: country.country_code,
    }));
  } catch (error) {
    console.error("Error getting countries for dropdown:", error);
    throw new Error("Không thể lấy danh sách quốc gia");
  }
};
