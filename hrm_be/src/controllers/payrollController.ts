import { Request, Response } from "express";
import * as payrollService from "../services/payrollService";

// Lấy danh sách bảng lương (có phân trang)
export const getPayrollsController = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const result = await payrollService.getAllPayrolls(page, pageSize);
    res.json(result);
  } catch (err: any) {
    console.error(err);
    res
      .status(500)
      .json({ message: err.message || "Lấy danh sách bảng lương thất bại" });
  }
};

// Lấy bảng lương theo ID
export const getPayrollByIdController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const payroll = await payrollService.getPayrollById(id);
    res.json(payroll);
  } catch (err: any) {
    console.error(err);
    res.status(404).json({ message: err.message });
  }
};

// Tạo bảng lương mới
export const createPayrollController = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const newPayroll = await payrollService.createPayroll(data);
    res.status(201).json(newPayroll);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// Cập nhật bảng lương
export const updatePayrollController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;
    const updatedPayroll = await payrollService.updatePayroll(data, id);
    res.json(updatedPayroll);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// Xóa bảng lương
export const deletePayrollController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await payrollService.deletePayroll(id);
    res.json({ message: "Xóa bảng lương thành công" });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
