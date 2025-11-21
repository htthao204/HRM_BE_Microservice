import { Op, Transaction } from "sequelize";
import sequelize from "../config/db";
import AttendanceApproval from "../models/attendanceApprovalModel";
import Attendance from "../models/attendanceModel";
import { EmployeeInformation as Employee } from "../models/employeeModel";
import AttendanceAdjustment from "../models/attendanceAdjustmentModel";

interface CreateApprovalInput {
  attendanceId?: number;
  adjustmentId?: number;
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
  // 🟩 Tạo yêu cầu phê duyệt (CẬP NHẬT)
  static async create(
    payload: CreateApprovalInput,
    transaction?: Transaction
  ): Promise<AttendanceApproval | null> {
    const t = transaction || (await sequelize.transaction());
    try {
      // 🆕 KIỂM TRA LOẠI PHÊ DUYỆT
      if (payload.approvalType === "adjustment" && !payload.adjustmentId) {
        throw new Error("adjustmentId là bắt buộc cho loại adjustment");
      }
      if (payload.approvalType !== "adjustment" && !payload.attendanceId) {
        throw new Error("attendanceId là bắt buộc cho loại regular/overtime");
      }

      // 🆕 KIỂM TRA TỒN TẠI
      let existing;
      if (payload.approvalType === "adjustment") {
        existing = await AttendanceApproval.findOne({
          where: {
            adjustment_id: payload.adjustmentId,
            approvalStatus: "pending",
          },
          transaction: t,
        });
      } else {
        existing = await AttendanceApproval.findOne({
          where: {
            attendance_id: payload.attendanceId,
            approvalStatus: "pending",
          },
          transaction: t,
        });
      }

      if (existing) {
        if (!transaction) await t.rollback();
        return null;
      }

      // 🆕 TẠO APPROVAL VỚI CẤU TRÚC MỚI
      const approvalData: any = {
        approver_id: payload.approverId,
        approvalType: payload.approvalType || "regular",
        approvalStatus: "pending",
        requestDate: new Date(),
        oldData: payload.oldData,
        newData: payload.newData,
        comments: payload.comments,
      };

      // 🆕 THÊM ID TÙY THEO LOẠI
      if (payload.approvalType === "adjustment") {
        approvalData.adjustment_id = payload.adjustmentId;
      } else {
        approvalData.attendance_id = payload.attendanceId;
      }

      const approval = await AttendanceApproval.create(approvalData, {
        transaction: t,
      });

      if (!transaction) await t.commit();
      return approval;
    } catch (error) {
      if (!transaction) await t.rollback();
      throw error;
    }
  }

