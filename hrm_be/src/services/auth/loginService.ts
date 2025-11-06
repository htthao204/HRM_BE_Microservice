import bcrypt from "bcryptjs";
import Account from "../../models/accountModel";
import Role from "../../models/roleModel";
import Permission from "../../models/permissionModel";
import RefreshToken from "../../models/refreshTokenModal";
import { createAccessToken, createRefreshToken } from "./tokenService";

interface LoginPayload {
  username: string;
  password: string;
}

export const loginAccount = async ({ username, password }: LoginPayload) => {
  // 1️⃣ Lấy account kèm role và permission
  const account = await Account.findOne({
    where: { username },
    include: [
      {
        model: Role,
        as: "role", // trùng alias Account.belongsTo(Role)
        include: [
          {
            model: Permission,
            as: "permissions", // trùng alias Role.belongsToMany(Permission)
            through: { attributes: [] },
          },
        ],
      },
    ],
  });

  if (!account) throw new Error("Invalid username or password");

  // 2️⃣ So sánh mật khẩu
  const isMatch = await bcrypt.compare(password, account.password);
  if (!isMatch) throw new Error("Invalid username or password");

  // 3️⃣ Chuẩn bị payload cho token
  const roleNames = account.role ? [account.role.name] : [];
  const permissions = account.role?.permissions?.map((p) => p.name) || [];

  const payload = {
    id: account.id,
    username: account.username,
    roles: roleNames,
    permissions,
  };

  // 4️⃣ Tạo token
  const accessToken = createAccessToken(payload);
  const refreshToken = createRefreshToken(payload);

  // 5️⃣ Lưu refresh token
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 ngày

  await RefreshToken.create({
    token: refreshToken,
    accountId: account.id,
    expiresAt,
  });

  // 6️⃣ Trả về
  return { account, accessToken, refreshToken };
};
