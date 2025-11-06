// services/attendanceApprovalService.ts
import { Op, Transaction } from "sequelize";
import sequelize from "../config/db";
import AttendanceApproval from "../models/attendanceApprovalModel";
import Attendance from "../models/attendanceModel";
import { EmployeeInformation as Employee } from "../models/employeeModel";

interface CreateApprovalInput {
  attendanceId: number;
  approverId: number;
  approvalType?: "regular" | "overtime" | "adjustment";
  oldData?: object;
  newData?: object;
  comments?: string;
}

interface UpdateApprovalInput {
  approvalStatus: "approved" | "rejected";
  comments?: string;
}

interface ApprovalFilter {
  employeeId?: number;
  approverId?: number;
  status?: "pending" | "approved" | "rejected";
  type?: "regular" | "overtime" | "adjustment";
  dateFrom?: string;
  dateTo?: string;
}

export default class AttendanceApprovalService {
  // 🟩 Tạo yêu cầu phê duyệt
  static async create(
    payload: CreateApprovalInput,
    transaction?: Transaction
  ): Promise<AttendanceApproval | null> {
    const t = transaction || (await sequelize.transaction());
    try {
      const attendance = await Attendance.findByPk(payload.attendanceId, {
        transaction: t,
      });
      const approver = await Employee.findByPk(payload.approverId, {
        transaction: t,
      });
      if (!attendance || !approver) {
        if (!transaction) await t.rollback();
        return null;
      }

      const existing = await AttendanceApproval.findOne({
        where: {
          attendance_id: payload.attendanceId,
          approvalStatus: "pending",
        },
        transaction: t,
      });
      if (existing) {
        if (!transaction) await t.rollback();
        return null;
      }

      const approval = await AttendanceApproval.create(
        {
          attendance_id: payload.attendanceId,
          approver_id: payload.approverId,
          approvalType: payload.approvalType || "regular",
          approvalStatus: "pending",
          requestDate: new Date(),
          oldData: payload.oldData,
          newData: payload.newData,
          comments: payload.comments,
        },
        { transaction: t }
      );

      if (!transaction) await t.commit();
      return approval;
    } catch (error) {
      if (!transaction) await t.rollback();
      throw error;
    }
  }

  // 🟦 Cập nhật trạng thái phê duyệt
  static async updateStatus(
    id: number,
    payload: UpdateApprovalInput,
    currentUserId: number,
    transaction?: Transaction
  ): Promise<AttendanceApproval | null> {
    const t = transaction || (await sequelize.transaction());
    try {
      const approval = await AttendanceApproval.findByPk(id, {
        include: [
          {
            model: Attendance,
            as: "approvalAttendance", // ✅ alias đúng
            include: [
              {
                model: Employee,
                as: "attendanceEmployee", // ✅ alias đúng theo associations
                attributes: ["id", "fullName"],
              },
            ],
          },
        ],
        transaction: t,
      });

      if (
        !approval ||
        approval.approvalStatus !== "pending" ||
        approval.approver_id !== currentUserId
      ) {
        if (!transaction) await t.rollback();
        return null;
      }

      approval.approvalStatus = payload.approvalStatus;
      approval.approvalDate = new Date();
      approval.comments = payload.comments || approval.comments;
      await approval.save({ transaction: t });

      // Nếu là phê duyệt điều chỉnh thì cập nhật lại attendance
      if (
        payload.approvalStatus === "approved" &&
        approval.approvalType === "adjustment"
      ) {
        const attendance = approval.approvalAttendance;
        if (attendance && approval.newData) {
          Object.assign(attendance, approval.newData);
          await attendance.save({ transaction: t });
        }
      }

      if (!transaction) await t.commit();
      return approval;
    } catch (error) {
      if (!transaction) await t.rollback();
      throw error;
    }
  }

  // 🟨 Lấy danh sách phê duyệt (có lọc + phân trang)
  static async getAll(
    filter: ApprovalFilter = {},
    page: number = 1,
    limit: number = 10,
    currentUserId?: number
  ): Promise<{ rows: AttendanceApproval[]; count: number }> {
    const offset = (page - 1) * limit;
    const where: any = {};
    const attendanceWhere: any = {};

    if (filter.employeeId) attendanceWhere.employee_id = filter.employeeId;
    if (filter.approverId) where.approver_id = filter.approverId;
    if (filter.status) where.approvalStatus = filter.status;
    if (filter.type) where.approvalType = filter.type;
    if (filter.dateFrom || filter.dateTo) {
      where.requestDate = {};
      if (filter.dateFrom) where.requestDate[Op.gte] = filter.dateFrom;
      if (filter.dateTo) where.requestDate[Op.lte] = filter.dateTo;
    }
    if (currentUserId) where.approver_id = currentUserId;

    return await AttendanceApproval.findAndCountAll({
      where,
      include: [
        {
          model: Attendance,
          as: "approvalAttendance", // ✅ alias đúng
          where: attendanceWhere,
          include: [
            {
              model: Employee,
              as: "attendanceEmployee", // ✅ alias đúng
              attributes: ["id", "employeeCode", "fullName"],
            },
          ],
          attributes: ["id", "date", "status", "actualHours"],
        },
        {
          model: Employee,
          as: "approvalApprover",
          attributes: ["id", "fullName"],
        }, // ✅ alias đúng
      ],
      order: [["requestDate", "DESC"]],
      limit,
      offset,
      distinct: true,
    });
  }

  // 🟧 Lấy chi tiết phê duyệt
  static async getById(
    id: number,
    currentUserId?: number
  ): Promise<AttendanceApproval | null> {
    const approval = await AttendanceApproval.findByPk(id, {
      include: [
        {
          model: Attendance,
          as: "approvalAttendance", // ✅ alias đúng
          include: [
            {
              model: Employee,
              as: "attendanceEmployee", // ✅ alias đúng
              attributes: ["id", "employeeCode", "fullName"],
            },
          ],
        },
        {
          model: Employee,
          as: "approvalApprover",
          attributes: ["id", "fullName"],
        }, // ✅ alias đúng
      ],
    });

    if (!approval) return null;
    if (currentUserId && approval.approver_id !== currentUserId) return null;
    return approval;
  }

  // 🟥 Xóa yêu cầu phê duyệt (chỉ khi pending)
  static async delete(id: number, currentUserId: number): Promise<boolean> {
    const t = await sequelize.transaction();
    try {
      const approval = await AttendanceApproval.findByPk(id, {
        transaction: t,
      });
      if (
        !approval ||
        approval.approvalStatus !== "pending" ||
        approval.approver_id !== currentUserId
      ) {
        await t.rollback();
        return false;
      }

      await approval.destroy({ transaction: t });
      await t.commit();
      return true;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  // 🟪 Thống kê trạng thái phê duyệt
  static async getStats(approverId?: number) {
    const where: any = {};
    if (approverId) where.approver_id = approverId;

    const stats = await AttendanceApproval.findAll({
      where,
      attributes: [
        "approvalStatus",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["approvalStatus"],
      raw: true,
    });

    return {
      pending: Number(
        stats.find((s: any) => s.approvalStatus === "pending")?.count || 0
      ),
      approved: Number(
        stats.find((s: any) => s.approvalStatus === "approved")?.count || 0
      ),
      rejected: Number(
        stats.find((s: any) => s.approvalStatus === "rejected")?.count || 0
      ),
    };
  }
}
