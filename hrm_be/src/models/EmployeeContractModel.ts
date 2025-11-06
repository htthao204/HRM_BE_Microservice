// models/EmployeeContract.ts
import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/db";

interface EmployeeContractAttributes {
  id: number;
  employeeId: number;
  contractTypeId: number;
  contractNumber: string;
  contractName: string;
  startDate: Date;
  endDate?: Date | null;
  signDate: Date;
  workLocation?: string | null;
  positionId: number;
  departmentId: number;

  // Salary information
  baseSalary: number;
  salaryType?: string;
  probationPeriodDays?: number;
  probationSalary?: number | null;

  // Allowances
  positionAllowance?: number;
  responsibilityAllowance?: number;
  otherAllowances?: number;

  // Work information
  workingHoursPerWeek?: number;
  jobDescription?: string | null;
  responsibilities?: string | null;

  // Contract status
  status?: string;
  terminationDate?: Date | null;
  terminationReason?: string | null;

  // Signing information
  signedByEmployee?: boolean;
  signedByCompany?: boolean;
  companySignerId?: number | null;
  employeeSignedAt?: Date | null;
  companySignedAt?: Date | null;

  // Files
  contractFilePath?: string | null;
  attachmentPaths?: string[] | null;

  createdBy: number;
  updatedBy?: number | null;
  created_at?: Date;
  updated_at?: Date;
}

interface EmployeeContractCreationAttributes
  extends Optional<
    EmployeeContractAttributes,
    | "id"
    | "workLocation"
    | "salaryType"
    | "probationPeriodDays"
    | "probationSalary"
    | "positionAllowance"
    | "responsibilityAllowance"
    | "otherAllowances"
    | "workingHoursPerWeek"
    | "jobDescription"
    | "responsibilities"
    | "status"
    | "terminationDate"
    | "terminationReason"
    | "signedByEmployee"
    | "signedByCompany"
    | "companySignerId"
    | "employeeSignedAt"
    | "companySignedAt"
    | "contractFilePath"
    | "attachmentPaths"
    | "updatedBy"
    | "created_at"
    | "updated_at"
  > {}

export class EmployeeContract
  extends Model<EmployeeContractAttributes, EmployeeContractCreationAttributes>
  implements EmployeeContractAttributes
{
  declare id: number;
  declare employeeId: number;
  declare contractTypeId: number;
  declare contractNumber: string;
  declare contractName: string;
  declare startDate: Date;
  declare endDate?: Date | null;
  declare signDate: Date;
  declare workLocation?: string | null;
  declare positionId: number;
  declare departmentId: number;
  declare baseSalary: number;
  declare salaryType?: string;
  declare probationPeriodDays?: number;
  declare probationSalary?: number | null;
  declare positionAllowance?: number;
  declare responsibilityAllowance?: number;
  declare otherAllowances?: number;
  declare workingHoursPerWeek?: number;
  declare jobDescription?: string | null;
  declare responsibilities?: string | null;
  declare status?: string;
  declare terminationDate?: Date | null;
  declare terminationReason?: string | null;
  declare signedByEmployee?: boolean;
  declare signedByCompany?: boolean;
  declare companySignerId?: number | null;
  declare employeeSignedAt?: Date | null;
  declare companySignedAt?: Date | null;
  declare contractFilePath?: string | null;
  declare attachmentPaths?: string[] | null;
  declare createdBy: number;
  declare updatedBy?: number | null;
  declare created_at?: Date;
  declare updated_at?: Date;
}

EmployeeContract.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    employeeId: {
      field: "employee_id",
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    contractTypeId: {
      field: "contract_type_id",
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    contractNumber: {
      field: "contract_number",
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    contractName: {
      field: "contract_name",
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    startDate: {
      field: "start_date",
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    endDate: {
      field: "end_date",
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    signDate: {
      field: "sign_date",
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    workLocation: {
      field: "work_location",
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    positionId: {
      field: "position_id",
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    departmentId: {
      field: "department_id",
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    baseSalary: {
      field: "base_salary",
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    salaryType: {
      field: "salary_type",
      type: DataTypes.ENUM("monthly", "hourly", "daily", "project"),
      defaultValue: "monthly",
    },
    probationPeriodDays: {
      field: "probation_period_days",
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    probationSalary: {
      field: "probation_salary",
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    positionAllowance: {
      field: "position_allowance",
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    responsibilityAllowance: {
      field: "responsibility_allowance",
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    otherAllowances: {
      field: "other_allowances",
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    workingHoursPerWeek: {
      field: "working_hours_per_week",
      type: DataTypes.DECIMAL(4, 2),
      defaultValue: 40.0,
    },
    jobDescription: {
      field: "job_description",
      type: DataTypes.TEXT,
      allowNull: true,
    },
    responsibilities: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        "draft",
        "active",
        "expired",
        "terminated",
        "cancelled"
      ),
      defaultValue: "draft",
    },
    terminationDate: {
      field: "termination_date",
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    terminationReason: {
      field: "termination_reason",
      type: DataTypes.TEXT,
      allowNull: true,
    },
    signedByEmployee: {
      field: "signed_by_employee",
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    signedByCompany: {
      field: "signed_by_company",
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    companySignerId: {
      field: "company_signer_id",
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    employeeSignedAt: {
      field: "employee_signed_at",
      type: DataTypes.DATE,
      allowNull: true,
    },
    companySignedAt: {
      field: "company_signed_at",
      type: DataTypes.DATE,
      allowNull: true,
    },
    contractFilePath: {
      field: "contract_file_path",
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    attachmentPaths: {
      field: "attachment_paths",
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
    createdBy: {
      field: "created_by",
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    updatedBy: {
      field: "updated_by",
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "employee_contracts",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default EmployeeContract;
