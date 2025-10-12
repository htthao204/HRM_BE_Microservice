import { Request, Response, NextFunction } from "express";
import {
  createWorkShift,
  deleteWorkShift,
  getAllWorkShifts,
  getWorkShiftById,
  updateWorkShift,
} from "../services/workShiftService";
import { ResultResponse } from "../dto/response/resultResponse";

export const getAllWorkShiftsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt((req.query.page as string) || "1");
    const pageSize = parseInt((req.query.pageSize as string) || "10");

    const result = await getAllWorkShifts(page, pageSize);

    res.json(
      ResultResponse(true, 200, null, null, result.data, result.totalItems)
    );
  } catch (err) {
    next(err);
  }
};

export const createWorkShiftController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const workShiftData = req.body;
    const newWorkShift = await createWorkShift(workShiftData);
    res
      .status(201)
      .json(
        ResultResponse(true, 201, "Tạo ca làm thành công", null, newWorkShift)
      );
  } catch (err: any) {
    next(err);
  }
};

export const updateWorkShiftController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const id = parseInt(req.params.id);
  const workShiftData = req.body;
  const updatedWorkShift = await updateWorkShift(workShiftData, id);
  if (!updatedWorkShift) {
    res.status(404).json(ResultResponse(false, 404, "Ca làm không tồn tại"));
    return;
  }
  res.json(
    ResultResponse(
      true,
      200,
      "Cập nhật ca làm thành công",
      null,
      updatedWorkShift
    )
  );

  try {
  } catch (err: any) {
    next(err);
  }
};

export const deleteWorkShiftController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const deletedCount = await deleteWorkShift(id);
    if (deletedCount === 0) {
      res.status(404).json(ResultResponse(false, 404, "Ca làm không tồn tại"));
      return;
    }
    res.json(ResultResponse(true, 200, "Xóa ca làm thành công"));
  } catch (err: any) {
    next(err);
  }
};

export const getWorkShiftByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const workShift = await getWorkShiftById(id);
    res.json(ResultResponse(true, 200, null, null, workShift));
  } catch (err: any) {
    next(err);
  }
};
