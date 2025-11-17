import Role from "../models/roleModel";
import { Model } from "sequelize";
import Permission from "../models/permissionModel";

interface PaginatedResult<T> {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  data: T[];
}

// Lấy danh sách Role có phân trang
export const getAllRoles = async (
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResult<Model>> => {
  try {
    const offset = (page - 1) * pageSize;

    const { count, rows } = await Role.findAndCountAll({
      limit: pageSize,
      offset,
      order: [["created_at", "DESC"]],
      include: [
        {
          model: Permission,
          as: "permissions",
          through: { attributes: [] }, // Ẩn bảng trung gian trong kết quả
        },
      ],
    });

    return {
      totalItems: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: page,
      data: rows,
    };
  } catch (error: any) {
    console.error(error);
    throw new Error("Lấy danh sách vai trò thất bại");
  }
};

// Tạo Role mới
export const createRole = async (roleData: {
  name: string;
  description?: string;
  permissionIds?: number[];
}) => {
  try {
    const { permissionIds, ...roleAttributes } = roleData;

    const newRole = await Role.create(roleAttributes);

    // Nếu có permissionIds, thêm các permission vào role
    if (permissionIds && permissionIds.length > 0) {
      await (newRole as any).setPermissions(permissionIds);
    }

    // Lấy lại role với đầy đủ thông tin permissions
    const roleWithPermissions = await Role.findByPk(newRole.id, {
      include: [
        {
          model: Permission,
          as: "permissions",
          through: { attributes: [] },
        },
      ],
    });

    return roleWithPermissions?.get({ plain: true });
  } catch (error: any) {
    console.error(error);
    throw new Error("Tạo vai trò thất bại");
  }
};

// Cập nhật Role
export const updateRole = async (
  roleData: {
    name?: string;
    description?: string;
    permissionIds?: number[];
  },
  id: number
) => {
  try {
    const { permissionIds, ...roleAttributes } = roleData;

    const [affectedCount] = await Role.update(roleAttributes, {
      where: { id },
    });

    // Nếu có permissionIds, cập nhật các permission của role
    if (permissionIds) {
      const role = await Role.findByPk(id);
      if (role) {
        await (role as any).setPermissions(permissionIds);
      }
    }

    return affectedCount;
  } catch (err) {
    console.error(err);
    throw new Error("Cập nhật vai trò thất bại");
  }
};

// Xóa Role
export const deleteRole = async (id: number) => {
  try {
    const deletedCount = await Role.destroy({ where: { id } });
    return deletedCount;
  } catch (err) {
    console.error(err);
    throw new Error("Xóa vai trò thất bại");
  }
};

// Lấy Role theo ID
export const getRoleById = async (id: number) => {
  try {
    const role = await Role.findByPk(id, {
      include: [
        {
          model: Permission,
          as: "permissions",
          through: { attributes: [] },
        },
      ],
    });

    if (!role) {
      throw new Error("Vai trò không tồn tại");
    }

    return role;
  } catch (err) {
    console.error(err);
    throw new Error("Lấy vai trò thất bại");
  }
};

// Lấy tất cả roles không phân trang (cho dropdown, filter, etc.)
export const getAllRolesSimple = async () => {
  try {
    const roles = await Role.findAll({
      attributes: ["id", "name", "description"],
      order: [["name", "ASC"]],
    });

    return roles;
  } catch (error: any) {
    console.error(error);
    throw new Error("Lấy danh sách vai trò thất bại");
  }
};

// Kiểm tra role có tồn tại không
export const checkRoleExists = async (
  name: string,
  excludeId?: number
): Promise<boolean> => {
  try {
    const whereCondition: any = { name };
    if (excludeId) {
      whereCondition.id = { [Symbol.for("ne")]: excludeId };
    }

    const count = await Role.count({ where: whereCondition });
    return count > 0;
  } catch (error: any) {
    console.error(error);
    throw new Error("Kiểm tra vai trò thất bại");
  }
};
