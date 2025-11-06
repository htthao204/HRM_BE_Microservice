// services/attendanceAdjustmentService.ts
import { Op } from "sequelize";
import AttendanceAdjustment from "../models/attendanceAdjustmentModel";
import EmployeeInformation from "../models/employeeModel";
import {
  AttendanceAdjustmentCreateRequest,
  AttendanceAdjustmentUpdateRequest,
} from "../dto/request/attendanceAdjustmentRequest";
import { AttendanceAdjustmentResponse } from "../dto/response/attendanceAdjustmentResponse";
import { mapAttendanceAdjustment } from "../mappers/attendanceAdjustmentMapper";

// ==============================
// Lấy tất cả attendance adjustments
// ==============================
export const getAllAttendanceAdjustments = async (): Promise<
  AttendanceAdjustmentResponse[]
> => {
  const adjustments = await AttendanceAdjustment.findAll({
    include: [
      { model: EmployeeInformation, as: "employee" },
      { model: EmployeeInformation, as: "requester" },
      { model: EmployeeInformation, as: "approver" },
    ],
    order: [["adjustment_date", "DESC"]],
  });

  return adjustments.map(mapAttendanceAdjustment);
};

// ==============================
// Lấy 1 adjustment theo ID
// ==============================
export const getAttendanceAdjustmentById = async (
  id: number
): Promise<AttendanceAdjustmentResponse | null> => {
  const adjustment = await AttendanceAdjustment.findByPk(id, {
    include: [
      { model: EmployeeInformation, as: "employee" },
      { model: EmployeeInformation, as: "requester" },
      { model: EmployeeInformation, as: "approver" },
    ],
  });

  if (!adjustment) return null;
  return mapAttendanceAdjustment(adjustment);
};

// ==============================
// Pagination: get page
// ==============================
export const getAttendanceAdjustmentsPage = async (
  page: number = 1,
  limit: number = 10,
  filter?: {
    employeeId?: number;
    status?: "pending" | "approved" | "rejected";
    startDate?: string;
    endDate?: string;
  }
): Promise<{
  data: AttendanceAdjustmentResponse[];
  total: number;
  page: number;
  limit: number;
}> => {
  const offset = (page - 1) * limit;
  const where: any = {};

  if (filter) {
    if (filter.employeeId) where.employee_id = filter.employeeId;
    if (filter.status) where.status = filter.status;
    if (filter.startDate && filter.endDate)
      where.adjustment_date = {
        [Op.between]: [filter.startDate, filter.endDate],
      };
  }

  const { rows, count } = await AttendanceAdjustment.findAndCountAll({
    where,
    include: [
      { model: EmployeeInformation, as: "employee" },
      { model: EmployeeInformation, as: "requester" },
      { model: EmployeeInformation, as: "approver" },
    ],
    order: [["adjustment_date", "DESC"]],
    limit,
    offset,
  });

  return { data: rows.map(mapAttendanceAdjustment), total: count, page, limit };
};

// ==============================
// Thêm mới attendance adjustment
// ==============================
export const createAttendanceAdjustment = async (
  data: AttendanceAdjustmentCreateRequest
): Promise<AttendanceAdjustmentResponse> => {
  const adjustment = await AttendanceAdjustment.create({
    employee_id: data.employeeId,
    adjustment_date: data.adjustmentDate,
    original_hours: data.originalHours || 0,
    adjusted_hours: data.adjustedHours || 0,
    adjustment_type: data.adjustmentType,
    reason: data.reason,
    requested_by: data.requestedBy,
  });

  await adjustment.reload({
    include: [
      { model: EmployeeInformation, as: "employee" },
      { model: EmployeeInformation, as: "requester" },
      { model: EmployeeInformation, as: "approver" },
    ],
  });

  return mapAttendanceAdjustment(adjustment);
};

// ==============================
// Cập nhật attendance adjustment
// ==============================
export const updateAttendanceAdjustment = async (
  id: number,
  data: AttendanceAdjustmentUpdateRequest
): Promise<AttendanceAdjustmentResponse | null> => {
  const adjustment = await AttendanceAdjustment.findByPk(id, {
    include: [
      { model: EmployeeInformation, as: "employee" },
      { model: EmployeeInformation, as: "requester" },
      { model: EmployeeInformation, as: "approver" },
    ],
  });

  if (!adjustment) return null;
  await adjustment.update(data);
  return mapAttendanceAdjustment(adjustment);
};

// ==============================
// Xóa attendance adjustment
// ==============================
export const deleteAttendanceAdjustment = async (
  id: number
): Promise<number> => {
  const deletedCount = await AttendanceAdjustment.destroy({ where: { id } });
  return deletedCount;
};

// ==============================
// Phê duyệt adjustment
// ==============================
export const approveAdjustment = async (
  id: number,
  approverId: number
): Promise<AttendanceAdjustmentResponse | null> => {
  const adjustment = await AttendanceAdjustment.findByPk(id, {
    include: [
      { model: EmployeeInformation, as: "employee" },
      { model: EmployeeInformation, as: "requester" },
      { model: EmployeeInformation, as: "approver" },
    ],
  });

  if (!adjustment || adjustment.status !== "pending") return null;

  await adjustment.update({
    status: "approved",
    approved_by: approverId,
    approved_at: new Date(),
  });
  return mapAttendanceAdjustment(adjustment);
};

// ==============================
// Từ chối adjustment
// ==============================
export const rejectAdjustment = async (
  id: number,
  approverId: number
): Promise<AttendanceAdjustmentResponse | null> => {
  const adjustment = await AttendanceAdjustment.findByPk(id, {
    include: [
      { model: EmployeeInformation, as: "employee" },
      { model: EmployeeInformation, as: "requester" },
      { model: EmployeeInformation, as: "approver" },
    ],
  });

  if (!adjustment || adjustment.status !== "pending") return null;

  await adjustment.update({
    status: "rejected",
    approved_by: approverId,
    approved_at: new Date(),
  });
  return mapAttendanceAdjustment(adjustment);
};
