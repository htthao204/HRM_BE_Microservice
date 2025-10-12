import { Request, Response, NextFunction } from "express";

// Mở rộng Request để có Account
interface AuthenticatedRequest extends Request {
  Account?: {
    id: number;
    username: string;
    roles: string[];
    permissions: string[];
  };
}

export const authorize = (requiredPermission: string) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Response | void => {
    const accountPermissions = req.Account?.permissions || [];

    // Check quyền tổng hợp, ví dụ "department_all"
    const [module] = requiredPermission.split("_");
    const allPermission = `${module}_all`;

    if (
      accountPermissions.includes(requiredPermission) ||
      accountPermissions.includes(allPermission)
    ) {
      return next();
    }

    return res.status(403).json({
      message: "Forbidden: insufficient permission",
    });
  };
};
