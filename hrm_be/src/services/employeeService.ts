import ExcelJS from "exceljs";
import { Transaction, Op } from "sequelize";
import sequelize from "../config/db";
import EmployeeInformation, {
  EmployeeBankAccount,
  EmployeeDependent,
  EmployeePrivateInformation,
} from "../models/employeeModel";
import Department from "../models/departmentModel";
import Position from "../models/positionModel";
import Account from "../models/accountModel";

export interface PaginatedResult<T> {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  data: T[];
}
interface ImportResult {
  total: number;
  success: number;
  errors: string[];
  duplicates: number;
  updated: number;
}

// ===============================
// 🔹 1. Lấy danh sách nhân viên (phân trang) - ĐÃ THÊM AVATAR
// ===============================
export const getAllEmployees = async (
  page = 1,
  pageSize = 10,
  filters: {
    departmentId?: number;
    positionId?: number;
    status?: string;
    search?: string;
  } = {}
): Promise<PaginatedResult<EmployeeInformation>> => {
  const offset = (page - 1) * pageSize;
  const where: any = {};

  if (filters.departmentId) where.departmentId = filters.departmentId;
  if (filters.positionId) where.positionId = filters.positionId;
  if (filters.status) where.status = filters.status;
  if (filters.search) where.fullName = { [Op.like]: `%${filters.search}%` };

  const { count, rows } = await EmployeeInformation.findAndCountAll({
    where,
    limit: pageSize,
    offset,
    order: [["created_at", "DESC"]],
    attributes: [
      "id",
      "employeeCode",
      "fullName",
      "email",
      "phone",
      "avatar", // ✅ THÊM AVATAR
      "status",
      "maritalStatus",
      "numberOfDependents",
      "hireDate",
      "createdAt",
    ],
    include: [
      {
        model: EmployeePrivateInformation,
        as: "privateInfo",
      },
      {
        model: EmployeeBankAccount,
        as: "bankAccounts",
      },
      {
        model: EmployeeDependent,
        as: "dependents",
      },
      {
        model: Department,
        as: "employeeDepartment",
      },
      {
        model: Position,
        as: "employeePosition",
      },
    ],
  });

  return {
    totalItems: count,
    totalPages: Math.ceil(count / pageSize),
    currentPage: page,
    data: rows,
  };
};

// ===============================
// 🔹 2. Lấy thông tin nhân viên theo accountId - ĐÃ THÊM AVATAR
// ===============================
export const getEmployeeByAccountId = async (
  accountId: number
): Promise<{
  id: number;
  employeeCode: string;
  fullName: string;
  email?: string;
  avatar?: string; // ✅ THÊM AVATAR
  position?: string;
  department?: string;
  account: {
    id: number;
    username: string;
  };
} | null> => {
  try {
    console.log(`🔍 Finding employee for accountId: ${accountId}`);

    const employee = await EmployeeInformation.findOne({
      where: { accountId },
      attributes: [
        "id",
        "employeeCode",
        "fullName",
        "accountId",
        "email",
        "avatar", // ✅ THÊM AVATAR
      ],
      include: [
        {
          model: Department,
          as: "employeeDepartment",
          attributes: ["name"],
        },
        {
          model: Position,
          as: "employeePosition",
          attributes: ["name"],
        },
        {
          model: Account,
          as: "employeeAccount",
          attributes: ["id", "username"],
        },
      ],
    });

    if (!employee) {
      console.log(`❌ No employee found for accountId: ${accountId}`);
      return null;
    }

    const result = {
      id: employee.id,
      employeeCode: employee.employeeCode,
      fullName: employee.fullName,
      email: (employee as any).email,
      avatar: (employee as any).avatar, // ✅ THÊM AVATAR
      position: (employee as any).employeePosition?.name,
      department: (employee as any).employeeDepartment?.name,
      account: {
        id: (employee as any).employeeAccount?.id || accountId,
        username: (employee as any).employeeAccount?.username,
      },
    };

    console.log(`✅ Found employee with account:`, result);
    return result;
  } catch (error) {
    console.error(
      `❌ Error getting employee by accountId ${accountId}:`,
      error
    );
    throw error;
  }
};

/**
 * ✅ Lấy thông tin employee của user hiện tại (cho API /employees/me)
 */
