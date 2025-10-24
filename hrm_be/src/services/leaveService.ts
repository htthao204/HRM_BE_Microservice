// services/leaveService.ts
import { EmployeeInformation } from "../models";
import { Leave } from "../models/leaveModel";
import { Op } from "sequelize";
import { LeaveType } from "../models/leaveTypeModel";
import { LeaveSearchDTO } from "../dto/search/LeaveSearchDTO";

// Tạo mới đơn xin nghỉ
export const createLeave = async (leaveData: any) => {
  try {
    const newLeave = await Leave.create(leaveData);
    return newLeave;
  } catch (err: any) {
    console.error(err);
    throw new Error("Tạo đơn xin nghỉ thất bại");
  }
};

// Lấy đơn xin nghỉ theo ID
export const getLeaveById = async (id: number) => {
  try {
    const leave = await Leave.findByPk(id, {
      include: ["employee", "leaveType"],
    });
    if (!leave) {
      throw new Error("Đơn xin nghỉ không tồn tại");
    }
    return leave;
  } catch (err: any) {
    console.error(err);
    throw new Error("Lấy đơn xin nghỉ thất bại");
  }
};

// Lấy tất cả đơn xin nghỉ (không phân trang)
export const getAllLeaves = async () => {
  try {
    const leaves = await Leave.findAll({
      include: ["employee", "leaveType"],
    });
    return leaves;
  } catch (err: any) {
    console.error(err);
    throw new Error("Lấy danh sách đơn xin nghỉ thất bại");
  }
};

