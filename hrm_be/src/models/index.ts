// src/models/index.ts
import Account from "./accountModel";
import Role from "./roleModel";
import Permission from "./permissionModel";
import RefreshToken from "./refreshTokenModal";
import {
  EmployeeBankAccount,
  EmployeeInformation,
  EmployeePrivateInformation,
} from "./employeeModel";
import Department from "./departmentModel";
import Country from "./countryModel";
import Position from "./positionModel";

// Account ↔ Role (1-N)
Account.belongsTo(Role, { foreignKey: "roleId", as: "role" });
Role.hasMany(Account, { foreignKey: "roleId", as: "accounts" });

Role.belongsToMany(Permission, {
  through: "role_permissions",
  foreignKey: "role_id",
  otherKey: "permission_id",
  as: "permissions",
});

Permission.belongsToMany(Role, {
  through: "role_permissions",
  foreignKey: "permission_id",
  otherKey: "role_id",
  as: "roles",
});

// RefreshToken ↔ Account (N-1)
RefreshToken.belongsTo(Account, { foreignKey: "account_id" });
Account.hasMany(RefreshToken, {
  foreignKey: "account_id",
  as: "refreshTokens",
});

// Employee ↔ Department & Position
EmployeeInformation.belongsTo(Department, {
  foreignKey: "department_id",
  as: "department",
});
EmployeeInformation.belongsTo(Position, {
  foreignKey: "position_id",
  as: "position",
});

// Employee ↔ PrivateInfo (1-1)
EmployeeInformation.hasOne(EmployeePrivateInformation, {
  foreignKey: "employee_id",
  as: "privateInfo",
});

EmployeePrivateInformation.belongsTo(EmployeeInformation, {
  foreignKey: "employee_id",
  as: "employee",
});

// EmployeePrivateInfo ↔ Country (N-1)
EmployeePrivateInformation.belongsTo(Country, {
  foreignKey: "country_id",
  as: "country",
});

// Employee ↔ BankAccounts (1-N)
EmployeeInformation.hasMany(EmployeeBankAccount, {
  foreignKey: "employee_id",
  as: "bankAccounts",
});
EmployeeBankAccount.belongsTo(EmployeeInformation, {
  foreignKey: "employee_id",
});

// Employee ↔ Account (1-1)
EmployeeInformation.belongsTo(Account, {
  foreignKey: "account_id",
  as: "account",
});
Account.hasOne(EmployeeInformation, {
  foreignKey: "account_id",
  as: "employee",
});

// ========================
//  Export tất cả model
// ========================
export {
  Account,
  Role,
  Permission,
  RefreshToken,
  EmployeeInformation,
  EmployeePrivateInformation,
  EmployeeBankAccount,
  Department,
  Country,
  Position,
};
