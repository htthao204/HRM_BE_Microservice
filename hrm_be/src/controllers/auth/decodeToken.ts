import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
import { ACCESS_TOKEN_SECRET } from "../../server";

dotenv.config();

/**
 * ✅ Hàm decode token để lấy thông tin người dùng từ token
 */
export const decodeToken = (token: string) => {
  try {
    const secret = ACCESS_TOKEN_SECRET;
    if (!secret) throw new Error("ACCESS_TOKEN_SECRET not configured");

    const decoded = jwt.verify(token, secret) as JwtPayload;
    return {
      id: decoded.id,
      username: decoded.username,
      roles: decoded.roles || [],
      permissions: decoded.permissions || [],
      iat: decoded.iat,
      exp: decoded.exp,
    };
  } catch {
    throw new Error("Invalid or expired token");
  }
};