export const getMyEmployee = async (accountId: number): Promise<any> => {
  return getEmployeeByAccountId(accountId);
};

// ===============================
// 🔹 3. Lấy thông tin nhân viên theo ID - ĐÃ THÊM AVATAR
// ===============================
export const getEmployeeById = async (id: number) => {
  const employee = await EmployeeInformation.findByPk(id, {
    attributes: [
      "id",
      "employeeCode",
      "fullName",
      "email",
      "phone",
      "avatar", // ✅ THÊM AVATAR
      "status",
      "maritalStatus",
      "numberOfDependents",
      "hireDate",
      "departmentId",
      "positionId",
      "accountId",
      "createdAt",
    ],
    include: [
      { model: EmployeePrivateInformation, as: "privateInfo" },
      { model: EmployeeBankAccount, as: "bankAccounts" },
      { model: EmployeeDependent, as: "dependents" },
      {
        model: Department,
        as: "employeeDepartment",
        attributes: ["id", "name", "code"],
      },
      {
        model: Position,
        as: "employeePosition",
        attributes: ["id", "name", "level"],
      },
    ],
  });

  if (!employee) throw new Error("Nhân viên không tồn tại");
  return employee.get({ plain: true });
};

// ===============================
// 🔹 4. Lấy thông tin công việc của nhân viên
// ===============================
export const getEmployeeJobInfo = async (id: number) => {
  const employee = await EmployeeInformation.findByPk(id, {
    attributes: [
      "id",
      "employeeCode",
      "fullName",
      "departmentId",
      "positionId",
      "hireDate",
      "status",
    ],
  });
  if (!employee) throw new Error("Không tìm thấy nhân viên");
  return employee.get({ plain: true });
};

// ===============================
// 🔹 5. Tạo nhân viên mới
// ===============================
export const createEmployee = async (employeeData: any) => {
  const t = await sequelize.transaction();
  try {
    // Tạo mã nhân viên
    const lastEmp = await EmployeeInformation.findOne({
      order: [["created_at", "DESC"]],
      attributes: ["employeeCode"],
    });

    let nextCode = "NV0001";
    if (lastEmp?.employeeCode) {
      const num = parseInt(lastEmp.employeeCode.replace("NV", "")) || 0;
      nextCode = `NV${String(num + 1).padStart(4, "0")}`;
    }

    // 1️⃣ Tạo thông tin nhân viên
    const newEmployee = await EmployeeInformation.create(
      { ...employeeData, employeeCode: nextCode },
      { transaction: t }
    );

    // 2️⃣ Thông tin riêng tư
    if (employeeData.privateInfo)
      await EmployeePrivateInformation.create(
        { ...employeeData.privateInfo, employeeId: newEmployee.id },
        { transaction: t }
      );

    // 3️⃣ Tài khoản ngân hàng
    if (employeeData.bankAccounts?.length)
      await EmployeeBankAccount.bulkCreate(
        employeeData.bankAccounts.map((b: any) => ({
          ...b,
          employeeId: newEmployee.id,
        })),
        { transaction: t }
      );

    // 4️⃣ Người phụ thuộc
    if (employeeData.dependents?.length)
      await EmployeeDependent.bulkCreate(
        employeeData.dependents.map((d: any) => ({
          ...d,
          employeeId: newEmployee.id,
        })),
        { transaction: t }
      );

    await t.commit();
    return {
      success: true,
      message: "Tạo nhân viên thành công",
      id: newEmployee.id,
    };
  } catch (error) {
    await t.rollback();
    console.error(error);
    throw new Error("Tạo nhân viên thất bại");
  }
};

