import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

// ==============================
// EmployeeInformation
// ==============================
interface EmployeeInformationAttributes {
  id: number;
  fullName: string;
  email: string;
  accountId?: number;
  phone?: string;
  hireDate?: Date;
  departmentId?: number;
  positionId?: number;
  avatar?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface EmployeeInformationCreation
  extends Optional<EmployeeInformationAttributes, "id"> {}
export class EmployeeInformation
  extends Model<EmployeeInformationAttributes, EmployeeInformationCreation>
  implements EmployeeInformationAttributes
{
  declare id: number;
  declare fullName: string;
  declare email: string;
  declare accountId?: number;
  declare phone?: string;
  declare hireDate?: Date;
  declare departmentId?: number;
  declare positionId?: number;
  declare avatar?: string;
  declare created_at?: Date;
  declare updated_at?: Date;
}
EmployeeInformation.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    fullName: { type: DataTypes.STRING, allowNull: false, field: "full_name" },
    email: {
      type: DataTypes.STRING,
      unique: true,
      validate: { isEmail: true },
    },
    accountId: { type: DataTypes.INTEGER, field: "account_id", unique: true },
    phone: { type: DataTypes.STRING(20) },
    hireDate: { type: DataTypes.DATEONLY, field: "hire_date" },
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
    avatar: { type: DataTypes.STRING(255), allowNull: true },
  },
  {
    sequelize,
    tableName: "employee_information",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// ==============================
// EmployeePrivateInformation
// ==============================
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
  created_at?: Date;
  updated_at?: Date;
}

interface EmployeePrivateCreation
  extends Optional<EmployeePrivateAttributes, "id"> {}

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
  declare created_at?: Date;
  declare updated_at?: Date;
}

EmployeePrivateInformation.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    employeeId: {
      field: "employee_id",
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    dateOfBirth: { field: "date_of_birth", type: DataTypes.DATEONLY },
    gender: { type: DataTypes.ENUM("Male", "Female", "Other") },
    nationalId: { field: "national_id", type: DataTypes.STRING(20) },
    emailPrivate: {
      field: "email_private",
      type: DataTypes.STRING(100),
      validate: { isEmail: true },
    },
    phonePrivate: { field: "phone_private", type: DataTypes.STRING(20) },
    countryId: { field: "country_id", type: DataTypes.INTEGER },
    address: { type: DataTypes.STRING(255) },
  },
  {
    sequelize,
    tableName: "employee_private_information",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

interface EmployeeBankAttributes {
  id: number;
  employeeId: number;
  bankName?: string;
  accountNumber?: string;
  owner?: string;
  accountType?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface EmployeeBankCreation extends Optional<EmployeeBankAttributes, "id"> {}

export class EmployeeBankAccount
  extends Model<EmployeeBankAttributes, EmployeeBankCreation>
  implements EmployeeBankAttributes
{
  declare id: number;
  declare employeeId: number;
  declare bankName?: string;
  declare accountNumber?: string;
  declare owner?: string;
  declare accountType?: string;
  declare created_at?: Date;
  declare updated_at?: Date;
}

EmployeeBankAccount.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    employeeId: {
      field: "employee_id",
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    bankName: { field: "bank_name", type: DataTypes.STRING(100) },
    accountNumber: { field: "account_number", type: DataTypes.STRING(50) },
    owner: { type: DataTypes.STRING(100) },
    accountType: { field: "account_type", type: DataTypes.STRING(20) },
  },
  {
    sequelize,
    tableName: "employee_bank_accounts",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);
