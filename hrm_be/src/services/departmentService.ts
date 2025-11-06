// services/departmentService.ts - ĐÃ SỬA FIELD NAMES
import { Department } from "../models/departmentModel";
import { EmployeeInformation } from "../models/employeeModel";
import { DepartmentRequest } from "../dto/request/departmentRequest";
import { DepartmentSearchDTO } from "../dto/search/DepartmentSearchDTO";
import { filterDepartments } from "../filter/DepartmentFilter";
import ExcelJS from "exceljs";
import { Op } from "sequelize";

interface PaginatedResult<T> {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  data: T[];
}

// Lấy danh sách phòng ban có phân trang
export const getAllDepartments = async (
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResult<any>> => {
  const offset = (page - 1) * pageSize;

  const { count, rows } = await Department.findAndCountAll({
    limit: pageSize,
    offset,
    order: [["created_at", "DESC"]],
    include: [
      {
        model: EmployeeInformation,
        as: "departmentManager",
        attributes: ["id", "fullName", "email", "employeeCode"],
      },
    ],
  });

  // LẤY SỐ LƯỢNG NHÂN VIÊN CHO TỪNG PHÒNG BAN
  const dataWithEmployeeCount = await Promise.all(
    rows.map(async (row) => {
      const departmentData = row.get({ plain: true });
      const employeeCount = await EmployeeInformation.count({
        where: { department_id: departmentData.id },
      });

      return {
        ...departmentData,
        employeeCount,
      };
    })
  );

  return {
    totalItems: count,
    totalPages: Math.ceil(count / pageSize),
    currentPage: page,
    data: dataWithEmployeeCount,
  };
};

// Tạo phòng ban mới - ĐÃ SỬA FIELD NAMES
export const createDepartment = async (payload: DepartmentRequest) => {
  const createPayload: any = {
    name: payload.name,
    code: payload.code,
    description: payload.description,
    manager_id: payload.managerId,
    parent_id: payload.parentId,
    is_active: payload.isActive,
  };

  const newDept = await Department.create(createPayload);
  return newDept.get({ plain: true });
};

// Cập nhật phòng ban - ĐÃ SỬA FIELD NAMES
export const updateDepartment = async (
  id: number,
  payload: Partial<DepartmentRequest>
) => {
  const updatePayload: any = {};

  if (payload.name !== undefined) updatePayload.name = payload.name;
  if (payload.code !== undefined) updatePayload.code = payload.code;
  if (payload.description !== undefined)
    updatePayload.description = payload.description;
  if (payload.managerId !== undefined)
    updatePayload.manager_id = payload.managerId;
  if (payload.parentId !== undefined)
    updatePayload.parent_id = payload.parentId;
  if (payload.isActive !== undefined)
    updatePayload.is_active = payload.isActive;

  const [affectedRows] = await Department.update(updatePayload, {
    where: { id },
  });

  if (affectedRows === 0) return null;

  const updated = await Department.findByPk(id, {
    include: [
      {
        model: EmployeeInformation,
        as: "departmentManager",
        attributes: ["id", "fullName", "email", "employeeCode"],
      },
    ],
  });

  if (updated) {
    const departmentData = updated.get({ plain: true });
    const employeeCount = await EmployeeInformation.count({
      where: { department_id: id },
    });

    return {
      ...departmentData,
      employeeCount,
    };
  }

  return null;
};

// Xóa phòng ban (soft delete)
export const deleteDepartment = async (id: number): Promise<boolean> => {
  const deletedCount = await Department.destroy({ where: { id } });
  return deletedCount > 0;
};

// Lấy phòng ban theo ID
export const getDepartmentById = async (id: number) => {
  const dept = await Department.findByPk(id, {
    include: [
      {
        model: EmployeeInformation,
        as: "departmentManager",
        attributes: ["id", "fullName", "email", "employeeCode"],
      },
    ],
  });

  if (dept) {
    const departmentData = dept.get({ plain: true });
    // Lấy số lượng nhân viên
    const employeeCount = await EmployeeInformation.count({
      where: { department_id: id },
    });

    return {
      ...departmentData,
      employeeCount,
    };
  }

  return null;
};

// Lấy phòng ban theo managerId - ĐÃ SỬA FIELD NAME
export const getDepartmentsByManagerId = async (managerId: number) => {
  const depts = await Department.findAll({
    where: { manager_id: managerId },
    order: [["created_at", "DESC"]],
  });
  return depts.map((dept) => dept.get({ plain: true }));
};

// Lấy phòng ban theo filter + phân trang
export const getAllDepartmentsFilter = async (
  page: number = 1,
  pageSize: number = 10,
  dto?: DepartmentSearchDTO
): Promise<PaginatedResult<any>> => {
  const offset = (page - 1) * pageSize;

  if (dto) {
    const result = await filterDepartments(dto, page, pageSize);
    return {
      totalItems: result.count,
      totalPages: Math.ceil(result.count / pageSize),
      currentPage: page,
      data: result.rows.map((row) => row.get({ plain: true })),
    };
  } else {
    const result = await Department.findAndCountAll({
      limit: pageSize,
      offset,
      order: [["created_at", "DESC"]],
      include: [
        {
          model: EmployeeInformation,
          as: "departmentManager",
          attributes: ["id", "fullName", "email"],
        },
      ],
    });
    return {
      totalItems: result.count,
      totalPages: Math.ceil(result.count / pageSize),
      currentPage: page,
      data: result.rows.map((row) => row.get({ plain: true })),
    };
  }
};

// Lấy tất cả phòng ban (không phân trang) - THÊM MỚI
export const getAllDepartmentsSimple = async () => {
  const depts = await Department.findAll({
    where: { is_active: true },
    order: [["name", "ASC"]],
    attributes: ["id", "name", "code"],
  });
  return depts.map((dept) => dept.get({ plain: true }));
};

// Kiểm tra mã phòng ban đã tồn tại chưa - THÊM MỚI
export const isDepartmentCodeExists = async (
  code: string,
  excludeId?: number
): Promise<boolean> => {
  const whereCondition: any = { code };
  if (excludeId) {
    whereCondition.id = { [Op.ne]: excludeId };
  }

  const count = await Department.count({ where: whereCondition });
  return count > 0;
};

// Kiểm tra phòng ban có nhân viên không - THÊM MỚI
export const hasEmployees = async (departmentId: number): Promise<boolean> => {
  const count = await EmployeeInformation.count({
    where: { department_id: departmentId },
  });
  return count > 0;
};

// Lấy danh sách phòng ban con - THÊM MỚI
export const getChildDepartments = async (parentId: number) => {
  const depts = await Department.findAll({
    where: { parent_id: parentId, is_active: true },
    order: [["name", "ASC"]],
  });
  return depts.map((dept) => dept.get({ plain: true }));
};

// Thống kê phòng ban - THÊM MỚI
export const getDepartmentStatistics = async () => {
  const totalDepartments = await Department.count({
    where: { is_active: true },
  });

  const totalEmployees = await EmployeeInformation.count({
    where: { status: "active" },
  });

  const departmentsWithStats = await Department.findAll({
    where: { is_active: true },
    attributes: [
      "id",
      "name",
      "code",
      [
        sequelize.literal(`(
          SELECT COUNT(*) 
          FROM employee_information 
          WHERE employee_information.department_id = Department.id 
          AND employee_information.status = 'active'
        )`),
        "employeeCount",
      ],
    ],
    order: [["name", "ASC"]],
  });

  return {
    totalDepartments,
    totalEmployees,
    departments: departmentsWithStats.map((dept) => dept.get({ plain: true })),
  };
};

// Export danh sách phòng ban ra Excel - THÊM MỚI
export const exportDepartmentsToExcel = async (): Promise<ExcelJS.Buffer> => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Danh sách phòng ban");

  // Add headers
  worksheet.columns = [
    { header: "Mã phòng ban", key: "code", width: 20 },
    { header: "Tên phòng ban", key: "name", width: 30 },
    { header: "Trưởng phòng", key: "manager", width: 25 },
    { header: "Số nhân viên", key: "employeeCount", width: 15 },
    { header: "Mô tả", key: "description", width: 40 },
    { header: "Trạng thái", key: "status", width: 15 },
  ];

  // Get data
  const departments = await Department.findAll({
    include: [
      {
        model: EmployeeInformation,
        as: "departmentManager",
        attributes: ["fullName"],
      },
    ],
  });

  // Add data with employee count
  for (const dept of departments) {
    const departmentData = dept.get({ plain: true });
    const employeeCount = await EmployeeInformation.count({
      where: { department_id: departmentData.id },
    });

    worksheet.addRow({
      code: departmentData.code,
      name: departmentData.name,
      manager: departmentData.departmentManager?.fullName || "Chưa có",
      employeeCount: employeeCount,
      description: departmentData.description || "",
      status: departmentData.is_active ? "Hoạt động" : "Ngừng hoạt động",
    });
  }

  // Style header
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE6E6FA" },
  };

  return await workbook.xlsx.writeBuffer();
};
