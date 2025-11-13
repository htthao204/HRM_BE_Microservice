import ExcelJS from "exceljs";
import { Op, Transaction } from "sequelize";
import sequelize from "../config/db";
import WorkShift, {
  WorkShiftAttributes,
  WorkShiftCreationAttributes,
} from "../models/workShiftModel";

export interface PaginatedResult<T> {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  data: T[];
}

export interface ImportResult {
  total: number;
  success: number;
  errors: string[];
  duplicates: number;
  updated: number;
}

export default class WorkShiftService {
  // ===============================
  // 🔹 1. Lấy danh sách WorkShift có phân trang
  // ===============================
  static async getAll(
    page: number = 1,
    pageSize: number = 10,
    filters: {
      isActive?: boolean;
      search?: string;
    } = {}
  ): Promise<PaginatedResult<WorkShiftAttributes>> {
    const offset = (page - 1) * pageSize;
    const where: any = {};

    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.search) {
      where[Op.or] = [
        { code: { [Op.like]: `%${filters.search}%` } },
        { name: { [Op.like]: `%${filters.search}%` } },
      ];
    }

    const { count, rows } = await WorkShift.findAndCountAll({
      where,
      limit: pageSize,
      offset,
      order: [["created_at", "DESC"]],
    });

    const data = rows.map((row) => {
      const plain = row.get({ plain: true });
      plain.totalHours = parseFloat(plain.totalHours as any);
      return plain;
    });

