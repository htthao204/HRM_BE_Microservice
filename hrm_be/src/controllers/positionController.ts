import { Request, Response, NextFunction } from "express";
import {
  createPosition,
  getAllPositions,
  getPositionById,
  updatePosition,
  deletePosition,
} from "../services/positionService";
import { ResultResponse } from "../dto/response/resultResponse";

// Tạo vị trí mới
export const createPositionController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const newPosition = await createPosition(req.body);
    res
      .status(201)
      .json(
        ResultResponse(true, 201, null, "Tạo vị trí thành công", newPosition)
      );
  } catch (err: any) {
    next(err);
  }
};

// Lấy tất cả vị trí
export const getAllPositionsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const positions = await getAllPositions();
    res.json(
      ResultResponse(true, 200, null, null, positions, positions.length)
    );
  } catch (err: any) {
    next(err);
  }
};

// Lấy vị trí theo ID
export const getPositionByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, "ID không được để trống"));
    }

    const position = await getPositionById(id);
    res.json(ResultResponse(true, 200, null, null, position));
  } catch (err: any) {
    next(err);
  }
};

// Cập nhật vị trí
export const updatePositionController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, "ID không được để trống"));
    }

    const updatedPosition = await updatePosition(id, req.body);
    res.json(
      ResultResponse(
        true,
        200,
        null,
        "Cập nhật vị trí thành công",
        updatedPosition
      )
    );
  } catch (err: any) {
    next(err);
  }
};

// Xóa vị trí
export const deletePositionController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, "ID không được để trống"));
    }

    const deletedCount = await deletePosition(id);
    if (deletedCount === 0) {
      return res
        .status(404)
        .json(ResultResponse(false, 404, "Không tìm thấy vị trí để xóa"));
    }

    res.json(ResultResponse(true, 200, null, "Xóa vị trí thành công", null));
  } catch (err: any) {
    next(err);
  }
};
