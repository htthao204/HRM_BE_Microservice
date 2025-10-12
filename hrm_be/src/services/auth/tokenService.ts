import jwt from "jsonwebtoken";
import AccountModel from "../../models/accountModel";
import RefreshTokenModel from "../../models/refreshTokenModal";

// Tạo access token
export const createAccessToken = (payload: any) =>
  jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "1h" });

// Tạo refresh token
export const createRefreshToken = (account: any) =>
  jwt.sign(
    {
      id: account.id,
      username: account.username,
      roles: account.roles || [],
      permissions: account.permissions || [],
    },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: "7d" }
  );

// Tạo access token từ refresh token
export const refreshAccessToken = async (refreshToken: string) => {
  if (!refreshToken) throw new Error("No refresh token provided");

  const storedToken = await RefreshTokenModel.findOne({
    where: { token: refreshToken },
  });

  if (!storedToken) throw new Error("Invalid refresh token");

  if (new Date() > storedToken.expiresAt) {
    await storedToken.destroy();
    throw new Error("Refresh token expired");
  }

  const payload: any = jwt.verify(
    refreshToken,
    process.env.JWT_REFRESH_SECRET!
  );

  const account = await AccountModel.findByPk(payload.id, {
    include: [{ association: "role", include: ["permissions"] }],
  });
  if (!account) throw new Error("Account not found");

  // Chuẩn hóa payload
  const accessTokenPayload = {
    id: account.id,
    username: account.username,
    roles: account.role ? [account.role.name] : [],
    permissions: account.role
      ? account.role.permissions?.map((p: any) => p.name) || []
      : [],
  };

  const accessToken = createAccessToken(accessTokenPayload);
  return { accessToken };
};
