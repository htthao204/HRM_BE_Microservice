import OvertimeRequest from "../models/overtimeRequestModel";
import { EmployeeInformation } from "../models/employeeModel";
import WorkShift from "../models/workShiftModel";
import { Op, Transaction } from "sequelize";
import Payroll from "../models/payrollModel";
import Attendance from "../models/attendanceModel";
import AttendanceSummary from "../models/attendanceSummaryModel";
import sequelize from "../config/db"; // Import sequelize instance

const overtimeRequestService = {
  // ======================================
  // 🔹 LẤY DANH SÁCH YÊU CẦU TĂNG CA (CÓ FILTER)
  // ======================================
  async getAll(query: any) {
    const {
      page = 1,
      pageSize = 10,
      search,
      status,
      employeeId,
      departmentId,
      fromDate,
      toDate,
    } = query;

    const offset = (Number(page) - 1) * Number(pageSize);
    const where: any = {};

    // 🔹 Lọc trạng thái
    if (status) {
      where.status = status;
    }

    // 🔹 Lọc nhân viên
    if (employeeId) {
      where.employee_id = employeeId;
    }

    // 🔹 Lọc theo khoảng ngày tăng ca
    if (fromDate && toDate) {
      where.overtime_date = { [Op.between]: [fromDate, toDate] };
    } else if (fromDate) {
      where.overtime_date = { [Op.gte]: fromDate };
    } else if (toDate) {
      where.overtime_date = { [Op.lte]: toDate };
    }

    // 🔹 Lọc theo lý do (search)
    if (search) {
      where.reason = { [Op.iLike]: `%${search}%` };
    }

    // 🔹 Lọc theo phòng ban (thông qua EmployeeInformation)
    const include: any[] = [
      {
        model: EmployeeInformation,
        as: "overtimeEmployee",
        ...(departmentId && {
          where: { department_id: departmentId },
        }),
      },
      { model: WorkShift, as: "overtimeWorkShift" },
    ];

    // 🔹 Truy vấn dữ liệu
    const { count, rows } = await OvertimeRequest.findAndCountAll({
      where,
      include,
      order: [["created_at", "DESC"]],
      limit: Number(pageSize),
      offset,
    });

    return {
      data: rows,
      total: count,
      page: Number(page),
      pageSize: Number(pageSize),
    };
  },

  // ======================================
  // 🔹 LẤY CHI TIẾT
  // ======================================
  async getById(id: number) {
    return OvertimeRequest.findByPk(id, {
      include: [
        { model: EmployeeInformation, as: "overtimeEmployee" },
        { model: WorkShift, as: "overtimeWorkShift" },
      ],
    });
  },

  // ======================================
  // 🔹 TẠO YÊU CẦU
  // ======================================
  async create(payload: any) {
    return OvertimeRequest.create({
      employee_id: payload.employee_id,
      work_shift_id: payload.work_shift_id,
      overtime_date: payload.overtime_date,
      start_time: payload.start_time,
      end_time: payload.end_time,
      total_hours: payload.total_hours,
      reason: payload.reason,
      status: "pending",
    });
  },

  // ======================================
  // 🔹 CẬP NHẬT
  // ======================================
  async update(id: number, payload: any) {
    await OvertimeRequest.update(payload, { where: { id } });
    return OvertimeRequest.findByPk(id);
  },

  // ======================================
  // 🔹 XOÁ
  // ======================================
  async delete(id: number) {
    return OvertimeRequest.destroy({ where: { id } });
  },

  // ======================================
  // 🔹 PHÊ DUYỆT ĐƠN GIẢN (CHỈ CẬP NHẬT STATUS)
  // ======================================
  async approve(id: number, approverId: number) {
    await OvertimeRequest.update(
      {
        status: "approved",
        approved_by: approverId,
        approved_at: new Date(),
      },
      { where: { id } }
    );
    return OvertimeRequest.findByPk(id);
  },

  // ======================================
  // 🔹 TỪ CHỐI
  // ======================================
  async reject(id: number, approverId: number, notes?: string) {
    await OvertimeRequest.update(
      {
        status: "rejected",
        approved_by: approverId,
        approved_at: new Date(),
        notes,
      },
      { where: { id } }
    );
    return OvertimeRequest.findByPk(id);
  },

  // ======================================
  // 🔹 HOÀN THÀNH
  // ======================================
  async complete(id: number, actualHours: number, notes?: string) {
    await OvertimeRequest.update(
      {
        status: "completed",
        actual_hours: actualHours,
        notes,
      },
      { where: { id } }
    );
    return OvertimeRequest.findByPk(id);
  },

  // ======================================
  // ✅ PHÊ DUYỆT VỚI TRANSACTION (CẬP NHẬT TẤT CẢ BẢNG LIÊN QUAN)
  // ======================================
  async approveSingle(
    id: number,
    approverId: number,
    notes?: string
  ): Promise<any> {
    const transaction = await sequelize.transaction();

    try {
      // 1. Lấy thông tin yêu cầu
      const overtimeRequest = await OvertimeRequest.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!overtimeRequest) {
        throw new Error("Không tìm thấy yêu cầu tăng ca");
      }

      // Kiểm tra trạng thái hiện tại
      if (overtimeRequest.status !== "pending") {
        throw new Error(
          `Yêu cầu đã được ${
            overtimeRequest.status === "approved" ? "phê duyệt" : "từ chối"
          } trước đó`
        );
      }

      // 2. Cập nhật trạng thái overtime request
      await OvertimeRequest.update(
        {
          status: "approved",
          approved_by: approverId,
          approved_at: new Date(),
          notes: notes || overtimeRequest.notes,
          updated_at: new Date(),
        },
        {
          where: { id },
          transaction,
        }
      );

      // 3. CẬP NHẬT CÁC BẢNG LIÊN QUAN

      // 3.1. Cập nhật bảng attendances
      await this.updateAttendanceForOvertime(overtimeRequest, transaction);

      // 3.2. Cập nhật attendance_summaries
      await this.updateAttendanceSummary(overtimeRequest, transaction);

      // 3.3. Cập nhật payrolls (tính toán lương tăng ca)
      await this.updatePayrollForOvertime(overtimeRequest, transaction);

      // 4. Commit transaction
      await transaction.commit();

      // 5. Lấy lại thông tin đã cập nhật
      const updatedRequest = await OvertimeRequest.findByPk(id, {
        include: [{ model: EmployeeInformation, as: "overtimeEmployee" }],
      });

      return {
        success: true,
        message: "Phê duyệt yêu cầu tăng ca thành công",
        data: updatedRequest,
      };
    } catch (error: any) {
      // Rollback nếu có lỗi
      await transaction.rollback();
      console.error("❌ Lỗi khi phê duyệt yêu cầu tăng ca:", error);
      return {
        success: false,
        message: error.message || "Không thể phê duyệt yêu cầu tăng ca",
      };
    }
  },

  // ======================================
  // 📊 CẬP NHẬT BẢNG ATTENDANCES
  // ======================================
  async updateAttendanceForOvertime(
    overtimeRequest: any,
    transaction: Transaction
  ): Promise<void> {
    const { employee_id, overtime_date, total_hours } = overtimeRequest;

    // Tìm attendance record cho ngày đó
    let attendance = await Attendance.findOne({
      where: {
        employee_id,
        date: overtime_date,
      },
      transaction,
    });

    if (attendance) {
      // Cập nhật overtime hours nếu đã có record
      await Attendance.update(
        {
          overtime_hours:
            (parseFloat(attendance.overtime_hours?.toString()) || 0) +
            parseFloat(total_hours),
          updated_at: new Date(),
        },
        {
          where: { id: attendance.id },
          transaction,
        }
      );
    } else {
      // Tạo mới attendance record nếu chưa có
      await Attendance.create(
        {
          employeeId: employee_id,
          date: overtime_date,
          overtime_hours: total_hours,
          status: "present",
          actual_hours: total_hours,
          created_at: new Date(),
          updated_at: new Date(),
        },
        { transaction }
      );
    }
  },

  // ======================================
  // 📈 CẬP NHẬT BẢNG ATTENDANCE_SUMMARIES
  // ======================================
  async updateAttendanceSummary(
    overtimeRequest: any,
    transaction: Transaction
  ): Promise<void> {
    const { employee_id, overtime_date, total_hours } = overtimeRequest;
    const summaryMonth = overtime_date.substring(0, 7); // Format: YYYY-MM

    // Tìm summary record cho tháng
    let summary = await AttendanceSummary.findOne({
      where: {
        employee_id,
        summary_month: summaryMonth,
      },
      transaction,
    });

    const totalHoursNum = parseFloat(total_hours);

    if (summary) {
      // Cập nhật tổng overtime hours
      await AttendanceSummary.update(
        {
          total_overtime_hours:
            (parseFloat(summary.total_overtime_hours?.toString()) || 0) +
            totalHoursNum,
          total_actual_hours:
            (parseFloat(summary.total_actual_hours?.toString()) || 0) +
            totalHoursNum,
          updated_at: new Date(),
        },
        {
          where: { id: summary.id },
          transaction,
        }
      );
    } else {
      // Tạo mới summary record
      await AttendanceSummary.create(
        {
          employee_id,
          summary_month: summaryMonth,
          total_overtime_hours: totalHoursNum,
          total_actual_hours: totalHoursNum,
          total_working_days: 0,
          total_present_days: 0,
          total_absent_days: 0,
          total_late_days: 0,
          total_early_days: 0,
          total_leave_days: 0,
          created_at: new Date(),
          updated_at: new Date(),
        },
        { transaction }
      );
    }
  },

  // ======================================
  // 💰 CẬP NHẬT BẢNG PAYROLLS
  // ======================================
  async updatePayrollForOvertime(
    overtimeRequest: any,
    transaction: Transaction
  ): Promise<void> {
    const { employee_id, overtime_date, total_hours } = overtimeRequest;
    const payrollPeriod = overtime_date.substring(0, 7); // Format: YYYY-MM

    // Tính toán lương tăng ca
    const overtimePay = await this.calculateOvertimePay(overtimeRequest);

    // Tìm payroll record cho kỳ
    let payroll = await Payroll.findOne({
      where: {
        employee_id,
        period: payrollPeriod,
      },
      transaction,
    });

    if (payroll) {
      // Cập nhật tổng overtime pay
      await Payroll.update(
        {
          total_overtime:
            (parseFloat(payroll.total_overtime?.toString()) || 0) + overtimePay,
          gross_salary:
            (parseFloat(payroll.gross_salary?.toString()) || 0) + overtimePay,
          net_salary:
            (parseFloat(payroll.net_salary?.toString()) || 0) + overtimePay,
          updated_at: new Date(),
        },
        {
          where: { id: payroll.id },
          transaction,
        }
      );
    }
    // Nếu chưa có payroll record, sẽ được tạo khi tính lương
  },

  // ======================================
  // 🧮 TÍNH LƯƠNG TĂNG CA
  // ======================================
  async calculateOvertimePay(overtimeRequest: any): Promise<number> {
    try {
      // Lấy thông tin nhân viên để lấy lương cơ bản
      const employee = await EmployeeInformation.findByPk(
        overtimeRequest.employee_id,
        {
          include: [
            {
              model: Payroll,
              as: "payrolls",
              where: { period: overtimeRequest.overtime_date.substring(0, 7) },
              required: false,
            },
          ],
        }
      );

      if (!employee) {
        console.warn(
          `Không tìm thấy thông tin nhân viên ID: ${overtimeRequest.employee_id}`
        );
        return 0;
      }

      // Giả sử lương cơ bản là 10,000,000 VND nếu không có payroll record
      let baseSalary = 10000000;

      // Nếu có payroll record, lấy baseSalary từ đó
      if (employee.payrolls && employee.payrolls.length > 0) {
        baseSalary =
          parseFloat(employee.payrolls[0].base_salary?.toString()) ||
          baseSalary;
      }

      const hourlyRate = baseSalary / 22 / 8; // 22 ngày công, 8h/ngày
      const overtimeMultiplier = 1.5; // Hệ số tăng ca ngày thường
      const totalHours = parseFloat(overtimeRequest.total_hours);

      return totalHours * hourlyRate * overtimeMultiplier;
    } catch (error) {
      console.error("❌ Lỗi khi tính lương tăng ca:", error);
      return 0;
    }
  },

  // ======================================
  // 🔄 PHÊ DUYỆT NHIỀU YÊU CẦU
  // ======================================
  async approveMultiple(
    ids: number[],
    approverId: number,
    notes?: string
  ): Promise<any> {
    const transaction = await sequelize.transaction();

    try {
      if (!ids || ids.length === 0) {
        throw new Error("Danh sách ID không hợp lệ");
      }

      // Kiểm tra các yêu cầu tồn tại và đang chờ phê duyệt
      const pendingRequests = await OvertimeRequest.findAll({
        where: {
          id: { [Op.in]: ids },
          status: "pending",
        },
        transaction,
      });

      if (pendingRequests.length === 0) {
        throw new Error("Không có yêu cầu nào ở trạng thái chờ phê duyệt");
      }

      const validIds = pendingRequests.map((req) => req.id);

      // Cập nhật trạng thái tất cả requests
      await OvertimeRequest.update(
        {
          status: "approved",
          approved_by: approverId,
          approved_at: new Date(),
          notes: notes || null,
          updated_at: new Date(),
        },
        {
          where: {
            id: { [Op.in]: validIds },
          },
          transaction,
        }
      );

      // Cập nhật các bảng liên quan cho từng request
      for (const request of pendingRequests) {
        await this.updateAttendanceForOvertime(request, transaction);
        await this.updateAttendanceSummary(request, transaction);
        await this.updatePayrollForOvertime(request, transaction);
      }

      await transaction.commit();

      // Lấy lại danh sách đã phê duyệt
      const approvedRequests = await OvertimeRequest.findAll({
        where: {
          id: { [Op.in]: validIds },
        },
        include: [{ model: EmployeeInformation, as: "overtimeEmployee" }],
      });

      return {
        success: true,
        message: `Đã phê duyệt thành công ${pendingRequests.length} yêu cầu tăng ca`,
        data: {
          totalRequested: ids.length,
          totalApproved: pendingRequests.length,
          approvedRequests,
          failedIds: ids.filter((id) => !validIds.includes(id)),
        },
      };
    } catch (error: any) {
      await transaction.rollback();
      console.error("❌ Lỗi khi phê duyệt nhiều yêu cầu tăng ca:", error);
      return {
        success: false,
        message: error.message || "Không thể phê duyệt các yêu cầu tăng ca",
      };
    }
  },

  // ======================================
  // 📋 PHÊ DUYỆT TẤT CẢ YÊU CẦU ĐANG CHỜ
  // ======================================
  async approveAll(
    approverId: number,
    filters?: {
      departmentId?: number;
      fromDate?: string;
      toDate?: string;
    },
    notes?: string
  ): Promise<any> {
    const transaction = await sequelize.transaction();

    try {
      const where: any = {
        status: "pending",
      };

      // Thêm bộ lọc nếu có
      if (filters?.fromDate && filters?.toDate) {
        where.overtime_date = {
          [Op.between]: [filters.fromDate, filters.toDate],
        };
      } else if (filters?.fromDate) {
        where.overtime_date = { [Op.gte]: filters.fromDate };
      } else if (filters?.toDate) {
        where.overtime_date = { [Op.lte]: filters.toDate };
      }

      // Lấy tất cả yêu cầu đang chờ
      const pendingRequests = await OvertimeRequest.findAll({
        where,
        include: [
          {
            model: EmployeeInformation,
            as: "overtimeEmployee",
            ...(filters?.departmentId && {
              where: { department_id: filters.departmentId },
            }),
          },
        ],
        transaction,
      });

      if (pendingRequests.length === 0) {
        return {
          success: true,
          message: "Không có yêu cầu tăng ca nào đang chờ phê duyệt",
          data: {
            totalApproved: 0,
            approvedRequests: [],
          },
        };
      }

      const pendingIds = pendingRequests.map((req) => req.id);

      // Cập nhật trạng thái tất cả
      await OvertimeRequest.update(
        {
          status: "approved",
          approved_by: approverId,
          approved_at: new Date(),
          notes: notes || null,
          updated_at: new Date(),
        },
        {
          where: {
            id: { [Op.in]: pendingIds },
          },
          transaction,
        }
      );

      // Cập nhật các bảng liên quan cho từng request
      for (const request of pendingRequests) {
        await this.updateAttendanceForOvertime(request, transaction);
        await this.updateAttendanceSummary(request, transaction);
        await this.updatePayrollForOvertime(request, transaction);
      }

      await transaction.commit();

      // Lấy lại danh sách đã phê duyệt
      const approvedRequests = await OvertimeRequest.findAll({
        where: {
          id: { [Op.in]: pendingIds },
        },
        include: [{ model: EmployeeInformation, as: "overtimeEmployee" }],
        order: [["overtime_date", "ASC"]],
      });

      return {
        success: true,
        message: `Đã phê duyệt thành công ${pendingRequests.length} yêu cầu tăng ca đang chờ`,
        data: {
          totalApproved: pendingRequests.length,
          approvedRequests,
        },
      };
    } catch (error: any) {
      await transaction.rollback();
      console.error("❌ Lỗi khi phê duyệt tất cả yêu cầu tăng ca:", error);
      return {
        success: false,
        message: error.message || "Không thể phê duyệt tất cả yêu cầu tăng ca",
      };
    }
  },
};

export default overtimeRequestService;
