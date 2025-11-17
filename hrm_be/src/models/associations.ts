// associations.ts - ADD NOTIFICATION ASSOCIATIONS
import Role from "./roleModel";
import Permission from "./permissionModel";
import Department from "./departmentModel";
import {
  EmployeeBankAccount,
  EmployeeDependent,
  EmployeeInformation,
  EmployeePrivateInformation,
} from "./employeeModel";
import Account from "./accountModel";
import SalaryType from "./salaryTypeModel";
import SalaryStructure from "./salaryStructureModel";
import Payroll from "./payrollModel";
import SalaryHistoryDetail from "./salaryHistoryDetailModel";
import AttendanceSummary from "./attendanceSummaryModel";
import PayrollReport from "./payrollReport";
import ReportConfiguration from "./reportConfigurationModel";
import EmployeePositionHistory from "./employeePositionHistoryModel";
import Position from "./positionModel";
import EmployeeShiftAssignment from "./employeeShiftAssignmentModel";
import WorkShift from "./workShiftModel";
import AttendanceLog from "./attendanceLogModel";
import OvertimeRequest from "./overtimeRequestModel";
import AttendanceApproval from "./attendanceApprovalModel";
import Attendance from "./attendanceModel";
import { LeaveType } from "./leaveTypeModel";
import { Leave } from "./leaveModel";
import CalculationRule from "./calculationRule";
import CalculationRuleParameter from "./calculationRuleParameter";
import PayrollCalculationLog from "./payrollCalculationLogsModel";
import LateEarlyRule from "./lateEarlyRuleModel";
import ContractHistory from "./ContractHistoryModel";
import EmployeeContract from "./EmployeeContractModel";
import ContractAmendment from "./ContractAmendmentModel";
import ContractType from "./ContractTypeModel";

// Import các model thông báo mới
import Notification from "./NotificationModel";
import NotificationReadStatus from "./NotificationReadStatusModel";
import NotificationTemplate from "./NotificationTemplateModel";
import NotificationSetting from "./NotificationSettingModel";

