// dto/search/EmployeeSearchDTO.ts

export interface EmployeeSearchDTO {
  fullName?: string; // lọc theo tên đầy đủ
  email?: string; // lọc theo email công việc
  phone?: string; // lọc theo số điện thoại
  hireDateFrom?: string; // lọc từ ngày tuyển dụng (yyyy-mm-dd)
  hireDateTo?: string; // lọc đến ngày tuyển dụng (yyyy-mm-dd)
  departmentId?: number; // lọc theo phòng ban
  positionId?: number; // lọc theo vị trí
  isDelete?: boolean; // lọc nhân viên đã xóa hay không

  // Thông tin private
  dateOfBirthFrom?: string; // lọc từ ngày sinh
  dateOfBirthTo?: string; // lọc đến ngày sinh
  gender?: "Male" | "Female" | "Other";
  nationalId?: string;
  emailPrivate?: string;
  phonePrivate?: string;
  countryId?: number;
  address?: string;

  // Thông tin ngân hàng
  bankName?: string;
  accountNumber?: string;
  owner?: string;
  accountType?: string;
}
