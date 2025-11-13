import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

// ==============================
// EmployeeInformation
// ==============================
interface EmployeeInformationAttributes {
  id: number;
  employeeCode: string;
  fullName: string;
  email?: string;
  phone?: string;
  departmentId?: number;
  positionId?: number;
  hireDate?: Date;
  accountId?: number;
  avatar?: string;
  status?: "active" | "inactive" | "suspended" | "terminated";
  maritalStatus?: "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED"; // ✅ THÊM
  numberOfDependents?: number; // ✅ THÊM
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

interface EmployeeInformationCreation
  extends Optional<
    EmployeeInformationAttributes,
    | "id"
    | "createdAt"
    | "updatedAt"
    | "deletedAt"
    | "status"
    | "maritalStatus"
    | "numberOfDependents"
  > {}

export class EmployeeInformation
  extends Model<EmployeeInformationAttributes, EmployeeInformationCreation>
  implements EmployeeInformationAttributes
{
  declare id: number;
  declare employeeCode: string;
  declare fullName: string;
  declare email?: string;
  declare phone?: string;
  declare departmentId?: number;
  declare positionId?: number;
  declare hireDate?: Date;
  declare accountId?: number;
  declare avatar?: string;
  declare status?: "active" | "inactive" | "suspended" | "terminated";
  declare maritalStatus?: "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED"; // ✅ THÊM
  declare numberOfDependents?: number; // ✅ THÊM
  declare createdAt?: Date;
  declare updatedAt?: Date;
  declare deletedAt?: Date;
}

EmployeeInformation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    employeeCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      field: "employee_code",
    },
    fullName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "full_name",
    },
    email: {
      type: DataTypes.STRING(100),
      unique: true,
      validate: { isEmail: true },
    },
    phone: {
      type: DataTypes.STRING(20),
    },
    departmentId: {
      type: DataTypes.INTEGER,
      field: "department_id",
      allowNull: true,
    },
    positionId: {
      type: DataTypes.INTEGER,
      field: "position_id",
      allowNull: true,
    },
    hireDate: {
      type: DataTypes.DATEONLY,
      field: "hire_date",
    },
    accountId: {
      type: DataTypes.INTEGER,
      field: "account_id",
      unique: true,
      allowNull: true,
    },
    avatar: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive", "suspended", "terminated"),
      defaultValue: "active",
    },
    maritalStatus: {
      // ✅ THÊM
      type: DataTypes.ENUM("SINGLE", "MARRIED", "DIVORCED", "WIDOWED"),
      defaultValue: "SINGLE",
      field: "marital_status",
    },
    numberOfDependents: {
      // ✅ THÊM
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "number_of_dependents",
    },
    createdAt: {
      type: DataTypes.DATE,
      field: "created_at",
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: "updated_at",
    },
    deletedAt: {
      type: DataTypes.DATE,
      field: "deleted_at",
    },
  },
  {
    sequelize,
    tableName: "employee_information",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: true,
    deletedAt: "deleted_at",
  }
);