// Lấy tất cả đơn xin nghỉ có phân trang + search
export const getLeavesPaginated = async (
  page: number = 1,
  pageSize: number = 10,
  search: string = ""
) => {
  try {
    const offset = (page - 1) * pageSize;
    const whereClause: any = {};

    if (search) {
      // Ví dụ search theo tên nhân viên hoặc lý do nghỉ
      whereClause[Op.or] = [
        { reason: { [Op.iLike]: `%${search}%` } }, // Postgres
        { "$employee.name$": { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { rows, count } = await Leave.findAndCountAll({
      where: whereClause,
      include: ["employee", "leaveType"],
      limit: pageSize,
      offset,
      order: [["createdAt", "DESC"]],
    });

    return { data: rows, totalItems: count };
  } catch (err: any) {
    console.error(err);
    throw new Error("Lấy danh sách đơn xin nghỉ thất bại");
  }
};

// Cập nhật đơn xin nghỉ
export const updateLeave = async (id: number, leaveData: any) => {
  try {
    const [updatedRowsCount, updatedRows] = await Leave.update(leaveData, {
      where: { id },
      returning: true, // Chỉ Postgres hỗ trợ
    });

    if (updatedRowsCount === 0) {
      throw new Error("Đơn xin nghỉ không tồn tại");
    }

    return updatedRows[0]; // trả về record đã update
  } catch (err: any) {
    console.error(err);
    throw new Error("Cập nhật đơn xin nghỉ thất bại");
  }
};

// Xóa đơn xin nghỉ
export const deleteLeave = async (id: number) => {
  try {
    const deletedCount = await Leave.destroy({ where: { id } });
    if (deletedCount === 0) {
      throw new Error("Đơn xin nghỉ không tồn tại");
    }
    return deletedCount;
  } catch (err: any) {
    console.error(err);
    throw new Error("Xóa đơn xin nghỉ thất bại");
  }
};
// Lấy đơn xin nghỉ theo employeeId
export const getLeavesByEmployeeId = async (employeeId: number) => {
  try {
    const leaves = await Leave.findAll({
      where: { employeeId },
      include: ["employee", "leaveType"],
      order: [["createdAt", "DESC"]],
    });
    return leaves;
  } catch (err: any) {
    console.error(err);
    throw new Error("Lấy đơn nghỉ theo nhân viên thất bại");
  }
};

// Lấy đơn xin nghỉ theo leaveTypeId
export const getLeavesByLeaveType = async (leaveTypeId: number) => {
  try {
    const leaves = await Leave.findAll({
      where: { leaveTypeId },
      include: ["employee", "leaveType"],
      order: [["createdAt", "DESC"]],
    });
    return leaves;
  } catch (err: any) {
    console.error(err);
    throw new Error("Lấy đơn nghỉ theo loại nghỉ thất bại");
  }
};

// Lấy đơn nghỉ theo khoảng thời gian (startDate, endDate)
export const getLeavesByDateRange = async (startDate: Date, endDate: Date) => {
  try {
    const leaves = await Leave.findAll({
      where: {
        startDate: { [Op.gte]: startDate },
        endDate: { [Op.lte]: endDate },
      },
      include: ["employee", "leaveType"],
      order: [["startDate", "ASC"]],
    });
    return leaves;
  } catch (err: any) {
    console.error(err);
    throw new Error("Lấy đơn nghỉ theo khoảng thời gian thất bại");
  }
};
export const getLeavesByFilter = async (
  page: number = 1,
  pageSize: number = 10,
  dto?: LeaveSearchDTO
) => {
  try {
    console.log("Page:", page, "PageSize:", pageSize);
    console.log("DTO received:", dto);

    const offset = (page - 1) * pageSize;
    const where: any = {};

    if (dto) {
      if (dto.employeeId) {
        where.employeeId = dto.employeeId;
        console.log("Filter employeeId:", where.employeeId);
      }
      if (dto.status) {
        where.status = dto.status;
        console.log("Filter status:", where.status);
      }

      if (dto.startDateFrom || dto.startDateTo) {
        where.startDate = {};
        if (dto.startDateFrom) {
          where.startDate[Op.gte] = dto.startDateFrom;
          console.log("Filter startDate >= ", dto.startDateFrom);
        }
        if (dto.startDateTo) {
          where.startDate[Op.lte] = dto.startDateTo;
          console.log("Filter startDate <= ", dto.startDateTo);
        }
      }

      if (dto.endDateFrom || dto.endDateTo) {
        where.endDate = {};
        if (dto.endDateFrom) {
          where.endDate[Op.gte] = dto.endDateFrom;
          console.log("Filter endDate >= ", dto.endDateFrom);
        }
        if (dto.endDateTo) {
          where.endDate[Op.lte] = dto.endDateTo;
          console.log("Filter endDate <= ", dto.endDateTo);
        }
      }
    }

    console.log("Where clause:", JSON.stringify(where, null, 2));

    // Filter leaveTypeId trực tiếp trong bảng Leave
    if (dto?.leaveTypeId) {
      where.leaveTypeId = dto.leaveTypeId;
    }

    // Phần include LeaveType không cần where nữa
    const include = [
      {
        model: EmployeeInformation,
        as: "employee",
        where: dto?.employeeName
          ? { name: { [Op.iLike]: `%${dto.employeeName.trim()}%` } }
          : undefined,
        required: !!dto?.employeeName,
      },
      {
        model: LeaveType,
        as: "leaveType",
        required: true,
        // Không có where ở đây
      },
    ];

    console.log("Include clause:", JSON.stringify(include, null, 2));

    const result = await Leave.findAndCountAll({
      where,
      include,
      limit: pageSize,
      offset,
      order: [["startDate", "ASC"]],
    });

    console.log("Query result count:", result.count);
    console.log("Query result rows:", result.rows.length);

    // Chuyển đổi sequelize instance thành plain object và loại bỏ trường snake_case dư thừa
    const cleanedData = result.rows.map((row) => {
      const obj = row.toJSON() as any; // chuyển sequelize instance thành plain object

      // Bây giờ obj có trường employee_id, leave_type_id bạn có thể xóa
      delete obj.employee_id;
      delete obj.leave_type_id;

      if (obj.employee) {
        delete obj.employee.created_at;
        delete obj.employee.updated_at;
        delete obj.employee.deleted_at;
        delete obj.employee.department_id;
        delete obj.employee.position_id;
        delete obj.employee.account_id;
      }

      if (obj.leaveType) {
        delete obj.leaveType.createdAt;
        delete obj.leaveType.updatedAt;
      }

      return obj;
    });

    return {
      totalItems: result.count,
      totalPages: Math.ceil(result.count / pageSize),
      currentPage: page,
      data: cleanedData,
    };
  } catch (err: any) {
    console.error("Error in getLeavesByFilter:", err);
    throw new Error("Lấy đơn nghỉ theo filter thất bại");
  }
};