// ===============================
// 🔹 6. Cập nhật nhân viên - ĐÃ THÊM AVATAR
// ===============================
export const updateEmployee = async (id: number, employeeData: any) => {
  const t = await sequelize.transaction();
  try {
    // 1️⃣ Cập nhật EmployeeInformation
    await EmployeeInformation.update(employeeData, {
      where: { id },
      transaction: t,
    });

    // 2️⃣ Private info
    if (employeeData.privateInfo) {
      await EmployeePrivateInformation.upsert(
        { ...employeeData.privateInfo, employeeId: id },
        { transaction: t }
      );
    }

    // 3️⃣ Bank accounts
    if (employeeData.bankAccounts) {
      await EmployeeBankAccount.destroy({
        where: { employeeId: id },
        transaction: t,
      });
      if (employeeData.bankAccounts.length > 0) {
        await EmployeeBankAccount.bulkCreate(
          employeeData.bankAccounts.map((b: any) => ({ ...b, employeeId: id })),
          { transaction: t }
        );
      }
    }

    // 4️⃣ Dependents
    if (employeeData.dependents) {
      await EmployeeDependent.destroy({
        where: { employeeId: id },
        transaction: t,
      });
      if (employeeData.dependents.length > 0) {
        await EmployeeDependent.bulkCreate(
          employeeData.dependents.map((d: any) => ({ ...d, employeeId: id })),
          { transaction: t }
        );
      }
    }

    await t.commit();
    return { success: true, message: "Cập nhật nhân viên thành công" };
  } catch (error) {
    await t.rollback();
    console.error(error);
    throw new Error("Cập nhật nhân viên thất bại");
  }
};

// ===============================
// 🔹 7. Xóa nhân viên (soft delete)
// ===============================
export const deleteEmployee = async (id: number) => {
  const emp = await EmployeeInformation.findByPk(id);
  if (!emp) throw new Error("Không tìm thấy nhân viên");
  await emp.destroy();
  return { success: true, message: "Xóa nhân viên thành công" };
};

// ===============================
// 🔹 8. Lấy danh sách người phụ thuộc
// ===============================
export const getEmployeeDependents = async (employeeId: number) => {
  const deps = await EmployeeDependent.findAll({
    where: { employeeId, isActive: true },
  });
  return deps.map((d) => d.get({ plain: true }));
};

// ===============================
// 🔹 9. API để upload avatar
// ===============================
export const updateEmployeeAvatar = async (
  employeeId: number,
  avatarUrl: string
): Promise<{ success: boolean; message: string; avatarUrl: string }> => {
  try {
    const employee = await EmployeeInformation.findByPk(employeeId);
    if (!employee) {
      throw new Error("Không tìm thấy nhân viên");
    }

    await employee.update({ avatar: avatarUrl });

    return {
      success: true,
      message: "Cập nhật avatar thành công",
      avatarUrl: avatarUrl,
    };
  } catch (error: any) {
    console.error("Lỗi khi cập nhật avatar:", error);
    throw new Error(`Không thể cập nhật avatar: ${error.message}`);
  }
};

// ===============================
// 🔹 10. API để lấy URL avatar đầy đủ
// ===============================
export const getEmployeeAvatar = async (
  employeeId: number
): Promise<string | null> => {
  try {
    const employee = await EmployeeInformation.findByPk(employeeId, {
      attributes: ["avatar"],
    });

    if (!employee || !employee.avatar) {
      return null;
    }

    // Nếu avatar là relative path, chuyển thành full URL
    let avatarUrl = employee.avatar;
    if (avatarUrl.startsWith("/")) {
      avatarUrl = `${
        process.env.BASE_URL || "http://localhost:3000"
      }${avatarUrl}`;
    }

    return avatarUrl;
  } catch (error) {
    console.error("Lỗi khi lấy avatar:", error);
    return null;
  }
};

// 🟪 Hàm hỗ trợ - Chuyển đổi status
const getStatusText = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    active: "Đang làm việc",
    inactive: "Đã nghỉ việc",
    suspended: "Tạm ngừng",
    terminated: "Đã chấm dứt",
  };
  return statusMap[status] || status;
};

// 🟪 Hàm hỗ trợ - Chuyển đổi giới tính
const getGenderText = (gender: string): string => {
  const genderMap: { [key: string]: string } = {
    Male: "Nam",
    Female: "Nữ",
    Other: "Khác",
  };
  return genderMap[gender] || gender;
};

// 🟪 Hàm hỗ trợ - Chuyển đổi tình trạng hôn nhân
const getMaritalStatusText = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    SINGLE: "Độc thân",
    MARRIED: "Đã kết hôn",
    DIVORCED: "Ly dị",
    WIDOWED: "Góa",
  };
  return statusMap[status] || status;
};