interface EmployeePrivateAttributes {
  id: number;
  employeeId: number;
  dateOfBirth?: Date;
  gender?: "Male" | "Female" | "Other";
  nationalId?: string;
  emailPrivate?: string;
  phonePrivate?: string;
  countryId?: number;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface EmployeePrivateCreation
  extends Optional<
    EmployeePrivateAttributes,
    "id" | "createdAt" | "updatedAt"
  > {}

export class EmployeePrivateInformation
  extends Model<EmployeePrivateAttributes, EmployeePrivateCreation>
  implements EmployeePrivateAttributes
{
  declare id: number;
  declare employeeId: number;
  declare dateOfBirth?: Date;
  declare gender?: "Male" | "Female" | "Other";
  declare nationalId?: string;
  declare emailPrivate?: string;
  declare phonePrivate?: string;
  declare countryId?: number;
  declare address?: string;
  declare emergencyContactName?: string;
  declare emergencyContactPhone?: string;
  declare createdAt?: Date;
  declare updatedAt?: Date;
}

EmployeePrivateInformation.init(
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
      references: {
        model: "employee_information",
        key: "id",
      },
    },
    dateOfBirth: {
      field: "date_of_birth",
      type: DataTypes.DATEONLY,
    },
    gender: {
      type: DataTypes.ENUM("Male", "Female", "Other"),
    },
    nationalId: {
      field: "national_id",
      type: DataTypes.STRING(20),
    },
    emailPrivate: {
      field: "email_private",
      type: DataTypes.STRING(100),
      validate: { isEmail: true },
    },
    phonePrivate: {
      field: "phone_private",
      type: DataTypes.STRING(20),
    },
    countryId: {
      field: "country_id",
      type: DataTypes.INTEGER,
      references: {
        model: "countries",
        key: "id",
      },
    },
    address: {
      type: DataTypes.STRING(255),
    },
    emergencyContactName: {
      field: "emergency_contact_name",
      type: DataTypes.STRING(100),
    },
    emergencyContactPhone: {
      field: "emergency_contact_phone",
      type: DataTypes.STRING(20),
    },
    createdAt: {
      type: DataTypes.DATE,
      field: "created_at",
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: "updated_at",
    },
  },
  {
    sequelize,
    tableName: "employee_private_information",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// ==============================
// EmployeeBankAccount
// ==============================
interface EmployeeBankAttributes {
  id: number;
  employeeId: number;
  bankName?: string;
  bankCode?: string;
  accountNumber?: string;
  accountHolder?: string;
  accountType?: "savings" | "checking" | "current";
  isPrimary?: boolean;
  branch?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface EmployeeBankCreation
  extends Optional<
    EmployeeBankAttributes,
    "id" | "createdAt" | "updatedAt" | "isPrimary"
  > {}

export class EmployeeBankAccount
  extends Model<EmployeeBankAttributes, EmployeeBankCreation>
  implements EmployeeBankAttributes
{
  declare id: number;
  declare employeeId: number;
  declare bankName?: string;
  declare bankCode?: string;
  declare accountNumber?: string;
  declare accountHolder?: string;
  declare accountType?: "savings" | "checking" | "current";
  declare isPrimary?: boolean;
  declare branch?: string;
  declare createdAt?: Date;
  declare updatedAt?: Date;
}

EmployeeBankAccount.init(
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
      references: {
        model: "employee_information",
        key: "id",
      },
    },
    bankName: {
      field: "bank_name",
      type: DataTypes.STRING(100),
    },
    bankCode: {
      field: "bank_code",
      type: DataTypes.STRING(20),
    },
    accountNumber: {
      field: "account_number",
      type: DataTypes.STRING(50),
    },
    accountHolder: {
      field: "account_holder",
      type: DataTypes.STRING(100),
    },
    accountType: {
      field: "account_type",
      type: DataTypes.ENUM("savings", "checking", "current"),
      defaultValue: "savings",
    },
    isPrimary: {
      field: "is_primary",
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    branch: {
      type: DataTypes.STRING(100),
    },
    createdAt: {
      type: DataTypes.DATE,
      field: "created_at",
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: "updated_at",
    },
  },
  {
    sequelize,
    tableName: "employee_bank_accounts",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);
interface EmployeeDependentAttributes {
  id: number;
  employeeId: number;
  fullName: string;
  relationship: "SPOUSE" | "CHILD" | "PARENT" | "OTHER";
  dateOfBirth?: Date;
  nationalId?: string;
  taxRegistration?: boolean;
  isActive?: boolean; // ✅ THÊM
  effectiveDate: Date;
  endDate?: Date;
  createdAt?: Date;
  updatedAt?: Date; // ✅ THÊM
}

export class EmployeeDependent extends Model<
  EmployeeDependentAttributes,
  Optional<
    EmployeeDependentAttributes,
    "id" | "createdAt" | "updatedAt" | "isActive"
  >
> {
  declare id: number;
  declare employeeId: number;
  declare fullName: string;
  declare relationship: "SPOUSE" | "CHILD" | "PARENT" | "OTHER";
  declare dateOfBirth?: Date;
  declare nationalId?: string;
  declare taxRegistration?: boolean;
  declare isActive?: boolean; // ✅ THÊM
  declare effectiveDate: Date;
  declare endDate?: Date;
  declare createdAt?: Date;
  declare updatedAt?: Date; // ✅ THÊM
}

EmployeeDependent.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "employee_information", key: "id" },
      field: "employee_id",
    },
    fullName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "full_name",
    },
    relationship: {
      type: DataTypes.ENUM("SPOUSE", "CHILD", "PARENT", "OTHER"),
      allowNull: false,
    },
    dateOfBirth: { type: DataTypes.DATEONLY, field: "date_of_birth" },
    nationalId: { type: DataTypes.STRING(20), field: "national_id" },
    taxRegistration: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "tax_registration",
    },
    isActive: {
      // ✅ THÊM
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_active",
    },
    effectiveDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "effective_date",
    },
    endDate: { type: DataTypes.DATEONLY, allowNull: true, field: "end_date" },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "created_at",
    },
    updatedAt: {
      // ✅ THÊM
      type: DataTypes.DATE,
      field: "updated_at",
    },
  },
  {
    sequelize,
    tableName: "employee_dependents",
    timestamps: true, // ✅ ĐỔI thành true
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default EmployeeInformation;
