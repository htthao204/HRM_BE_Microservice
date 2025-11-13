// src/controllers/TaxCalculationController.ts
import { Request, Response } from "express";
import TaxCalculationService, {
  TaxConfigCreatePayload,
  TaxBracketCreatePayload,
  TaxPreviewInput,
} from "../services/TaxCalculationService";

class TaxCalculationController {
  // ===============================
  // CẤU HÌNH THUẾ (Giảm trừ gia cảnh)
  // ===============================
  static async getAllConfigs(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.pageSize as string) || 10;
      const search = (req.query.search as string) || undefined;
      const is_active =
        req.query.is_active === "true"
          ? true
          : req.query.is_active === "false"
          ? false
          : undefined;

      const result = await TaxCalculationService.searchConfigs(
        search,
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
      console.error("getAllConfigs error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Lấy danh sách cấu hình thuế thất bại",
      });
    }
  }

  static async getConfigById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res
          .status(400)
          .json({ success: false, message: "ID không hợp lệ" });
      }

      const config = await TaxCalculationService.getConfigById(id);
      if (!config) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy cấu hình thuế" });
      }

      res.json({ success: true, data: config });
    } catch (error: any) {
      console.error("getConfigById error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Lấy thông tin thất bại",
      });
    }
  }

  static async createConfig(req: Request, res: Response) {
    try {
      const payload: TaxConfigCreatePayload = req.body;

      if (
        !payload.effective_date ||
        !payload.personal_deduction ||
        !payload.dependent_deduction
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Thiếu thông tin bắt buộc: ngày hiệu lực, giảm trừ bản thân, người phụ thuộc",
        });
      }

      const newConfig = await TaxCalculationService.createConfig(payload);

      res.status(201).json({
        success: true,
        message: "Tạo cấu hình thuế thành công!",
        data: newConfig,
      });
    } catch (error: any) {
      console.error("createConfig error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Tạo cấu hình thuế thất bại",
      });
    }
  }

  static async updateConfig(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res
          .status(400)
          .json({ success: false, message: "ID không hợp lệ" });
      }

      const payload = req.body;
      const exists = await TaxCalculationService.getConfigById(id);
      if (!exists) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy cấu hình thuế" });
      }

      const updated = await TaxCalculationService.updateConfig(id, payload);

      res.json({
        success: true,
        message: "Cập nhật cấu hình thuế thành công!",
        data: updated,
      });
    } catch (error: any) {
      console.error("updateConfig error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Cập nhật thất bại",
      });
    }
  }

  static async deleteConfig(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res
          .status(400)
          .json({ success: false, message: "ID không hợp lệ" });
      }

      const deleted = await TaxCalculationService.deleteConfig(id);
      if (!deleted) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy cấu hình để xóa" });
      }

      res.json({ success: true, message: "Xóa cấu hình thuế thành công!" });
    } catch (error: any) {
      console.error("deleteConfig error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Xóa thất bại",
      });
    }
  }

  // ===============================
  // BẢNG THUẾ LŨY TIẾN
  // ===============================
  static async getBrackets(req: Request, res: Response) {
    try {
      const year = req.query.year
        ? parseInt(req.query.year as string)
        : undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.pageSize as string) || 50;

      const result = await TaxCalculationService.searchBrackets(
        year,
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
      console.error("getBrackets error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Lấy bảng thuế thất bại",
      });
    }
  }

  static async createBracket(req: Request, res: Response) {
    try {
      const payload: TaxBracketCreatePayload = req.body;

      if (!payload.min_amount || !payload.tax_rate || !payload.effective_year) {
        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin bắt buộc",
        });
      }

      const newBracket = await TaxCalculationService.createBracket(payload);

      res.status(201).json({
        success: true,
        message: "Tạo bậc thuế thành công!",
        data: newBracket,
      });
    } catch (error: any) {
      console.error("createBracket error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Tạo bậc thuế thất bại",
      });
    }
  }

  static async updateBracket(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res
          .status(400)
          .json({ success: false, message: "ID không hợp lệ" });
      }

      const payload = req.body;
      const exists = await TaxCalculationService.getConfigById(id);
      if (!exists) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy bậc thuế" });
      }

      const updated = await TaxCalculationService.updateBracket(id, payload);

      res.json({
        success: true,
        message: "Cập nhật bậc thuế thành công!",
        data: updated,
      });
    } catch (error: any) {
      console.error("updateBracket error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Cập nhật thất bại",
      });
    }
  }

  static async deleteBracket(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res
          .status(400)
          .json({ success: false, message: "ID không hợp lệ" });
      }

      const deleted = await TaxCalculationService.deleteBracket(id);
      if (!deleted) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy bậc thuế để xóa" });
      }

      res.json({ success: true, message: "Xóa bậc thuế thành công!" });
    } catch (error: any) {
      console.error("deleteBracket error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Xóa thất bại",
      });
    }
  }

  // ===============================
  // PREVIEW THUẾ TNCN (SIÊU TIỆN CHO FE)
  // ===============================
  static async previewTax(req: Request, res: Response) {
    try {
      const { grossSalary, insuranceDeduction, dependents = 0 } = req.body;

      if (!grossSalary || insuranceDeduction === undefined) {
        return res.status(400).json({
          success: false,
          message: "Thiếu grossSalary hoặc insuranceDeduction",
        });
      }

      const result = await TaxCalculationService.calculatePIT({
        grossSalary,
        insuranceDeduction,
        dependents,
      });

      res.json({
        success: true,
        message: "Tính thuế thành công",
        data: result,
      });
    } catch (error: any) {
      console.error("previewTax error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Tính thuế thất bại",
      });
    }
  }

  static async quickTax(req: Request, res: Response) {
    try {
      const { gross, insurance, dependents = 0 } = req.query;
      const g = parseFloat(gross as string);
      const i = parseFloat(insurance as string);

      if (isNaN(g) || isNaN(i)) {
        return res
          .status(400)
          .json({ success: false, message: "Dữ liệu không hợp lệ" });
      }

      const tax = TaxCalculationService.quickPIT(g, i, dependents as number);

      res.json({
        success: true,
        data: { taxAmount: tax },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ===============================
  // EXPORT EXCEL (Cấu hình + Bảng thuế)
  // ===============================
  static async exportTaxConfig(req: Request, res: Response) {
    try {
      const buffer = await TaxCalculationService.exportTaxConfigBuffer();

      res.set({
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=cau_hinh_thue_tncn_${new Date()
          .toISOString()
          .slice(0, 10)}.xlsx`,
      });

      res.send(buffer);
    } catch (error: any) {
      console.error("exportTaxConfig error:", error);
      res.status(500).json({
        success: false,
        message: "Xuất file Excel thất bại: " + error.message,
      });
    }
  }

  // ===============================
  // TẢI TEMPLATE
  // ===============================
  static async downloadTemplate(req: Request, res: Response) {
    try {
      const buffer = await TaxCalculationService.createTaxTemplate();

      res.set({
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          "attachment; filename=template_cau_hinh_thue.xlsx",
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
}

export default TaxCalculationController;