// 🟪 Hàm hỗ trợ - Parse date từ Excel
const parseExcelDate = (dateStr: string): Date | null => {
  try {
    // Thử parse theo định dạng Việt Nam
    const viDateMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (viDateMatch) {
      const [_, day, month, year] = viDateMatch;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    // Thử parse theo ISO
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }

    return null;
  } catch {
    return null;
  }
};

// ===============================
// 🔹 11. Xuất danh sách nhân viên ra Excel - ĐÃ THÊM AVATAR
// ===============================
export const exportEmployeesToExcel = async (filter?: {
  departmentIds?: number[];
  positionIds?: number[];
  status?: string;
  search?: string;
}): Promise<ExcelJS.Workbook> => {
  try {
    console.log("Bắt đầu export nhân viên với filter:", filter);

    // 🟪 XÂY DỰNG WHERE CLAUSE
    let whereClause = "WHERE 1=1";
    const replacements: any = {};

    // Filter theo departmentIds
    if (filter?.departmentIds && filter.departmentIds.length > 0) {
      const validIds = filter.departmentIds
        .filter((id) => !isNaN(Number(id)))
        .map(Number);
      if (validIds.length > 0) {
        whereClause += " AND e.department_id IN (:departmentIds)";
        replacements.departmentIds = validIds;
      }
    }

    // Filter theo positionIds
    if (filter?.positionIds && filter.positionIds.length > 0) {
      const validIds = filter.positionIds
        .filter((id) => !isNaN(Number(id)))
        .map(Number);
      if (validIds.length > 0) {
        whereClause += " AND e.position_id IN (:positionIds)";
        replacements.positionIds = validIds;
      }
    }

    // Filter theo status
    if (filter?.status && filter.status.trim() !== "") {
      whereClause += " AND e.status = :status";
      replacements.status = filter.status.trim();
    }

    // Filter theo search
    if (filter?.search && filter.search.trim() !== "") {
      const searchQuery = `%${filter.search.trim()}%`;
      whereClause += ` AND (e.full_name ILIKE :search OR e.employee_code ILIKE :search OR e.email ILIKE :search)`;
      replacements.search = searchQuery;
    }

    console.log("Where clause:", whereClause);

    // 🟪 RAW QUERY ĐỂ LẤY DỮ LIỆU - ĐÃ THÊM AVATAR
    const query = `
      SELECT 
        e.id,
        e.employee_code as "employeeCode",
        e.full_name as "fullName",
        e.email,
        e.phone,
        e.avatar, -- ✅ THÊM AVATAR
        e.status,
        e.marital_status as "maritalStatus",
        e.number_of_dependents as "numberOfDependents",
        e.hire_date as "hireDate",
        e.created_at as "createdAt",
        d.name as "departmentName",
        p.name as "positionName",
        ep.date_of_birth as "dateOfBirth",
        ep.gender,
        ep.national_id as "nationalId",
        ep.address,
        ep.emergency_contact_name as "emergencyContactName",
        ep.emergency_contact_phone as "emergencyContactPhone",
        COUNT(ed.id) as "dependentCount",
        eb.account_number as "bankAccountNumber",
        eb.bank_name as "bankName",
        eb.account_holder as "accountHolder"
      FROM employee_information e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN positions p ON e.position_id = p.id
      LEFT JOIN employee_private_information ep ON e.id = ep.employee_id
      LEFT JOIN employee_dependents ed ON e.id = ed.employee_id AND ed.is_active = true
      LEFT JOIN employee_bank_accounts eb ON e.id = eb.employee_id AND eb.is_primary = true
      ${whereClause}
      GROUP BY 
        e.id, e.employee_code, e.full_name, e.email, e.phone, e.avatar, e.status, 
        e.marital_status, e.number_of_dependents, e.hire_date, e.created_at,
        d.name, p.name, ep.date_of_birth, ep.gender, ep.national_id, ep.address,
        ep.emergency_contact_name, ep.emergency_contact_phone,
        eb.account_number, eb.bank_name, eb.account_holder
      ORDER BY e.created_at DESC
    `;

    const employees: any[] = await sequelize.query(query, {
      replacements,
      type: "SELECT",
    });

    console.log(`✅ Tìm thấy ${employees.length} nhân viên`);

    // 🟪 TẠO WORKBOOK
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Danh sách nhân viên");

    // Định nghĩa columns - ĐÃ THÊM AVATAR
    worksheet.columns = [
      { header: "STT", key: "stt", width: 8 },
      { header: "Mã NV", key: "employeeCode", width: 15 },
      { header: "Họ và tên", key: "fullName", width: 25 },
      { header: "Avatar URL", key: "avatar", width: 30 }, // ✅ THÊM AVATAR
      { header: "Email", key: "email", width: 25 },
      { header: "Số điện thoại", key: "phone", width: 15 },
      { header: "Phòng ban", key: "departmentName", width: 20 },
      { header: "Chức vụ", key: "positionName", width: 20 },
      { header: "Ngày sinh", key: "dateOfBirth", width: 15 },
      { header: "Giới tính", key: "gender", width: 10 },
      { header: "CMND/CCCD", key: "nationalId", width: 15 },
      { header: "Địa chỉ", key: "address", width: 30 },
      { header: "Tình trạng hôn nhân", key: "maritalStatus", width: 15 },
      { header: "Số người phụ thuộc", key: "numberOfDependents", width: 15 },
      {
        header: "Số người phụ thuộc (thực tế)",
        key: "dependentCount",
        width: 15,
      },
      { header: "Ngày vào làm", key: "hireDate", width: 15 },
      { header: "Trạng thái", key: "status", width: 15 },
      { header: "Số tài khoản", key: "bankAccountNumber", width: 20 },
      { header: "Ngân hàng", key: "bankName", width: 20 },
      { header: "Chủ tài khoản", key: "accountHolder", width: 25 },
      { header: "Liên hệ khẩn cấp", key: "emergencyContactName", width: 20 },
      { header: "SĐT khẩn cấp", key: "emergencyContactPhone", width: 15 },
      { header: "Ngày tạo", key: "createdAt", width: 15 },
    ];

    // Style cho header
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "2E86AB" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };

    // 🟪 THÊM DỮ LIỆU
    employees.forEach((emp, index) => {
      const row = worksheet.addRow({
        stt: index + 1,
        employeeCode: emp.employeeCode || "N/A",
        fullName: emp.fullName || "N/A",
        avatar: emp.avatar || "Không có", // ✅ THÊM AVATAR
        email: emp.email || "N/A",
        phone: emp.phone || "N/A",
        departmentName: emp.departmentName || "N/A",
        positionName: emp.positionName || "N/A",
        dateOfBirth: emp.dateOfBirth
          ? new Date(emp.dateOfBirth).toLocaleDateString("vi-VN")
          : "N/A",
        gender: getGenderText(emp.gender),
        nationalId: emp.nationalId || "N/A",
        address: emp.address || "N/A",
        maritalStatus: getMaritalStatusText(emp.maritalStatus),
        numberOfDependents: emp.numberOfDependents || 0,
        dependentCount: emp.dependentCount || 0,
        hireDate: emp.hireDate
          ? new Date(emp.hireDate).toLocaleDateString("vi-VN")
          : "N/A",
        status: getStatusText(emp.status),
        bankAccountNumber: emp.bankAccountNumber || "N/A",
        bankName: emp.bankName || "N/A",
        accountHolder: emp.accountHolder || "N/A",
        emergencyContactName: emp.emergencyContactName || "N/A",
        emergencyContactPhone: emp.emergencyContactPhone || "N/A",
        createdAt: emp.createdAt
          ? new Date(emp.createdAt).toLocaleDateString("vi-VN")
          : "N/A",
      });

      // Căn giữa cho các ô
      row.eachCell((cell, colNumber) => {
        if (
          colNumber !== 4 &&
          colNumber !== 5 &&
          colNumber !== 11 &&
          colNumber !== 12
        ) {
          // Trừ cột avatar, email, địa chỉ, CMND
          cell.alignment = { vertical: "middle", horizontal: "center" };
        }
      });
    });

    // Căn trái cho các cột text dài
    worksheet.getColumn(4).alignment = {
      vertical: "middle",
      horizontal: "left",
    }; // Avatar
    worksheet.getColumn(5).alignment = {
      vertical: "middle",
      horizontal: "left",
    }; // Email
    worksheet.getColumn(11).alignment = {
      vertical: "middle",
      horizontal: "left",
    }; // CMND
    worksheet.getColumn(12).alignment = {
      vertical: "middle",
      horizontal: "left",
    }; // Địa chỉ

    // Auto filter
    if (employees.length > 0) {
      worksheet.autoFilter = {
        from: "A1",
        to: `W${employees.length + 1}`,
      };
    }

    console.log("✅ Xuất Excel nhân viên thành công");
    return workbook;
  } catch (error: any) {
    console.error("❌ Lỗi xuất Excel nhân viên:", error);
    throw new Error(`Không thể xuất file Excel: ${error.message}`);
  }
};

