import Account from "../models/accountModel";
import Role from "../models/roleModel";
import Permission from "../models/permissionModel";
import { AccountResponse } from "../dto/response/accountResponse";

// Trả về danh sách account với role và permissions
export const getAllAccounts = async (): Promise<
  ReturnType<typeof AccountResponse>[]
> => {
  const accounts = await Account.findAll({
    include: [
      {
        model: Role,
        as: "role",
        include: [
          {
            model: Permission,
            as: "permissions",
            through: { attributes: [] },
          },
        ],
      },
    ],
  });

  return accounts.map(AccountResponse);
};

// Xóa account theo id
export const deleteAccount = async (id: number): Promise<number> => {
  try {
    const deletedCount = await Account.destroy({ where: { id } });
    return deletedCount;
  } catch (error: unknown) {
    console.error(error);
    if (error instanceof Error)
      throw new Error("Xóa Account thất bại: " + error.message);
    throw new Error("Xóa Account thất bại");
  }
};
