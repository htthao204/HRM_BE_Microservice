import { Request, Response } from "express";
import {
  createEmployeePositionHistory,
  deleteEmployeePositionHistory,
  getAllEmployeePositionHistory,
  getEmployeePositionHistoryById,
  updateEmployeePositionHistory,
} from "../services/employeePositionHistory";

// Lấy danh sách lịch sử vị trí nhân viên có phân trang
export const getEmployeePositionHistoriesController = async (
  req: Request,
  res: Response
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const result = await getAllEmployeePositionHistory(page, pageSize);
    res.json(result);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      message: err.message || "Lấy danh sách lịch sử vị trí nhân viên thất bại",
    });
  }
};

// Lấy lịch sử vị trí nhân viên theo ID
export const getEmployeePositionHistoryByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = parseInt(req.params.id);
    const record = await getEmployeePositionHistoryById(id);
    res.json(record);
  } catch (err: any) {
    console.error(err);
    res.status(404).json({ message: err.message });
  }
};

// Tạo mới lịch sử vị trí nhân viên
export const createEmployeePositionHistoryController = async (
  req: Request,
  res: Response
) => {
  try {
    const data = req.body;
    const newRecord = await createEmployeePositionHistory(data);
    res.status(201).json(newRecord);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// Cập nhật lịch sử vị trí nhân viên
export const updateEmployeePositionHistoryController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;
    const updatedRecord = await updateEmployeePositionHistory(id, data);
    res.json(updatedRecord);
  } catch (err: any) {
    console.error(err);
    res.status(404).json({ message: err.message });
  }
};

// Xóa lịch sử vị trí nhân viên
export const deleteEmployeePositionHistoryController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = parseInt(req.params.id);
    await deleteEmployeePositionHistory(id);
    res.json({ message: "Xóa lịch sử vị trí nhân viên thành công" });
  } catch (err: any) {
    console.error(err);
    res.status(404).json({ message: err.message });
  }
};