// 🟪 Xuất file Excel và trả về buffer
export const exportEmployeesToExcelBuffer = async (
  filter?: any
): Promise<Buffer> => {
  try {
    console.log("🟢 Bắt đầu exportEmployeesToExcelBuffer");
    console.log("Filter nhận được:", filter);

    const workbook = await exportEmployeesToExcel(filter);
    const buffer = await workbook.xlsx.writeBuffer();

    console.log("✅ Tạo buffer thành công");
    return Buffer.from(buffer);
  } catch (error: any) {
    console.error("❌ Lỗi xuất Excel buffer:", error);
    throw new Error(`Không thể tạo file Excel: ${error.message}`);
  }
};

// 🟪 Nhập nhân viên từ file Excel
export const importEmployeesFromExcel = async (
  fileBuffer: Buffer
): Promise<ImportResult> => {
  const results: ImportResult = {
    total: 0,
    success: 0,
    errors: [] as string[],
    duplicates: 0,
    updated: 0,
  };

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new Error("File Excel không có dữ liệu");
    }

    // Bắt đầu từ dòng 2 (bỏ qua header)
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);

      // Bỏ qua dòng trống
      if (!row.getCell(1).value && !row.getCell(2).value) continue;

      try {
        // Lấy dữ liệu từ các cell theo template
        const employeeCode = row.getCell(1).value?.toString().trim();
        const fullName = row.getCell(2).value?.toString().trim();
        const email = row.getCell(3).value?.toString().trim();
        const phone = row.getCell(4).value?.toString().trim();
        const departmentName = row.getCell(5).value?.toString().trim();
        const positionName = row.getCell(6).value?.toString().trim();
        const dateOfBirthStr = row.getCell(7).value?.toString().trim();
        const genderText = row.getCell(8).value?.toString().trim();
        const nationalId = row.getCell(9).value?.toString().trim();
        const address = row.getCell(10).value?.toString().trim();
        const maritalStatusText = row.getCell(11).value?.toString().trim();
        const hireDateStr = row.getCell(12).value?.toString().trim();
        const statusText = row.getCell(13).value?.toString().trim();

        // Validate dữ liệu bắt buộc
        if (!employeeCode || !fullName || !email) {
          results.errors.push(
            `Dòng ${rowNumber}: Thiếu thông tin bắt buộc (Mã NV, Họ tên, Email)`
          );
          continue;
        }

        // Parse dates
        const dateOfBirth = parseExcelDate(dateOfBirthStr);
        const hireDate = parseExcelDate(hireDateStr);

        // Map gender
        const genderMap: { [key: string]: string } = {
          nam: "Male",
          male: "Male",
          nữ: "Female",
          female: "Female",
          khác: "Other",
          other: "Other",
        };

        const gender = genderMap[genderText?.toLowerCase()] || "Male";

        // Map marital status
        const maritalStatusMap: { [key: string]: string } = {
          "độc thân": "SINGLE",
          single: "SINGLE",
          "đã kết hôn": "MARRIED",
          married: "MARRIED",
          "ly dị": "DIVORCED",
          divorced: "DIVORCED",
          góa: "WIDOWED",
          widowed: "WIDOWED",
        };

        const maritalStatus =
          maritalStatusMap[maritalStatusText?.toLowerCase()] || "SINGLE";

        // Map status
        const statusMap: { [key: string]: string } = {
          "đang làm việc": "active",
          active: "active",
          "đã nghỉ việc": "inactive",
          inactive: "inactive",
          "tạm ngừng": "suspended",
          suspended: "suspended",
          "chấm dứt": "terminated",
          terminated: "terminated",
        };

        const status = statusMap[statusText?.toLowerCase()] || "active";

        // Tìm department
        let departmentId = null;
        if (departmentName) {
          const department = await Department.findOne({
            where: { name: { [Op.iLike]: `%${departmentName}%` } },
          });
          if (department) {
            departmentId = department.id;
          } else {
            results.errors.push(
              `Dòng ${rowNumber}: Không tìm thấy phòng ban "${departmentName}"`
            );
          }
        }

        // Tìm position
        let positionId = null;
        if (positionName) {
          const position = await Position.findOne({
            where: { name: { [Op.iLike]: `%${positionName}%` } },
          });
          if (position) {
            positionId = position.id;
          } else {
            results.errors.push(
              `Dòng ${rowNumber}: Không tìm thấy chức vụ "${positionName}"`
            );
          }
        }

        // Kiểm tra trùng lặp theo employeeCode hoặc email
        const existingEmployee = await EmployeeInformation.findOne({
          where: {
            [Op.or]: [{ employeeCode }, { email }],
          },
        });

        const employeeData: any = {
          employeeCode,
          fullName,
          email,
          phone: phone || null,
          departmentId,
          positionId,
          hireDate: hireDate || new Date(),
          status,
        };

        const privateInfoData: any = {
          dateOfBirth,
          gender,
          nationalId: nationalId || null,
          address: address || null,
        };

        if (existingEmployee) {
          // Cập nhật nếu đã tồn tại
          await existingEmployee.update(employeeData);

          // Cập nhật private info
          const existingPrivateInfo = await EmployeePrivateInformation.findOne({
            where: { employeeId: existingEmployee.id },
          });

          if (existingPrivateInfo) {
            await existingPrivateInfo.update(privateInfoData);
          } else {
            await EmployeePrivateInformation.create({
              ...privateInfoData,
              employeeId: existingEmployee.id,
            });
          }

          results.updated++;
        } else {
          // Tạo mới
          const t = await sequelize.transaction();
          try {
            const newEmployee = await EmployeeInformation.create(employeeData, {
              transaction: t,
            });

            await EmployeePrivateInformation.create(
              {
                ...privateInfoData,
                employeeId: newEmployee.id,
              },
              { transaction: t }
            );

            await t.commit();
            results.success++;
          } catch (transactionError) {
            await t.rollback();
            throw transactionError;
          }
        }

        results.total++;
      } catch (rowError: any) {
        results.errors.push(`Dòng ${rowNumber}: ${rowError.message}`);
      }
    }

    return results;
  } catch (error: any) {
    console.error("Lỗi nhập Excel nhân viên:", error);
    throw new Error(`Lỗi nhập file: ${error.message}`);
  }
};

