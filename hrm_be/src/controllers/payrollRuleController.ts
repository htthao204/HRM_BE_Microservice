import { Request, Response } from "express";
import PayrollRuleService, {
  PayrollRuleSearchParams,
  PayrollCalculatePayload,
} from "../services/PayrollRuleService";

class PayrollRuleController {
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

      const params: PayrollRuleSearchParams = {
        query: search,
        category,
        is_active,
        page,
        limit,
      };

      const result = await PayrollRuleService.search(params);

      res.json({
        success: true,
        data: result.rows.map((r: any) => ({
          ...r.toJSON(),
          parameters: r.parameters,
        })),
        pagination: {
          totalItems: result.count,
          totalPages: result.totalPages,
          currentPage: result.currentPage,
          pageSize: result.pageSize,
        },
      });
    } catch (error: any) {
      console.error("getAll PayrollRule error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Lấy danh sách quy tắc tính lương thất bại",
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

      const item = await PayrollRuleService.getById(id);
      if (!item) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy quy tắc" });
      }

      res.json({
        success: true,
        data: {
          ...item.toJSON(),
          parameters: item.parameters,
        },
      });
    } catch (error: any) {
      console.error("getById PayrollRule error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Lấy thông tin thất bại",
      });
    }
  }

  // ===============================
  // LẤY CẤU HÌNH LƯƠNG (CHO FE HIỂN THỊ)
  // ===============================
  static async getConfig(req: Request, res: Response) {
    try {
      const config = await PayrollRuleService.getConfig();
      res.json({
        success: true,
        data: config,
      });
    } catch (error: any) {
      console.error("getConfig error:", error);
      res.status(500).json({
        success: false,
        message: "Lấy cấu hình lương thất bại",
      });
    }
  }

  // ===============================
  // TÍNH LƯƠNG PREVIEW (API SIÊU MẠNH)
  // ===============================
  static async calculate(req: Request, res: Response) {
    try {
      const payload: PayrollCalculatePayload = req.body;

      if (!payload.employeeId || !payload.month) {
        return res.status(400).json({
          success: false,
          message: "Thiếu employeeId hoặc month",
        });
      }

      const result = await PayrollRuleService.calculate(payload);

      res.json({
        success: true,
        message: "Tính lương thành công!",
        data: result,
      });
    } catch (error: any) {
      console.error("calculate payroll error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Tính lương thất bại",
      });
    }
  }

  // ===============================
  // TẠO MỚI QUY TẮC
  // ===============================
  static async create(req: Request, res: Response) {
    try {
      const payload = req.body;

      if (!payload.name || !payload.rule_code || !payload.rule_category) {
        return res.status(400).json({
          success: false,
          message: "Thiếu tên, mã hoặc nhóm quy tắc",
        });
      }

      // Kiểm tra trùng mã
      const exists = await PayrollRuleService.getAll();
      const codeExists = exists.some(
        (r: any) => r.rule_code === payload.rule_code
      );
      if (codeExists) {
        return res.status(400).json({
          success: false,
          message: "Mã quy tắc đã tồn tại!",
        });
      }

      const newRule = await PayrollRuleService.create(payload); // bạn cần thêm method create trong service

      res.status(201).json({
        success: true,
        message: "Tạo quy tắc thành công!",
        data: newRule,
      });
    } catch (error: any) {
      console.error("create PayrollRule error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Tạo quy tắc thất bại",
      });
    }
  }

  // ===============================
  // CẬP NHẬT QUY TẮC
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
      const exists = await PayrollRuleService.getById(id);
      if (!exists) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy quy tắc" });
      }

      if (payload.rule_code && payload.rule_code !== exists.rule_code) {
        const all = await PayrollRuleService.getAll();
        const codeUsed = all.some(
          (r: any) => r.rule_code === payload.rule_code && r.id !== id
        );
        if (codeUsed) {
          return res.status(400).json({
            success: false,
            message: "Mã quy tắc đã được sử dụng!",
          });
        }
      }

      const updated = await PayrollRuleService.update(id, payload); // cần thêm method update

      res.json({
        success: true,
        message: "Cập nhật quy tắc thành công!",
        data: updated,
      });
    } catch (error: any) {
      console.error("update PayrollRule error:", error);
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

      const item = await PayrollRuleService.getById(id);
      if (!item) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy quy tắc" });
      }

      const updated = await PayrollRuleService.updateStatus(
        id,
        !item.is_active
      );

      res.json({
        success: true,
        message: `Đã ${updated?.is_active ? "kích hoạt" : "tạm dừng"} quy tắc`,
        data: updated,
      });
    } catch (error: any) {
      console.error("toggleStatus PayrollRule error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Cập nhật trạng thái thất bại",
      });
    }
  }

  // ===============================
  // XÓA QUY TẮC
  // ===============================
  static async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res
          .status(400)
          .json({ success: false, message: "ID không hợp lệ" });
      }

      const deleted = await PayrollRuleService.delete(id);
      if (!deleted) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy quy tắc để xóa" });
      }

      res.json({
        success: true,
        message: "Xóa quy tắc thành công!",
      });
    } catch (error: any) {
      console.error("delete PayrollRule error:", error);
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
      const buffer = await PayrollRuleService.exportToBuffer();

      res.set({
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=payroll_rules_${new Date()
          .toISOString()
          .slice(0, 10)}.xlsx`,
      });

      res.send(buffer);
    } catch (error: any) {
      console.error("export PayrollRule error:", error);
      res.status(500).json({
        success: false,
        message: "Xuất file Excel thất bại: " + error.message,
      });
    }
  }

  // ===============================
  // DROPDOWN QUY TẮC ACTIVE
  // ===============================
  static async getForDropdown(req: Request, res: Response) {
    try {
      const rules = await PayrollRuleService.getAll();
      const activeRules = rules.filter((r: any) => r.is_active);

      res.json({
        success: true,
        data: activeRules.map((r: any) => ({
          value: r.id,
          label: `${r.name} (${r.rule_code})`,
          category: r.rule_category,
          code: r.rule_code,
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

export default PayrollRuleController;
