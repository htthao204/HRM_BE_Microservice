import { Request, Response, NextFunction } from "express";
import { ResultResponse } from "../dto/response/resultResponse";
import {
  createEmployee,
  updateEmployee,
  getEmployeeById,
  getEmployeeByDepartmentId,
  deleteEmployee,
  getAllEmployeeInfor,
} from "../services/employeeService";

// Lấy danh sách nhân viên có phân trang
export const getAllEmployeeInforController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt((req.query.page as string) || "1");
    const pageSize = parseInt((req.query.pageSize as string) || "10");

    const result = await getAllEmployeeInfor(page, pageSize);

    res.json(
      ResultResponse(true, 200, null, null, result.data, result.totalItems)
    );
  } catch (err: any) {
    next(err);
  }
};

// Tạo nhân viên mới
export const createEmployeeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const newEmployee = req.body;
    if (!newEmployee.fullName || !newEmployee.email) {
      res
        .status(400)
        .json(
          ResultResponse(false, 400, null, "FullName và Email là bắt buộc")
        );
      return;
    }

    const createdEmployee = await createEmployee(newEmployee);
    res
      .status(201)
      .json(
        ResultResponse(
          true,
          201,
          null,
          "Tạo nhân viên thành công",
          createdEmployee
        )
      );
  } catch (err: any) {
    next(err);
  }
};

// Cập nhật nhân viên
export const updateEmployeeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const employeeId = parseInt(req.params.id);
    const updateData = req.body;

    const updatedEmployee = await updateEmployee(employeeId, updateData);
    res
      .status(200)
      .json(
        ResultResponse(
          true,
          200,
          null,
          "Cập nhật nhân viên thành công",
          updatedEmployee
        )
      );
  } catch (err: any) {
    next(err);
  }
};

// Lấy nhân viên theo ID
export const getEmployeeByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const employeeId = parseInt(req.params.id);
    const employee = await getEmployeeById(employeeId);

    res
      .status(200)
      .json(
        ResultResponse(true, 200, null, "Lấy nhân viên thành công", employee)
      );
  } catch (err: any) {
    next(err);
  }
};

// Lấy nhân viên theo phòng ban
export const getEmployeeByDepartmentIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const departmentId = parseInt(req.params.departmentId);
    const employees = await getEmployeeByDepartmentId(departmentId);

    res
      .status(200)
      .json(
        ResultResponse(
          true,
          200,
          null,
          "Lấy nhân viên theo phòng ban thành công",
          employees
        )
      );
  } catch (err: any) {
    next(err);
  }
};

// Xóa nhân viên (cập nhật isDelete = true)
export const deleteEmployeeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const employeeId = parseInt(req.params.id);
    await deleteEmployee(employeeId);

    res
      .status(200)
      .json(ResultResponse(true, 200, null, "Xóa nhân viên thành công"));
  } catch (err: any) {
    next(err);
  }
};