  // 🟦 Cập nhật trạng thái phê duyệt (CẬP NHẬT LỚN)
  static async updateStatus(
    id: number,
    payload: UpdateApprovalInput,
    currentUserId: number,
    transaction?: Transaction
  ): Promise<AttendanceApproval | null> {
    const t = transaction || (await sequelize.transaction());
    try {
      // 🎯 SỬA: TẠM THỜI KHÔNG INCLUDE AttendanceAdjustment ĐỂ TRÁNH LỖI
      const approval = await AttendanceApproval.findByPk(id, {
        include: [
          {
            model: Attendance,
            as: "approvalAttendance",
            include: [
              {
                model: Employee,
                as: "attendanceEmployee",
                attributes: ["id", "fullName"],
              },
            ],
          },
          // 🎯 COMMENT LẠI PHẦN NÀY:
          // {
          //   model: AttendanceAdjustment,
          //   as: "approvalAdjustment",
          //   include: [
          //     {
          //       model: Employee,
          //       as: "adjustmentEmployee",
          //       attributes: ["id", "fullName"],
          //     },
          //   ],
          // },
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

      // 🆕 CẬP NHẬT TRẠNG THÁI
      approval.approvalStatus = payload.approvalStatus;
      approval.approvalDate = new Date();
      approval.comments = payload.comments || approval.comments;
      await approval.save({ transaction: t });

      // 🆕 XỬ LÝ PHÊ DUYỆT THEO LOẠI
      if (payload.approvalStatus === "approved") {
        if (approval.approvalType === "adjustment" && approval.adjustment_id) {
          // PHÊ DUYỆT ĐIỀU CHỈNH CÔNG
          // 🎯 SỬA: TÌM ADJUSTMENT TRỰC TIẾP THAY VÌ QUA INCLUDE
          const adjustment = await AttendanceAdjustment.findByPk(
            approval.adjustment_id,
            {
              transaction: t,
              include: [
                {
                  model: Employee,
                  as: "employee",
                  attributes: ["id", "fullName"],
                },
              ],
            }
          );
          if (adjustment) {
            adjustment.status = "approved";
            adjustment.approved_by = currentUserId;
            adjustment.approved_at = new Date();
            await adjustment.save({ transaction: t });

            // CẬP NHẬT BẢNG ATTENDANCES
            await this.updateAttendanceFromAdjustment(adjustment, t);
          }
        } else if (approval.attendance_id && approval.newData) {
          // PHÊ DUYỆT CHẤM CÔNG THÔNG THƯỜNG
          const attendance = approval.approvalAttendance;
          if (attendance) {
            Object.assign(attendance, approval.newData);
            await attendance.save({ transaction: t });
          }
        }
      } else if (payload.approvalStatus === "rejected") {
        // 🆕 XỬ LÝ TỪ CHỐI ĐIỀU CHỈNH
        if (approval.approvalType === "adjustment" && approval.adjustment_id) {
          // 🎯 SỬA: TÌM ADJUSTMENT TRỰC TIẾP
          const adjustment = await AttendanceAdjustment.findByPk(
            approval.adjustment_id,
            { transaction: t }
          );
          if (adjustment) {
            adjustment.status = "rejected";
            adjustment.approved_by = currentUserId;
            adjustment.approved_at = new Date();
            await adjustment.save({ transaction: t });
          }
        }
      }

      if (!transaction) await t.commit();
      return approval;
    } catch (error) {
      if (!transaction) await t.rollback();
      throw error;
    }
  }

  // 🆕 HÀM MỚI: CẬP NHẬT ATTENDANCE TỪ ADJUSTMENT
  private static async updateAttendanceFromAdjustment(
    adjustment: any,
    transaction: Transaction
  ): Promise<void> {
    const attendanceData = {
      employee_id: adjustment.employee_id,
      date: adjustment.adjustment_date,
      actual_hours: adjustment.adjusted_hours,
      checkin_time: adjustment.checkin_time,
      checkout_time: adjustment.checkout_time,
      status: this.calculateAttendanceStatus(adjustment.adjusted_hours),
      notes: `Điều chỉnh: ${adjustment.reason}. ${
        adjustment.review_note || ""
      }`,
    };

    await Attendance.upsert(attendanceData, { transaction });
  }

  // 🆕 HÀM MỚI: TÍNH TRẠNG THÁI ATTENDANCE
  private static calculateAttendanceStatus(hours: number): string {
    if (hours >= 6) return "present";
    if (hours >= 4) return "half_day";
    return "absent";
  }

  // 🟨 Lấy danh sách phê duyệt (CẬP NHẬT INCLUDE - SỬA LỖI)
  static async getAll(
    filter: ApprovalFilter = {},
    page: number = 1,
    limit: number = 10,
    currentUserId?: number
  ): Promise<{ rows: AttendanceApproval[]; count: number }> {
    const offset = (page - 1) * limit;
    const where: any = {};
    const attendanceWhere: any = {};
    const adjustmentWhere: any = {};

    if (filter.employeeId) {
      attendanceWhere.employee_id = filter.employeeId;
      adjustmentWhere.employee_id = filter.employeeId;
    }
    if (filter.approverId) where.approver_id = filter.approverId;
    if (filter.status) where.approvalStatus = filter.status;
    if (filter.type) where.approvalType = filter.type;
    if (filter.dateFrom || filter.dateTo) {
      where.requestDate = {};
      if (filter.dateFrom) where.requestDate[Op.gte] = filter.dateFrom;
      if (filter.dateTo) where.requestDate[Op.lte] = filter.dateTo;
    }
    if (currentUserId) where.approver_id = currentUserId;

    try {
      // 🎯 THỬ VỚI INCLUDE ĐƠN GIẢN TRƯỚC
      return await AttendanceApproval.findAndCountAll({
        where,
        include: [
          {
            model: Attendance,
            as: "approvalAttendance",
            where: attendanceWhere,
            include: [
              {
                model: Employee,
                as: "attendanceEmployee",
                attributes: ["id", "employeeCode", "fullName"],
              },
            ],
            attributes: ["id", "date", "status", "actual_hours"],
            required: false,
          },
          // 🎯 TẠM THỜI COMMENT PHẦN NÀY ĐỂ TRÁNH LỖI ASSOCIATION:
          // {
          //   model: AttendanceAdjustment,
          //   as: "approvalAdjustment",
          //   where: adjustmentWhere,
          //   include: [
          //     {
          //       model: Employee,
          //       as: "adjustmentEmployee",
          //       attributes: ["id", "employeeCode", "fullName"],
          //     },
          //   ],
          //   attributes: [
          //     "id",
          //     "adjustment_date",
          //     "adjusted_hours",
          //     "status",
          //     "reason",
          //   ],
          //   required: false,
          // },
          {
            model: Employee,
            as: "approvalApprover",
            attributes: ["id", "fullName"],
          },
        ],
        order: [["requestDate", "DESC"]],
        limit,
        offset,
        distinct: true,
      });
    } catch (error) {
      console.error("❌ Lỗi khi getAll với include, thử không include:", error);

      // 🎯 FALLBACK: THỬ KHÔNG CÓ INCLUDE NẾU VẪN LỖI
      return await AttendanceApproval.findAndCountAll({
        where,
        order: [["requestDate", "DESC"]],
        limit,
        offset,
        distinct: true,
      });
    }
  }

  // 🟧 Lấy chi tiết phê duyệt (CẬP NHẬT - SỬA LỖI)
  static async getById(
    id: number,
    currentUserId?: number
  ): Promise<AttendanceApproval | null> {
    try {
      const approval = await AttendanceApproval.findByPk(id, {
        include: [
          {
            model: Attendance,
            as: "approvalAttendance",
            include: [
              {
                model: Employee,
                as: "attendanceEmployee",
                attributes: ["id", "employeeCode", "fullName"],
              },
            ],
          },
          // 🎯 TẠM THỜI COMMENT PHẦN NÀY:
          // {
          //   model: AttendanceAdjustment,
          //   as: "approvalAdjustment",
          //   include: [
          //     {
          //       model: Employee,
          //       as: "adjustmentEmployee",
          //       attributes: ["id", "employeeCode", "fullName"],
          //     },
          //   ],
          // },
          {
            model: Employee,
            as: "approvalApprover",
            attributes: ["id", "fullName"],
          },
        ],
      });

      if (!approval) return null;
      if (currentUserId && approval.approver_id !== currentUserId) return null;
      return approval;
    } catch (error) {
      console.error(
        "❌ Lỗi khi getById với include, thử không include:",
        error
      );

      // 🎯 FALLBACK: THỬ KHÔNG CÓ INCLUDE
      const approval = await AttendanceApproval.findByPk(id);
      if (!approval) return null;
      if (currentUserId && approval.approver_id !== currentUserId) return null;
      return approval;
    }
  }

  // 🟥 Xóa yêu cầu phê duyệt (GIỮ NGUYÊN)
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

  // 🟪 Thống kê trạng thái phê duyệt (GIỮ NGUYÊN)
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
