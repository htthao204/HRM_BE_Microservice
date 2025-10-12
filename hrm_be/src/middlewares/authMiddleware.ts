import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

interface AuthenticatedRequest extends Request {
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
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

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
    console.log("JWT verify error:", err.message);
    return res.status(401).json({ message: "Token invalid or expired" });
  }
};
