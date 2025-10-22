import { DepartmentRequest } from "../dto/request/departmentRequest";
import { DepartmentSearchDTO } from "../dto/search/DepartmentSearchDTO";
import { filterDepartments } from "../filter/DepartmentFilter";
import { EmployeeInformation } from "../models";
import { Department } from "../models/departmentModel";
import { Model } from "sequelize";

interface PaginatedResult<T> {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  data: T[];
}

export const getAllDepartment = async (
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResult<Model>> => {
  try {
    const offset = (page - 1) * pageSize;

    const { count, rows } = await Department.findAndCountAll({
      limit: pageSize,
      offset,
      order: [["created_at", "DESC"]],
      include: [
        {
          model: EmployeeInformation,
          as: "manager",
          attributes: ["id", "fullName", "email"],
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
    throw new Error("Lấy danh sách phòng ban thất bại");
  }
};

export const createDepartment = async (department: DepartmentRequest) => {
  try {
    const newDepartment = await Department.create(department);

    return newDepartment.get({ plain: true });
  } catch (error: any) {
    console.error(error);
    throw new Error("Tạo phòng ban thất bại");
  }
};

export const updateDepartment = async (
  department: DepartmentRequest,
  id: number
) => {
  try {
    const updateData = await Department.update(department, { where: { id } });
    return updateData;
  } catch (err) {
    console.error(err);
    throw new Error("Cập nhật phòng ban thất bại");
  }
};

export const deleteDepartment = async (id: number) => {
  try {
    const deletedCount = await Department.destroy({ where: { id } });
    return deletedCount;
  } catch (err) {
    console.error(err);
    throw new Error("Xóa phòng ban thất bại");
  }
};

export const getDepartmentById = async (id: number) => {
  try {
    const department = await Department.findByPk(id);
    if (!department) {
      throw new Error("Phòng ban không tồn tại");
    }
    return department;
  } catch (err) {
    console.error(err);
    throw new Error("Lấy phòng ban thất bại");
  }
};
export const getDepartmentByManagerId = async (managerId: number) => {
  try {
    const departments = await Department.findAll({
      where: { managerId },
      order: [["created_at", "DESC"]],
    });

    return departments.map((dept) => dept.get({ plain: true }));
  } catch (err: any) {
    console.error(err);
    throw new Error("Lấy phòng ban theo managerId thất bại");
  }
};
export const getAllDepartmentFilter = async (
  page: number = 1,
  pageSize: number = 10,
  dto?: DepartmentSearchDTO
): Promise<PaginatedResult<Model>> => {
  try {
    const offset = (page - 1) * pageSize;

    if (dto) {
      const result = await filterDepartments(dto, page, pageSize);
      return {
        totalItems: result.count,
        totalPages: Math.ceil(result.count / pageSize),
        currentPage: page,
        data: result.rows,
      };
    } else {
      const result = await Department.findAndCountAll({
        limit: pageSize,
        offset,
        order: [["created_at", "DESC"]],
      });
      return {
        totalItems: result.count,
        totalPages: Math.ceil(result.count / pageSize),
        currentPage: page,
        data: result.rows,
      };
    }
  } catch (error: any) {
    console.error(error);
    throw new Error("Lấy danh sách phòng ban thất bại");
  }
};
