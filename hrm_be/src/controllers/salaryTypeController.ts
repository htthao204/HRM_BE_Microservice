// src/controllers/salaryTypeController.ts
import { Request, Response } from "express";
import SalaryTypeService, {
  SalaryTypeCreatePayload,
} from "../services/salaryTypeService";

class SalaryTypeController {
  // ===============================
  // LẤY DANH SÁCH + TÌM KIẾM + LỌC
  // ===============================
  static async getAll(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.pageSize as string) || 10;
      const search = (req.query.search as string) || undefined;
      const category = (req.query.category as string) || undefined;
      const is_active =
        req.query.is_active === "true"
          ? true
          : req.query.is_active === "false"
          ? false
          : undefined;

      const result = await SalaryTypeService.search(
        search,
        category,
        is_active,
        page,
        limit
      );

      res.json({
        success: true,
        data: result.rows,
        pagination: {
          totalItems: result.count,
          totalPages: result.totalPages,
          currentPage: result.currentPage,
          pageSize: result.pageSize,
        },
      });
    } catch (error: any) {
      console.error("getAll SalaryType error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Lấy danh sách loại lương thất bại",
      });
    }
  }

  // ===============================
  // LẤY THEO ID
  // ===============================
  static async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res
          .status(400)
          .json({ success: false, message: "ID không hợp lệ" });
      }

      const item = await SalaryTypeService.getById(id);
      if (!item) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy loại lương" });
      }

      res.json({ success: true, data: item });
    } catch (error: any) {
      console.error("getById SalaryType error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Lấy thông tin thất bại",
      });
    }
  }

  // ===============================
  // TẠO MỚI
  // ===============================
  static async create(req: Request, res: Response) {
    try {
      const payload: SalaryTypeCreatePayload = req.body;

      // Validate required fields
      if (!payload.name || !payload.code || !payload.category) {
        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin bắt buộc: tên, mã, nhóm",
        });
      }

      // Kiểm tra code trùng
      const codeExists = await SalaryTypeService.checkDuplicateCode(
        payload.code
      );
      if (codeExists) {
        return res.status(400).json({
          success: false,
          message: "Mã loại lương đã tồn tại!",
        });
      }

      const newItem = await SalaryTypeService.create(payload);

      res.status(201).json({
        success: true,
        message: "Tạo loại lương thành công!",
        data: newItem,
      });
    } catch (error: any) {
      console.error("create SalaryType error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Tạo loại lương thất bại",
      });
    }
  }

  // ===============================
  // CẬP NHẬT
  // ===============================
  static async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res
          .status(400)
          .json({ success: false, message: "ID không hợp lệ" });
      }

      const payload = req.body;

      // Kiểm tra tồn tại
      const exists = await SalaryTypeService.getById(id);
      if (!exists) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy loại lương" });
      }

      // Nếu có thay đổi code → kiểm tra trùng
      if (payload.code && payload.code !== exists.code) {
        const codeExists = await SalaryTypeService.checkDuplicateCode(
          payload.code,
          id
        );
        if (codeExists) {
          return res.status(400).json({
            success: false,
            message: "Mã loại lương đã được sử dụng!",
          });
        }
      }

      const updatedItem = await SalaryTypeService.update(id, payload);

      res.json({
        success: true,
        message: "Cập nhật thành công!",
        data: updatedItem,
      });
    } catch (error: any) {
      console.error("update SalaryType error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Cập nhật thất bại",
      });
    }
  }

  // ===============================
  // TOGGLE TRẠNG THÁI
  // ===============================
  static async toggleStatus(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res
          .status(400)
          .json({ success: false, message: "ID không hợp lệ" });
      }

      const item = await SalaryTypeService.getById(id);
      if (!item) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy loại lương" });
      }

      const updated = await SalaryTypeService.updateStatus(id, !item.is_active);

      res.json({
        success: true,
        message: `Đã ${
          updated?.is_active ? "kích hoạt" : "tạm dừng"
        } loại lương`,
        data: updated,
      });
    } catch (error: any) {
      console.error("toggleStatus error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Cập nhật trạng thái thất bại",
      });
    }
  }

  // ===============================
  // XÓA
  // ===============================
  static async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res
          .status(400)
          .json({ success: false, message: "ID không hợp lệ" });
      }

      const deleted = await SalaryTypeService.delete(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy loại lương để xóa",
        });
      }

      res.json({
        success: true,
        message: "Xóa loại lương thành công!",
      });
    } catch (error: any) {
      console.error("delete SalaryType error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Xóa thất bại",
      });
    }
  }

  // ===============================
  // EXPORT EXCEL
  // ===============================
  static async export(req: Request, res: Response) {
    try {
      const { category, is_active } = req.query;
      const filter: any = {};
      if (category) filter.category = category;
      if (is_active !== undefined) filter.is_active = is_active === "true";

      const buffer = await SalaryTypeService.exportToBuffer(filter);

      res.set({
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=salary_types_${new Date()
          .toISOString()
          .slice(0, 10)}.xlsx`,
      });

      res.send(buffer);
    } catch (error: any) {
      console.error("export SalaryType error:", error);
      res.status(500).json({
        success: false,
        message: "Xuất file Excel thất bại: " + error.message,
      });
    }
  }

  // ===============================
  // IMPORT EXCEL
  // ===============================
  static async import(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "Vui lòng upload file Excel" });
      }

      const result = await SalaryTypeService.importFromExcel(req.file.buffer);

      res.json({
        success: true,
        message: `Import thành công! Tổng: ${result.total} | Thêm: ${result.success} | Cập nhật: ${result.updated}`,
        data: result,
      });
    } catch (error: any) {
      console.error("import SalaryType error:", error);
      res.status(500).json({
        success: false,
        message: "Import thất bại: " + error.message,
      });
    }
  }

  // ===============================
  // TẢI TEMPLATE
  // ===============================
  static async downloadTemplate(req: Request, res: Response) {
    try {
      const buffer = await SalaryTypeService.createTemplate();

      res.set({
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          "attachment; filename=template_salary_types.xlsx",
      });

      res.send(buffer);
    } catch (error: any) {
      console.error("downloadTemplate error:", error);
      res.status(500).json({
        success: false,
        message: "Tạo template thất bại",
      });
    }
  }

  // ===============================
  // DROPDOWN ACTIVE ONLY
  // ===============================
  static async getForDropdown(req: Request, res: Response) {
    try {
      const items = await SalaryTypeService.getActiveForDropdown();
      res.json({
        success: true,
        data: items.map((i: any) => ({
          value: i.id,
          label: `${i.name} (${i.code})`,
          category: i.category,
        })),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Lấy danh sách dropdown thất bại",
      });
    }
  }
}

export default SalaryTypeController;
