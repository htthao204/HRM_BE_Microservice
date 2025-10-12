import { Request, Response } from "express";
import * as salaryTypeService from "../services/salaryTypeService";

// Lấy danh sách SalaryType (có phân trang)
export const getSalaryTypesController = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const result = await salaryTypeService.getAllSalaryTypes(page, pageSize);
    res.json(result);
  } catch (err: any) {
    console.error(err);
    res
      .status(500)
      .json({ message: err.message || "Lấy danh sách loại lương thất bại" });
  }
};

// Lấy SalaryType theo ID
export const getSalaryTypeByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = parseInt(req.params.id);
    const item = await salaryTypeService.getSalaryTypeById(id);
    res.json(item);
  } catch (err: any) {
    console.error(err);
    res.status(404).json({ message: err.message });
  }
};

// Tạo mới SalaryType
export const createSalaryTypeController = async (
  req: Request,
  res: Response
) => {
  try {
    const data = req.body;
    const newItem = await salaryTypeService.createSalaryType(data);
    res.status(201).json(newItem);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// Cập nhật SalaryType
export const updateSalaryTypeController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;
    const updatedItem = await salaryTypeService.updateSalaryType(data, id);
    res.json(updatedItem);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// Xóa SalaryType
export const deleteSalaryTypeController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = parseInt(req.params.id);
    await salaryTypeService.deleteSalaryType(id);
    res.json({ message: "Xóa loại lương thành công" });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
