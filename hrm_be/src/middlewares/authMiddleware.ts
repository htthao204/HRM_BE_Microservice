import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export interface AuthenticatedRequest extends Request {
  Account?: {
    id: number;
    username: string;
    roles: string[];
    permissions: string[];
  };
}

export const authentication = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Response | void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Not authorized, no token provided" });
  }

  const token = authHeader.split(" ")[1];
  const secret = process.env.JWT_SECRET; // ✅ Lấy trực tiếp từ .env

  if (!secret) {
    console.error("❌ JWT_SECRET not configured");
    return res.status(500).json({ message: "Server config error" });
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;

    req.Account = {
      id: decoded.id as number,
      username: decoded.username as string,
      roles: Array.isArray(decoded.roles) ? decoded.roles : [],
      permissions: Array.isArray(decoded.permissions)
        ? decoded.permissions
        : [],
    };

    next();
  } catch (err: any) {
    console.error("JWT verify error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
