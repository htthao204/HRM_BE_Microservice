import { Request, Response, NextFunction } from "express";
import { ResultResponse } from "../dto/response/resultResponse";
import {
  createDepartment,
  deleteDepartment,
  getAllDepartment,
  getAllDepartmentFilter,
  getDepartmentById,
  getDepartmentByManagerId,
  updateDepartment,
} from "../services/departmentService";
import { DepartmentRequest } from "../dto/request/departmentRequest";
import Department from "../models/departmentModel";
import { DepartmentSearchDTO } from "../dto/search/DepartmentSearchDTO";

export const getAllDepartmentController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt((req.query.page as string) || "1");
    const pageSize = parseInt((req.query.pageSize as string) || "10");

    const result = await getAllDepartment(page, pageSize);

    res.json(
      ResultResponse(true, 200, null, null, result.data, result.totalItems)
    );
  } catch (err: any) {
    next(err);
  }
};

export const createDepartmentController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const newDepartment: DepartmentRequest = req.body;

    if (!newDepartment.name) {
      res
        .status(400)
        .json(ResultResponse(false, 400, null, "Tên phòng ban là bắt buộc"));
      return;
    }

    const createdDepartment = await createDepartment(newDepartment);

    res
      .status(201)
      .json(
        ResultResponse(
          true,
          201,
          null,
          "Tạo phòng ban thành công",
          createdDepartment
        )
      );
  } catch (err: any) {
    next(err);
  }
};
export const updateDepartmentController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const departmentId = parseInt(req.params.id);
    const updatedDepartment: DepartmentRequest = req.body;

    if (!updatedDepartment.name) {
      res
        .status(400)
        .json(ResultResponse(false, 400, null, "Tên phòng ban là bắt buộc"));
      return;
    }

    const [affectedRows] = await updateDepartment(
      updatedDepartment,
      departmentId
    );

    if (affectedRows === 0) {
      res
        .status(404)
        .json(ResultResponse(false, 404, null, "Phòng ban không tồn tại"));
      return;
    }

    // Lấy lại phòng ban sau khi update
    const department = await Department.findByPk(departmentId);

    res
      .status(200)
      .json(
        ResultResponse(
          true,
          200,
          null,
          "Cập nhật phòng ban thành công",
          department
        )
      );
  } catch (err: any) {
    next(err);
  }
};

export const deleteDepartmentController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const departmentId = parseInt(req.params.id);
    const deletedCount = await deleteDepartment(departmentId);
    if (deletedCount === 0) {
      res
        .status(404)
        .json(ResultResponse(false, 404, null, "Phòng ban không tồn tại"));
      return;
    }
    res
      .status(200)
      .json(ResultResponse(true, 200, null, "Xóa phòng ban thành công"));
  } catch (err: any) {
    next(err);
  }
};

export const getDepartmentByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const departmentId = parseInt(req.params.id);
    const department = await getDepartmentById(departmentId);
    res
      .status(200)
      .json(
        ResultResponse(true, 200, null, "Lấy phòng ban thành công", department)
      );
  } catch (err: any) {
    next(err);
  }
};
export const getDepartmentByManagerIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const managerId = parseInt(req.params.managerId);
    if (isNaN(managerId)) {
      res
        .status(400)
        .json(ResultResponse(false, 400, null, "Manager ID không hợp lệ"));
      return;
    }

    const departments = await getDepartmentByManagerId(managerId);

    if (departments.length === 0) {
      res
        .status(404)
        .json(ResultResponse(false, 404, null, "Không tìm thấy phòng ban nào"));
      return;
    }

    res
      .status(200)
      .json(
        ResultResponse(true, 200, null, "Lấy phòng ban thành công", departments)
      );
  } catch (err: any) {
    next(err);
  }
};
export const getAllDepartmentFilterController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt((req.query.page as string) || "1");
    const pageSize = parseInt((req.query.pageSize as string) || "10");

    // Lấy các filter từ query
    const searchDTO: DepartmentSearchDTO = {
      name: (req.query.name as string)?.trim(),
      cid: (req.query.cid as string)?.trim(),
      location: (req.query.location as string)?.trim(),
      managerName: (req.query.managerName as string)?.trim(),
      disContinue:
        req.query.disContinue !== undefined && req.query.disContinue !== ""
          ? req.query.disContinue === "true"
          : undefined,
    };

    // Nếu tất cả field trong DTO đều undefined => coi như không filter
    const hasFilter = Object.values(searchDTO).some(
      (v) => v !== undefined && v !== ""
    );

    const result = await getAllDepartmentFilter(
      page,
      pageSize,
      hasFilter ? searchDTO : undefined
    );

    res.json(
      ResultResponse(true, 200, null, null, result.data, result.totalItems)
    );
  } catch (err: any) {
    next(err);
  }
};
