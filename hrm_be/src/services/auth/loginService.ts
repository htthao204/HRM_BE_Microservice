import bcrypt from "bcryptjs";
import { createAccessToken, createRefreshToken } from "./tokenService";
import { Account, Role, Permission, RefreshToken } from "../../models/index";

interface LoginPayload {
  username: string;
  password: string;
}

export const loginAccount = async ({ username, password }: LoginPayload) => {
  // 1. Tìm account + include role + permissions
  const account = await Account.findOne({
    where: { username },
    include: [
      {
        model: Role,
        as: "role", // PHẢI trùng
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

  // 2. So sánh mật khẩu
  const isMatch = await bcrypt.compare(password, account.password);
  if (!isMatch) throw new Error("Invalid username or password");

  // 3. Lấy role + permissions
  const roleName = account.role?.name ?? null;
  const roleNames = roleName ? [roleName] : [];
  const permissions = account.role?.permissions?.map((p: any) => p.name) || [];

  // 4. Tạo payload token
  const payload = {
    id: account.id,
    username: account.username,
    roles: roleNames,
    permissions,
  };

  const accessToken = createAccessToken(payload);
  const refreshToken = createRefreshToken(payload);

  // 5. Lưu refresh token
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await RefreshToken.create({
    token: refreshToken,
    accountId: account.id, // sửa AccountId -> accountId cho đúng tên field trong model
    expiresAt,
  });

  return { account, accessToken, refreshToken };
};
