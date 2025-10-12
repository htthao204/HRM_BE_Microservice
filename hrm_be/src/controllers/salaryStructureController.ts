import { Request, Response } from "express";
import * as salaryStructureTypeService from "../services/salaryStructureTypeService";

// Lấy danh sách SalaryStructureType (có phân trang)
export const getSalaryStructureTypesController = async (
  req: Request,
  res: Response
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const result = await salaryStructureTypeService.getAllSalaryStructureTypes(
      page,
      pageSize
    );
    res.json(result);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      message: err.message || "Lấy danh sách cấu trúc lương thất bại",
    });
  }
};

// Lấy SalaryStructureType theo ID
export const getSalaryStructureTypeByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = parseInt(req.params.id);
    const item = await salaryStructureTypeService.getSalaryStructureTypeById(
      id
    );
    res.json(item);
  } catch (err: any) {
    console.error(err);
    res.status(404).json({ message: err.message });
  }
};

// Tạo mới SalaryStructureType
export const createSalaryStructureTypeController = async (
  req: Request,
  res: Response
) => {
  try {
    const data = req.body;
    const newItem = await salaryStructureTypeService.createSalaryStructureType(
      data
    );
    res.status(201).json(newItem);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// Cập nhật SalaryStructureType
export const updateSalaryStructureTypeController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;
    const updatedItem =
      await salaryStructureTypeService.updateSalaryStructureType(id, data);
    res.json(updatedItem);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// Xóa SalaryStructureType
export const deleteSalaryStructureTypeController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = parseInt(req.params.id);
    await salaryStructureTypeService.deleteSalaryStructureType(id);
    res.json({ message: "Xóa cấu trúc lương thành công" });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