// 🟪 Tạo template Excel cho nhân viên
export const createEmployeeTemplate = async (): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Template nhân viên");

  // Header với màu sắc
  worksheet.columns = [
    { header: "Mã NV (*)", key: "employeeCode", width: 15 },
    { header: "Họ và tên (*)", key: "fullName", width: 25 },
    { header: "Email (*)", key: "email", width: 25 },
    { header: "Số điện thoại", key: "phone", width: 15 },
    { header: "Phòng ban", key: "departmentName", width: 20 },
    { header: "Chức vụ", key: "positionName", width: 20 },
    { header: "Ngày sinh", key: "dateOfBirth", width: 15 },
    { header: "Giới tính", key: "gender", width: 10 },
    { header: "CMND/CCCD", key: "nationalId", width: 15 },
    { header: "Địa chỉ", key: "address", width: 30 },
    { header: "Tình trạng hôn nhân", key: "maritalStatus", width: 15 },
    { header: "Ngày vào làm", key: "hireDate", width: 15 },
    { header: "Trạng thái", key: "status", width: 15 },
  ];

  // Style header
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "2E86AB" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };

  // Thêm dữ liệu mẫu
  const sampleData = [
    {
      employeeCode: "NV001",
      fullName: "Nguyễn Văn A",
      email: "nva@company.com",
      phone: "0901234567",
      departmentName: "Phòng Kinh doanh",
      positionName: "Nhân viên",
      dateOfBirth: "1990-01-15",
      gender: "Nam",
      nationalId: "001090001234",
      address: "Hà Nội",
      maritalStatus: "Đã kết hôn",
      hireDate: "2023-01-01",
      status: "Đang làm việc",
    },
    {
      employeeCode: "NV002",
      fullName: "Trần Thị B",
      email: "ttb@company.com",
      phone: "0907654321",
      departmentName: "Phòng Kỹ thuật",
      positionName: "Trưởng phòng",
      dateOfBirth: "1988-05-20",
      gender: "Nữ",
      nationalId: "001088005678",
      address: "TP HCM",
      maritalStatus: "Độc thân",
      hireDate: "2022-06-15",
      status: "Đang làm việc",
    },
  ];

  sampleData.forEach((data) => {
    worksheet.addRow(data);
  });

  // Thêm ghi chú
  worksheet.addRow([]);
  worksheet.addRow(["Ghi chú:"]);
  worksheet.addRow(["(*) : Thông tin bắt buộc"]);
  worksheet.addRow(["Giới tính: Nam / Nữ / Khác"]);
  worksheet.addRow([
    "Tình trạng hôn nhân: Độc thân / Đã kết hôn / Ly dị / Góa",
  ]);
  worksheet.addRow([
    "Trạng thái: Đang làm việc / Đã nghỉ việc / Tạm ngừng / Chấm dứt",
  ]);
  worksheet.addRow(["Phòng ban & Chức vụ: Phải tồn tại trong hệ thống"]);
  worksheet.addRow(["Định dạng ngày: YYYY-MM-DD hoặc DD/MM/YYYY"]);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

