import bcrypt from "bcryptjs";
import { createAccessToken, createRefreshToken } from "./tokenService";
import { Account, Role, Permission, RefreshToken } from "../../models";

interface LoginPayload {
  username: string;
  password: string;
}

/**
 * ✅ Đăng nhập tài khoản
 */
export const loginAccount = async ({ username, password }: LoginPayload) => {
  const account = await Account.findOne({
    where: { username },
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

  if (!account) throw new Error("Invalid username or password");

  const isMatch = await bcrypt.compare(password, account.password);
  if (!isMatch) throw new Error("Invalid username or password");

  const roleNames = account.role ? [account.role.name] : [];
  const permissions = account.role?.permissions?.map((p: any) => p.name) || [];

  const payload = {
    id: account.id,
    username: account.username,
    roles: roleNames,
    permissions,
  };

  const accessToken = createAccessToken(payload);
  const refreshToken = createRefreshToken(payload);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await RefreshToken.create({
    token: refreshToken,
    accountId: account.id,
    expiresAt,
  });

  return { account, accessToken, refreshToken };
};
