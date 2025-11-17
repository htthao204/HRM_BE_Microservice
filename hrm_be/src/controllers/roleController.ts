import { Request, Response, NextFunction } from "express";
import {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
  getAllRolesSimple,
  checkRoleExists,
} from "../services/roleService";
import { ResultResponse } from "../dto/response/resultResponse";

// Tạo role mới
export const createRoleController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description, permissionIds } = req.body;

    // Validate dữ liệu đầu vào
    if (!name || name.trim() === "") {
      return res
        .status(400)
        .json(ResultResponse(false, 400, "Tên vai trò không được để trống"));
    }

    // Kiểm tra role đã tồn tại chưa
    const roleExists = await checkRoleExists(name);
    if (roleExists) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, "Tên vai trò đã tồn tại"));
    }

    const newRole = await createRole({
      name: name.trim(),
      description: description?.trim(),
      permissionIds,
    });

    res
      .status(201)
      .json(ResultResponse(true, 201, null, "Tạo vai trò thành công", newRole));
  } catch (err: any) {
    next(err);
  }
};

// Lấy tất cả roles có phân trang
export const getAllRolesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;

    if (page < 1 || pageSize < 1) {
      return res
        .status(400)
        .json(
          ResultResponse(
            false,
            400,
            "Số trang và kích thước trang phải lớn hơn 0"
          )
        );
    }

    const result = await getAllRoles(page, pageSize);

    res.json(
      ResultResponse(true, 200, null, null, result.data, result.totalItems)
    );
  } catch (err: any) {
    next(err);
  }
};

// Lấy danh sách roles đơn giản (không phân trang)
export const getAllRolesSimpleController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const roles = await getAllRolesSimple();
    res.json(ResultResponse(true, 200, null, null, roles, roles.length));
  } catch (err: any) {
    next(err);
  }
};

// Lấy role theo ID
export const getRoleByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    if (!id || id < 1) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, "ID không hợp lệ"));
    }

    const role = await getRoleById(id);
    res.json(ResultResponse(true, 200, null, null, role));
  } catch (err: any) {
    next(err);
  }
};

// Cập nhật role
export const updateRoleController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    if (!id || id < 1) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, "ID không hợp lệ"));
    }

    const { name, description, permissionIds } = req.body;

    // Validate dữ liệu đầu vào
    if (name && name.trim() === "") {
      return res
        .status(400)
        .json(ResultResponse(false, 400, "Tên vai trò không được để trống"));
    }

    // Kiểm tra role đã tồn tại chưa (trừ role hiện tại)
    if (name) {
      const roleExists = await checkRoleExists(name.trim(), id);
      if (roleExists) {
        return res
          .status(400)
          .json(ResultResponse(false, 400, "Tên vai trò đã tồn tại"));
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim();
    if (permissionIds !== undefined) updateData.permissionIds = permissionIds;

    const affectedCount = await updateRole(updateData, id);

    if (affectedCount === 0) {
      return res
        .status(404)
        .json(ResultResponse(false, 404, "Không tìm thấy vai trò để cập nhật"));
    }

    // Lấy lại thông tin role sau khi cập nhật
    const updatedRole = await getRoleById(id);

    res.json(
      ResultResponse(
        true,
        200,
        null,
        "Cập nhật vai trò thành công",
        updatedRole
      )
    );
  } catch (err: any) {
    next(err);
  }
};

// Xóa role
export const deleteRoleController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    if (!id || id < 1) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, "ID không hợp lệ"));
    }

    const deletedCount = await deleteRole(id);
    if (deletedCount === 0) {
      return res
        .status(404)
        .json(ResultResponse(false, 404, "Không tìm thấy vai trò để xóa"));
    }

    res.json(ResultResponse(true, 200, null, "Xóa vai trò thành công", null));
  } catch (err: any) {
    next(err);
  }
};

// Kiểm tra role tồn tại
export const checkRoleExistsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name } = req.query;
    const excludeId = req.query.excludeId
      ? Number(req.query.excludeId)
      : undefined;

    if (!name || typeof name !== "string") {
      return res
        .status(400)
        .json(ResultResponse(false, 400, "Tên vai trò là bắt buộc"));
    }

    const exists = await checkRoleExists(name, excludeId);

    res.json(ResultResponse(true, 200, null, null, { exists }));
  } catch (err: any) {
    next(err);
  }
};