export const importFromExcel = async (
  buffer: Buffer
): Promise<{ success: number; updated: number; errors: string[] }> => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.getWorksheet(1);
  const results = {
    success: 0,
    updated: 0,
    errors: [] as string[],
  };

  if (!worksheet) {
    throw new Error("Không tìm thấy worksheet trong file Excel");
  }

  // Bỏ qua header row (row 1)
  for (let i = 2; i <= worksheet.rowCount; i++) {
    try {
      const row = worksheet.getRow(i);
      const code = row.getCell(1).value?.toString().trim();
      const name = row.getCell(2).value?.toString().trim();
      const managerName = row.getCell(3).value?.toString().trim();
      const description = row.getCell(5).value?.toString().trim();
      const status = row.getCell(6).value?.toString().trim();

      if (!name) {
        results.errors.push(`Dòng ${i}: Tên phòng ban là bắt buộc`);
        continue;
      }

      // Tìm manager bằng tên
      let managerId = null;
      if (managerName && managerName !== "Chưa có") {
        const manager = await EmployeeInformation.findOne({
          where: { fullName: { [Op.like]: `%${managerName}%` } },
        });
        if (manager) {
          managerId = manager.id;
        }
      }

      const departmentData: any = {
        name,
        code: code || undefined,
        description: description || undefined,
        manager_id: managerId,
        is_active: status === "Hoạt động",
      };

      // Kiểm tra xem department đã tồn tại chưa
      let existingDept = null;
      if (code) {
        existingDept = await Department.findOne({ where: { code } });
      }

      if (existingDept) {
        // Update existing
        await Department.update(departmentData, {
          where: { id: existingDept.id },
        });
        results.updated++;
      } else {
        // Create new
        await Department.create(departmentData);
        results.success++;
      }
    } catch (error: any) {
      results.errors.push(`Dòng ${i}: ${error.message}`);
    }
  }

  return results;
};

// Tạo template Excel - THÊM MỚI
export const createDepartmentTemplate = async (): Promise<ExcelJS.Buffer> => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Template phòng ban");

  // Add headers với màu sắc
  worksheet.columns = [
    { header: "Mã phòng ban", key: "code", width: 20 },
    { header: "Tên phòng ban (*)", key: "name", width: 30 },
    { header: "Trưởng phòng", key: "manager", width: 25 },
    { header: "Số nhân viên", key: "employeeCount", width: 15 },
    { header: "Mô tả", key: "description", width: 40 },
    { header: "Trạng thái", key: "status", width: 15 },
  ];

  // Add sample data
  worksheet.addRow({
    code: "DEP001",
    name: "Phòng Kỹ thuật",
    manager: "Nguyễn Văn A",
    employeeCount: 10,
    description: "Phụ trách phát triển sản phẩm",
    status: "Hoạt động",
  });

  // Style header
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "2E75B6" },
  };

  // Style sample row
  const sampleRow = worksheet.getRow(2);
  sampleRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "E6E6FA" },
  };

  return await workbook.xlsx.writeBuffer();
};
