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

  console.log("🔍 Auth header:", authHeader?.substring(0, 20) + "...");

  if (!authHeader?.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Not authorized, no token provided" });
  }

  const token = authHeader.split(" ")[1];

  // SỬA: Dùng ACCESS_TOKEN_SECRET thay vì JWT_SECRET
  const secret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;

  if (!secret) {
    console.error("❌ ACCESS_TOKEN_SECRET not configured");
    return res.status(500).json({ message: "Server config error" });
  }

  console.log(
    "🔑 Verifying token with secret:",
    secret ? "✓ Configured" : "✗ Missing"
  );

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;

    console.log(" Token decoded successfully for user:", decoded.username);

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
    console.error("🔴 JWT verify error:", err.message);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    } else if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token signature" });
    } else {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  }
};