export function setupAssociations() {
  // ==================== RBAC ASSOCIATIONS ====================

  Role.belongsToMany(Permission, {
    through: "role_permissions",
    foreignKey: "role_id",
    otherKey: "permission_id",
    as: "permissions", // thêm alias
  });

  Permission.belongsToMany(Role, {
    through: "role_permissions",
    foreignKey: "permission_id",
    otherKey: "role_id",
    as: "roles", // optional
  });

  // ==================== ACCOUNT & EMPLOYEE ASSOCIATIONS ====================
  Account.belongsTo(Role, {
    foreignKey: "role_id",
    as: "role",
  });

  Account.belongsTo(EmployeeInformation, {
    foreignKey: "id",
    as: "employeeAccountInfo",
  });

  EmployeeInformation.hasOne(Account, {
    foreignKey: "id",
    as: "employeeAccount",
  });

  // ==================== DEPARTMENT ASSOCIATIONS ====================
  Department.belongsTo(EmployeeInformation, {
    foreignKey: "manager_id",
    as: "departmentManager",
  });

  Department.hasMany(Department, {
    foreignKey: "parent_id",
    as: "subDepartments",
  });

  Department.belongsTo(Department, {
    foreignKey: "parent_id",
    as: "parentDepartment",
  });

  EmployeeInformation.belongsTo(Department, {
    foreignKey: "department_id",
    as: "employeeDepartment",
  });

  Department.hasMany(EmployeeInformation, {
    foreignKey: "department_id",
    as: "departmentEmployees",
  });

  // ==================== POSITION ASSOCIATIONS ====================
  EmployeeInformation.belongsTo(Position, {
    foreignKey: "position_id",
    as: "employeePosition",
  });

  Position.hasMany(EmployeeInformation, {
    foreignKey: "position_id",
    as: "positionEmployees",
  });

  // ==================== EMPLOYEE DETAIL ASSOCIATIONS ====================
  EmployeeInformation.hasOne(EmployeePrivateInformation, {
    foreignKey: "employee_id",
    as: "privateInfo",
  });

  EmployeePrivateInformation.belongsTo(EmployeeInformation, {
    foreignKey: "employee_id",
    as: "infoEmployee",
  });

  EmployeeInformation.hasMany(EmployeeBankAccount, {
    foreignKey: "employee_id",
    as: "bankAccounts",
  });

  EmployeeBankAccount.belongsTo(EmployeeInformation, {
    foreignKey: "employee_id",
    as: "accountEmployee",
  });

  EmployeeInformation.hasMany(EmployeeDependent, {
    foreignKey: "employee_id",
    as: "dependents",
  });

  EmployeeDependent.belongsTo(EmployeeInformation, {
    foreignKey: "employee_id",
    as: "dependentEmployee",
  });

  // ==================== ATTENDANCE & SHIFT ASSOCIATIONS ====================
  // Attendance associations
  Attendance.belongsTo(EmployeeInformation, {
    foreignKey: "employee_id",
    as: "attendanceEmployee",
  });

  Attendance.belongsTo(WorkShift, {
    foreignKey: "work_shift_id",
    as: "attendanceWorkShift",
  });

  EmployeeInformation.hasMany(Attendance, {
    foreignKey: "employee_id",
    as: "employeeAttendances",
  });

  WorkShift.hasMany(Attendance, {
    foreignKey: "work_shift_id",
    as: "shiftAttendances",
  });

  // AttendanceLog associations
  AttendanceLog.belongsTo(EmployeeInformation, {
    foreignKey: "employee_id",
    as: "logEmployee",
  });

  EmployeeInformation.hasMany(AttendanceLog, {
    foreignKey: "employee_id",
    as: "employeeAttendanceLogs",
  });

  // Shift assignments
  EmployeeInformation.hasMany(EmployeeShiftAssignment, {
    foreignKey: "employee_id",
    as: "shiftAssignments",
  });

  WorkShift.hasMany(EmployeeShiftAssignment, {
    foreignKey: "work_shift_id",
    as: "assignedEmployees",
  });

  EmployeeShiftAssignment.belongsTo(EmployeeInformation, {
    foreignKey: "employee_id",
    as: "assignmentEmployee",
  });

  EmployeeShiftAssignment.belongsTo(WorkShift, {
    foreignKey: "work_shift_id",
    as: "assignedWorkShift",
  });

  EmployeeShiftAssignment.belongsTo(EmployeeInformation, {
    foreignKey: "approved_by",
    as: "shiftApprover",
  });

  // ==================== OVERTIME ASSOCIATIONS ====================
  OvertimeRequest.belongsTo(EmployeeInformation, {
    foreignKey: "employee_id",
    as: "overtimeEmployee",
  });

  OvertimeRequest.belongsTo(WorkShift, {
    foreignKey: "work_shift_id",
    as: "overtimeWorkShift",
  });

  OvertimeRequest.belongsTo(EmployeeInformation, {
    foreignKey: "approved_by",
    as: "overtimeApprover",
  });

  EmployeeInformation.hasMany(OvertimeRequest, {
    foreignKey: "employee_id",
    as: "employeeOvertimeRequests",
  });

  WorkShift.hasMany(OvertimeRequest, {
    foreignKey: "work_shift_id",
    as: "shiftOvertimeRequests",
  });

  EmployeeInformation.hasMany(OvertimeRequest, {
    foreignKey: "approved_by",
    as: "approvedOvertimeRequests",
  });

  // ==================== ATTENDANCE APPROVAL ASSOCIATIONS ====================
  AttendanceApproval.belongsTo(Attendance, {
    foreignKey: "attendance_id",
    as: "approvalAttendance",
  });

  AttendanceApproval.belongsTo(EmployeeInformation, {
    foreignKey: "approver_id",
    as: "approvalApprover",
  });

  Attendance.hasMany(AttendanceApproval, {
    foreignKey: "attendance_id",
    as: "attendanceApprovals",
  });

  EmployeeInformation.hasMany(AttendanceApproval, {
    foreignKey: "approver_id",
    as: "employeeAttendanceApprovals",
  });

  // ==================== LEAVE ASSOCIATIONS ====================
  Leave.belongsTo(EmployeeInformation, {
    foreignKey: "employee_id",
    as: "leaveEmployee",
  });

  Leave.belongsTo(LeaveType, {
    foreignKey: "leave_type_id",
    as: "leaveType",
  });

  Leave.belongsTo(EmployeeInformation, {
    foreignKey: "approved_by",
    as: "leaveApprover",
  });

  EmployeeInformation.hasMany(Leave, {
    foreignKey: "employee_id",
    as: "employeeLeaves",
  });

  LeaveType.hasMany(Leave, {
    foreignKey: "leave_type_id",
    as: "typeLeaves",
  });

  EmployeeInformation.hasMany(Leave, {
    foreignKey: "approved_by",
    as: "approvedLeaves",
  });

  // ==================== SALARY & PAYROLL ASSOCIATIONS ====================
  // Salary Structure
  SalaryStructure.belongsTo(EmployeeInformation, {
    foreignKey: "employee_id",
    as: "structureEmployee",
  });

  SalaryStructure.belongsTo(SalaryType, {
    foreignKey: "salary_type_id",
    as: "salaryType",
  });

  EmployeeInformation.hasMany(SalaryStructure, {
    foreignKey: "employee_id",
    as: "employeeSalaryStructures",
  });

  SalaryType.hasMany(SalaryStructure, {
    foreignKey: "salary_type_id",
    as: "typeSalaryStructures",
  });

  // Payroll
  Payroll.belongsTo(EmployeeInformation, {
    foreignKey: "employee_id",
    as: "payrollEmployee",
  });

  Payroll.belongsTo(EmployeeInformation, {
    foreignKey: "approved_by",
    as: "payrollApprover",
  });

  EmployeeInformation.hasMany(Payroll, {
    foreignKey: "employee_id",
    as: "employeePayrolls",
  });

  // Salary History Details
  SalaryHistoryDetail.belongsTo(EmployeeInformation, {
    foreignKey: "employee_id",
    as: "detailEmployee",
  });

  SalaryHistoryDetail.belongsTo(Payroll, {
    foreignKey: "payroll_id",
    as: "payroll",
  });

  SalaryHistoryDetail.belongsTo(SalaryType, {
    foreignKey: "salary_type_id",
    as: "salaryType",
  });

  EmployeeInformation.hasMany(SalaryHistoryDetail, {
    foreignKey: "employee_id",
    as: "employeeSalaryHistory",
  });

  Payroll.hasMany(SalaryHistoryDetail, {
    foreignKey: "payroll_id",
    as: "payrollSalaryDetails",
  });

  SalaryType.hasMany(SalaryHistoryDetail, {
    foreignKey: "salary_type_id",
    as: "typeSalaryHistory",
  });

  // Payroll Calculation Logs
  PayrollCalculationLog.belongsTo(Payroll, {
    foreignKey: "payroll_id",
    as: "calculationPayroll",
  });

  Payroll.hasMany(PayrollCalculationLog, {
    foreignKey: "payroll_id",
    as: "payrollCalculationLogs",
  });

  // ==================== CALCULATION RULES ASSOCIATIONS ====================
  CalculationRuleParameter.belongsTo(CalculationRule, {
    foreignKey: "rule_id",
    as: "calculationRule",
  });

  CalculationRule.hasMany(CalculationRuleParameter, {
    foreignKey: "rule_id",
    as: "ruleParameters",
  });

  // ==================== ATTENDANCE SUMMARY ASSOCIATIONS ====================
  AttendanceSummary.belongsTo(EmployeeInformation, {
    foreignKey: "employee_id",
    as: "summaryEmployee",
  });

  EmployeeInformation.hasMany(AttendanceSummary, {
    foreignKey: "employee_id",
    as: "employeeAttendanceSummaries",
  });

  // ==================== REPORT ASSOCIATIONS ====================
  // Payroll Reports
  PayrollReport.belongsTo(Department, {
    foreignKey: "department_id",
    as: "reportDepartment",
  });

  PayrollReport.belongsTo(EmployeeInformation, {
    foreignKey: "generated_by",
    as: "reportGenerator",
  });

  Department.hasMany(PayrollReport, {
    foreignKey: "department_id",
    as: "departmentPayrollReports",
  });

  EmployeeInformation.hasMany(PayrollReport, {
    foreignKey: "generated_by",
    as: "generatedPayrollReports",
  });

  // Report Configurations
  ReportConfiguration.belongsTo(EmployeeInformation, {
    foreignKey: "created_by",
    as: "configCreator",
  });

  EmployeeInformation.hasMany(ReportConfiguration, {
    foreignKey: "created_by",
    as: "employeeReportConfigs",
  });

  // ==================== EMPLOYEE HISTORY ASSOCIATIONS ====================
  EmployeePositionHistory.belongsTo(EmployeeInformation, {
    foreignKey: "employee_id",
    as: "historyEmployee",
  });

  EmployeePositionHistory.belongsTo(Position, {
    foreignKey: "position_id",
    as: "historyPosition",
  });

  EmployeePositionHistory.belongsTo(Department, {
    foreignKey: "department_id",
    as: "historyDepartment",
  });

  EmployeePositionHistory.belongsTo(EmployeeInformation, {
    foreignKey: "created_by",
    as: "historyCreator",
  });

  EmployeeInformation.hasMany(EmployeePositionHistory, {
    foreignKey: "employee_id",
    as: "employeePositionHistory",
  });

  Position.hasMany(EmployeePositionHistory, {
    foreignKey: "position_id",
    as: "positionEmployeeHistory",
  });

  Department.hasMany(EmployeePositionHistory, {
    foreignKey: "department_id",
    as: "departmentEmployeeHistory",
  });

  EmployeeInformation.hasMany(EmployeePositionHistory, {
    foreignKey: "created_by",
    as: "createdPositionHistories",
  });

  LateEarlyRule.belongsTo(Department, {
    foreignKey: "department_id",
    as: "department",
  });
  LateEarlyRule.belongsTo(Position, {
    foreignKey: "position_id",
    as: "position",
  });
  LateEarlyRule.belongsTo(EmployeeInformation, {
    foreignKey: "employee_id",
    as: "employee",
  });
  LateEarlyRule.belongsTo(EmployeeInformation, {
    foreignKey: "created_by",
    as: "creator",
  });
  LateEarlyRule.belongsTo(EmployeeInformation, {
    foreignKey: "updated_by",
    as: "updater",
  });

  // ==================== CONTRACT ASSOCIATIONS ====================
  EmployeeContract.belongsTo(ContractType, {
    foreignKey: "contractTypeId",
    as: "contractType",
  });

  EmployeeContract.belongsTo(EmployeeInformation, {
    foreignKey: "employeeId",
    as: "employee",
  });
  EmployeeContract.belongsTo(EmployeeInformation, {
    foreignKey: "companySignerId",
    as: "companySigner",
  });

  EmployeeContract.belongsTo(Position, {
    foreignKey: "positionId",
    as: "position",
  });

  EmployeeContract.belongsTo(Department, {
    foreignKey: "departmentId",
    as: "department",
  });

  // Trong ContractAmendment model
  ContractAmendment.belongsTo(EmployeeContract, {
    foreignKey: "contractId",
    as: "amendmentContract",
  });

  ContractHistory.belongsTo(EmployeeContract, {
    foreignKey: "contractId",
    as: "historyContract",
  });

  // ==================== NOTIFICATION ASSOCIATIONS ====================

  // Notification associations
  Notification.belongsTo(EmployeeInformation, {
    foreignKey: "sender_id",
    as: "sender",
  });

  Notification.belongsTo(EmployeeInformation, {
    foreignKey: "created_by",
    as: "creator",
  });

  Notification.belongsTo(EmployeeInformation, {
    foreignKey: "updated_by",
    as: "updater",
  });

  // Notification với các bảng khác dựa trên recipient_type
  Notification.belongsTo(Department, {
    foreignKey: "recipient_id",
    constraints: false,
    as: "recipientDepartment",
    scope: {
      recipient_type: "department",
    },
  });

  Notification.belongsTo(Role, {
    foreignKey: "recipient_id",
    constraints: false,
    as: "recipientRole",
    scope: {
      recipient_type: "role",
    },
  });

  Notification.belongsTo(EmployeeInformation, {
    foreignKey: "recipient_id",
    constraints: false,
    as: "recipientEmployee",
    scope: {
      recipient_type: "individual",
    },
  });

  EmployeeInformation.hasMany(Notification, {
    foreignKey: "sender_id",
    as: "sentNotifications",
  });

  EmployeeInformation.hasMany(Notification, {
    foreignKey: "created_by",
    as: "createdNotifications",
  });

  EmployeeInformation.hasMany(Notification, {
    foreignKey: "updated_by",
    as: "updatedNotifications",
  });

  // NotificationReadStatus associations
  NotificationReadStatus.belongsTo(Notification, {
    foreignKey: "notification_id",
    as: "notification",
  });

  NotificationReadStatus.belongsTo(EmployeeInformation, {
    foreignKey: "employee_id",
    as: "employee",
  });

  Notification.hasMany(NotificationReadStatus, {
    foreignKey: "notification_id",
    as: "readStatuses",
  });

  EmployeeInformation.hasMany(NotificationReadStatus, {
    foreignKey: "employee_id",
    as: "notificationReadStatuses",
  });

  // NotificationTemplate associations
  NotificationTemplate.belongsTo(EmployeeInformation, {
    foreignKey: "created_by",
    as: "creator",
  });

  NotificationTemplate.belongsTo(EmployeeInformation, {
    foreignKey: "updated_by",
    as: "updater",
  });

  EmployeeInformation.hasMany(NotificationTemplate, {
    foreignKey: "created_by",
    as: "createdTemplates",
  });

  EmployeeInformation.hasMany(NotificationTemplate, {
    foreignKey: "updated_by",
    as: "updatedTemplates",
  });

  // NotificationSetting associations
  NotificationSetting.belongsTo(EmployeeInformation, {
    foreignKey: "employee_id",
    as: "employee",
  });

  EmployeeInformation.hasOne(NotificationSetting, {
    foreignKey: "employee_id",
    as: "notificationSettings",
  });

  // ==================== ADDITIONAL NOTIFICATION RELATIONSHIPS ====================

  // Department có thể có nhiều notifications (khi recipient_type = 'department')
  Department.hasMany(Notification, {
    foreignKey: "recipient_id",
    constraints: false,
    as: "departmentNotifications",
    scope: {
      recipient_type: "department",
    },
  });

  // Role có thể có nhiều notifications (khi recipient_type = 'role')
  Role.hasMany(Notification, {
    foreignKey: "recipient_id",
    constraints: false,
    as: "roleNotifications",
    scope: {
      recipient_type: "role",
    },
  });

  // Employee có thể có nhiều notifications (khi recipient_type = 'individual')
  EmployeeInformation.hasMany(Notification, {
    foreignKey: "recipient_id",
    constraints: false,
    as: "individualNotifications",
    scope: {
      recipient_type: "individual",
    },
  });

  console.log("✅ All associations have been set up successfully!");
}
