import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
import AccountModel from "../../models/accountModel";
import RefreshTokenModel from "../../models/refreshTokenModal";

//  Đảm bảo đọc .env trước khi dùng process.env
dotenv.config();

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET as string;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET as string;

if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
  console.error("❌ Missing JWT secrets in .env");
  throw new Error("Missing JWT secrets in .env");
}

/**
 *  Tạo Access Token
 */
export const createAccessToken = (payload: any) => {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: "2h" });
};

/**
 *  Tạo Refresh Token
 */
export const createRefreshToken = (payload: any) => {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
};

/**
 *  Giải mã Access Token → trả về payload
 */
export const verifyToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as JwtPayload;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};

/**
 *  Làm mới access token từ refresh token
 */
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

  const payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as JwtPayload;

  const account = await AccountModel.findByPk(payload.id, {
    include: [{ association: "role", include: ["permissions"] }],
  });

  if (!account) throw new Error("Account not found");

  const newAccessPayload = {
    id: account.id,
    username: account.username,
    roles: account.role ? [account.role.name] : [],
    permissions: account.role?.permissions?.map((p: any) => p.name) || [],
  };

  const accessToken = createAccessToken(newAccessPayload);
  return { accessToken };
};
