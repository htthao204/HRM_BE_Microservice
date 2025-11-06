import {
  AccountResponse,
  IAccountResponse,
} from "../dto/response/accountResponse";
import Account from "../models/accountModel";
import Permission from "../models/permissionModel";
import Role from "../models/roleModel";

export const getAllAccounts = async (): Promise<IAccountResponse[]> => {
  const accounts = await Account.findAll({
    include: [
      {
        model: Role,
        as: "role",
        include: [
          { model: Permission, as: "permissions", through: { attributes: [] } },
        ],
      },
    ],
  });

  return accounts.map(AccountResponse);
};

export const getAccountById = async (
  id: number
): Promise<IAccountResponse | null> => {
  const account = await Account.findByPk(id, {
    include: [
      {
        model: Role,
        as: "role",
        include: [
          { model: Permission, as: "permissions", through: { attributes: [] } },
        ],
      },
    ],
  });

  return account ? AccountResponse(account) : null;
};
export const deleteAccount = async (id: number): Promise<number> => {
  const deletedCount = await Account.destroy({
    where: { id },
  });
  return deletedCount;
};