    return {
      totalItems: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: page,
      data,
    };
  }

  // ===============================
  // 🔹 2. Tạo WorkShift mới
  // ===============================
  static async create(
    payload: WorkShiftCreationAttributes
  ): Promise<WorkShiftAttributes> {
    // Validate time format
    this.validateTimeFormat(
      payload.startTime,
      payload.endTime,
      payload.breakStart,
      payload.breakEnd
    );

    const newWorkShift = await WorkShift.create(payload);
    const plain = newWorkShift.get({ plain: true });
    plain.totalHours = parseFloat(plain.totalHours as any);
    return plain;
  }

  // ===============================
  // 🔹 3. Cập nhật WorkShift
  // ===============================
  static async update(
    id: number,
    payload: Partial<WorkShiftAttributes>
  ): Promise<WorkShiftAttributes | null> {
    if (
      payload.startTime ||
      payload.endTime ||
      payload.breakStart ||
      payload.breakEnd
    ) {
      this.validateTimeFormat(
        payload.startTime,
        payload.endTime,
        payload.breakStart,
        payload.breakEnd
      );
    }

    const [affectedRows] = await WorkShift.update(payload, { where: { id } });

    if (affectedRows === 0) return null;

    const updated = await WorkShift.findByPk(id);
    if (!updated) return null;

    const plain = updated.get({ plain: true });
    plain.totalHours = parseFloat(plain.totalHours as any);
    return plain;
  }

  // ===============================
  // 🔹 4. Xóa WorkShift
  // ===============================
  static async delete(id: number): Promise<boolean> {
    const deletedCount = await WorkShift.destroy({ where: { id } });
    return deletedCount > 0;
  }

  // ===============================
  // 🔹 5. Lấy WorkShift theo ID
  // ===============================
  static async getById(id: number): Promise<WorkShiftAttributes | null> {
    const workShift = await WorkShift.findByPk(id);
    if (!workShift) return null;

    const plain = workShift.get({ plain: true });
    plain.totalHours = parseFloat(plain.totalHours as any);
    return plain;
  }

  // ===============================
  // 🔹 6. Xuất danh sách WorkShift ra Excel
  // ===============================
  static async exportWorkShiftsToExcel(filter?: {
    isActive?: boolean;
    search?: string;
  }): Promise<ExcelJS.Workbook> {
    try {
      console.log("Bắt đầu export WorkShift với filter:", filter);

      const where: any = {};
      if (filter?.isActive !== undefined) where.isActive = filter.isActive;
      if (filter?.search) {
        where[Op.or] = [
          { code: { [Op.like]: `%${filter.search}%` } },
          { name: { [Op.like]: `%${filter.search}%` } },
        ];
      }

      const workShifts = await WorkShift.findAll({
        where,
        order: [["created_at", "DESC"]],
      });

      console.log(`✅ Tìm thấy ${workShifts.length} ca làm việc`);

      // 🟪 TẠO WORKBOOK
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Danh sách ca làm việc");

      // Định nghĩa columns
      worksheet.columns = [
        { header: "STT", key: "stt", width: 8 },
        { header: "Mã ca (*)", key: "code", width: 15 },
        { header: "Tên ca (*)", key: "name", width: 25 },
        { header: "Giờ bắt đầu (*)", key: "startTime", width: 15 },
        { header: "Giờ kết thúc (*)", key: "endTime", width: 15 },
        { header: "Giờ nghỉ bắt đầu", key: "breakStart", width: 15 },
        { header: "Giờ nghỉ kết thúc", key: "breakEnd", width: 15 },
        { header: "Tổng giờ (*)", key: "totalHours", width: 12 },
        { header: "Ca đêm", key: "isNightShift", width: 10 },
        { header: "Trạng thái", key: "isActive", width: 12 },
        { header: "Mô tả", key: "description", width: 30 },
        { header: "Ngày tạo", key: "createdAt", width: 15 },
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

      // 🟪 THÊM DỮ LIỆU
      workShifts.forEach((ws, index) => {
        const plain = ws.get({ plain: true });
        const row = worksheet.addRow({
          stt: index + 1,
          code: plain.code,
          name: plain.name,
          startTime: plain.startTime,
          endTime: plain.endTime,
          breakStart: plain.breakStart || "Không có",
          breakEnd: plain.breakEnd || "Không có",
          totalHours: parseFloat(plain.totalHours as any),
          isNightShift: plain.isNightShift ? "Có" : "Không",
          isActive: plain.isActive ? "Hoạt động" : "Ngừng",
          description: plain.description || "Không có",
          createdAt: plain.createdAt
            ? new Date(plain.createdAt).toLocaleDateString("vi-VN")
            : "N/A",
        });

        // Căn giữa cho các ô
        row.eachCell((cell) => {
          cell.alignment = { vertical: "middle", horizontal: "center" };
        });
      });

      // Auto filter
      if (workShifts.length > 0) {
        worksheet.autoFilter = {
          from: "A1",
          to: `L${workShifts.length + 1}`,
        };
      }

      console.log("✅ Xuất Excel WorkShift thành công");
      return workbook;
    } catch (error: any) {
      console.error("❌ Lỗi xuất Excel WorkShift:", error);
      throw new Error(`Không thể xuất file Excel: ${error.message}`);
    }
  }

  // ===============================
  // 🔹 7. Xuất file Excel và trả về buffer
  // ===============================
  static async exportWorkShiftsToExcelBuffer(filter?: any): Promise<Buffer> {
    try {
      console.log("🟢 Bắt đầu exportWorkShiftsToExcelBuffer");
      console.log("Filter nhận được:", filter);

      const workbook = await this.exportWorkShiftsToExcel(filter);
      const buffer = await workbook.xlsx.writeBuffer();

      console.log("✅ Tạo buffer thành công");
      return Buffer.from(buffer);
    } catch (error: any) {
      console.error("❌ Lỗi xuất Excel buffer:", error);
      throw new Error(`Không thể tạo file Excel: ${error.message}`);
    }
  }

  // ===============================
  // 🔹 8. Nhập WorkShift từ file Excel
  // ===============================
  static async importWorkShiftsFromExcel(
    fileBuffer: Buffer
  ): Promise<ImportResult> {
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
          // Lấy dữ liệu từ các cell
          const code = row.getCell(1).value?.toString().trim();
          const name = row.getCell(2).value?.toString().trim();
          const startTime = row.getCell(3).value?.toString().trim();
          const endTime = row.getCell(4).value?.toString().trim();
          const breakStart = row.getCell(5).value?.toString().trim();
          const breakEnd = row.getCell(6).value?.toString().trim();
          const totalHoursStr = row.getCell(7).value?.toString().trim();
          const isNightShiftText = row.getCell(8).value?.toString().trim();
          const isActiveText = row.getCell(9).value?.toString().trim();
          const description = row.getCell(10).value?.toString().trim();

          // Validate dữ liệu bắt buộc
          if (!code || !name || !startTime || !endTime || !totalHoursStr) {
            results.errors.push(
              `Dòng ${rowNumber}: Thiếu thông tin bắt buộc (Mã ca, Tên ca, Giờ bắt đầu, Giờ kết thúc, Tổng giờ)`
            );
            continue;
          }

          // Parse total hours
          const totalHours = parseFloat(totalHoursStr);
          if (isNaN(totalHours) || totalHours <= 0) {
            results.errors.push(`Dòng ${rowNumber}: Tổng giờ phải là số dương`);
            continue;
          }

          // Validate time format
          if (!this.isValidTime(startTime) || !this.isValidTime(endTime)) {
            results.errors.push(
              `Dòng ${rowNumber}: Định dạng giờ không hợp lệ (HH:MM)`
            );
            continue;
          }

          if (breakStart && !this.isValidTime(breakStart)) {
            results.errors.push(
              `Dòng ${rowNumber}: Định dạng giờ nghỉ bắt đầu không hợp lệ`
            );
            continue;
          }

          if (breakEnd && !this.isValidTime(breakEnd)) {
            results.errors.push(
              `Dòng ${rowNumber}: Định dạng giờ nghỉ kết thúc không hợp lệ`
            );
            continue;
          }

          // Map boolean values
          const isNightShift = ["có", "yes", "true", "1"].includes(
            isNightShiftText?.toLowerCase() || ""
          );
          const isActive = !["ngừng", "no", "false", "0"].includes(
            isActiveText?.toLowerCase() || ""
          );

          // Kiểm tra trùng lặp theo code
          const existingWorkShift = await WorkShift.findOne({
            where: { code },
          });

          const workShiftData: WorkShiftCreationAttributes = {
            code,
            name,
            startTime,
            endTime,
            breakStart: breakStart || null,
            breakEnd: breakEnd || null,
            totalHours,
            isNightShift,
            isActive,
            description: description || null,
          };

          if (existingWorkShift) {
            // Cập nhật nếu đã tồn tại
            await existingWorkShift.update(workShiftData);
            results.updated++;
          } else {
            // Tạo mới
            await WorkShift.create(workShiftData);
            results.success++;
          }

          results.total++;
        } catch (rowError: any) {
          results.errors.push(`Dòng ${rowNumber}: ${rowError.message}`);
        }
      }

      return results;
    } catch (error: any) {
      console.error("Lỗi nhập Excel WorkShift:", error);
      throw new Error(`Lỗi nhập file: ${error.message}`);
    }
  }

  // ===============================
  // 🔹 9. Tạo template Excel cho WorkShift
  // ===============================
  static async createWorkShiftTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Template ca làm việc");

    // Header với màu sắc
    worksheet.columns = [
      { header: "Mã ca (*)", key: "code", width: 15 },
      { header: "Tên ca (*)", key: "name", width: 25 },
      { header: "Giờ bắt đầu (*)", key: "startTime", width: 15 },
      { header: "Giờ kết thúc (*)", key: "endTime", width: 15 },
      { header: "Giờ nghỉ bắt đầu", key: "breakStart", width: 15 },
      { header: "Giờ nghỉ kết thúc", key: "breakEnd", width: 15 },
      { header: "Tổng giờ (*)", key: "totalHours", width: 12 },
      { header: "Ca đêm", key: "isNightShift", width: 10 },
      { header: "Trạng thái", key: "isActive", width: 12 },
      { header: "Mô tả", key: "description", width: 30 },
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
        code: "CA001",
        name: "Ca hành chính",
        startTime: "08:00",
        endTime: "17:00",
        breakStart: "12:00",
        breakEnd: "13:00",
        totalHours: 8,
        isNightShift: "Không",
        isActive: "Hoạt động",
        description: "Ca làm việc hành chính",
      },
      {
        code: "CA002",
        name: "Ca đêm",
        startTime: "22:00",
        endTime: "06:00",
        breakStart: "02:00",
        breakEnd: "02:30",
        totalHours: 8,
        isNightShift: "Có",
        isActive: "Hoạt động",
        description: "Ca làm việc ban đêm",
      },
    ];

    sampleData.forEach((data) => {
      worksheet.addRow(data);
    });

    // Thêm ghi chú
    worksheet.addRow([]);
    worksheet.addRow(["Ghi chú:"]);
    worksheet.addRow(["(*) : Thông tin bắt buộc"]);
    worksheet.addRow(["Định dạng giờ: HH:MM (24h)"]);
    worksheet.addRow(["Ca đêm: Có / Không"]);
    worksheet.addRow(["Trạng thái: Hoạt động / Ngừng"]);
    worksheet.addRow([
      "Tổng giờ: Số giờ làm việc thực tế (không tính giờ nghỉ)",
    ]);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // ===============================
  // 🔹 10. Hàm hỗ trợ - Validate time format
  // ===============================
  private static isValidTime(timeStr: string): boolean {
    if (!timeStr) return false;
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeStr);
  }

  // ===============================
  // 🔹 11. Hàm hỗ trợ - Validate time format khi tạo/cập nhật
  // ===============================
  private static validateTimeFormat(
    startTime?: string,
    endTime?: string,
    breakStart?: string | null,
    breakEnd?: string | null
  ): void {
    if (startTime && !this.isValidTime(startTime)) {
      throw new Error("Định dạng giờ bắt đầu không hợp lệ");
    }

    if (endTime && !this.isValidTime(endTime)) {
      throw new Error("Định dạng giờ kết thúc không hợp lệ");
    }

    if (breakStart && !this.isValidTime(breakStart)) {
      throw new Error("Định dạng giờ nghỉ bắt đầu không hợp lệ");
    }

    if (breakEnd && !this.isValidTime(breakEnd)) {
      throw new Error("Định dạng giờ nghỉ kết thúc không hợp lệ");
    }

    // Validate break time logic
    if (breakStart && !breakEnd) {
      throw new Error("Phải có cả giờ nghỉ bắt đầu và kết thúc");
    }

    if (!breakStart && breakEnd) {
      throw new Error("Phải có cả giờ nghỉ bắt đầu và kết thúc");
    }
  }
}

// Export các interface và class
export { WorkShiftAttributes, WorkShiftCreationAttributes, WorkShift };
