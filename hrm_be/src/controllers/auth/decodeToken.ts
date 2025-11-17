import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || "fallback-secret";

/**
 * ✅ Interface cho thông tin employee
 */
interface EmployeeInfo {
  id?: number;
  employeeCode?: string;
  fullName?: string;
  email?: string;
  position?: string;
  department?: string;
  status?: string;
}

/**
 * ✅ Interface cho decoded token
 */
interface DecodedToken extends JwtPayload {
  id: number;
  username: string;
  email?: string;
  roles: string[];
  permissions: string[];
  employee?: EmployeeInfo;
  // Hoặc có thể các field employee nằm trực tiếp trong token
  employeeId?: number;
  employeeCode?: string;
  fullName?: string;
  position?: string;
  department?: string;
}

/**
 * ✅ Hàm decode token để lấy thông tin người dùng và employee
 */
export const decodeToken = (token: string) => {
  try {
    const secret = ACCESS_TOKEN_SECRET;
    if (!secret) throw new Error("ACCESS_TOKEN_SECRET not configured");

    const decoded = jwt.verify(token, secret) as DecodedToken;

    console.log("🔍 Full decoded token:", decoded);
    console.log("🔍 Token keys:", Object.keys(decoded));

    // TRƯỜNG HỢP 1: Có object employee riêng
    if (decoded.employee) {
      return {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
        roles: decoded.roles || [],
        permissions: decoded.permissions || [],
        employee: {
          id: decoded.employee.id,
          employeeCode: decoded.employee.employeeCode,
          fullName: decoded.employee.fullName,
          email: decoded.employee.email,
          position: decoded.employee.position,
          department: decoded.employee.department,
          status: decoded.employee.status,
        },
        iat: decoded.iat,
        exp: decoded.exp,
      };
    }

    // TRƯỜNG HỢP 2: Thông tin employee nằm trực tiếp trong token
    if (decoded.employeeId || decoded.employeeCode) {
      return {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
        roles: decoded.roles || [],
        permissions: decoded.permissions || [],
        employee: {
          id: decoded.employeeId || decoded.id, // Fallback to user id
          employeeCode: decoded.employeeCode,
          fullName: decoded.fullName,
          email: decoded.email,
          position: decoded.position,
          department: decoded.department,
          status: decoded.status,
        },
        iat: decoded.iat,
        exp: decoded.exp,
      };
    }

    // TRƯỜNG HỢP 3: Chỉ có thông tin cơ bản
    return {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      roles: decoded.roles || [],
      permissions: decoded.permissions || [],
      employee: null, // Không có thông tin employee
      iat: decoded.iat,
      exp: decoded.exp,
    };
  } catch (error: any) {
    // CHI TIẾT HÓA LỖI
    if (error.name === "TokenExpiredError") {
      throw new Error("Token expired");
    } else if (error.name === "JsonWebTokenError") {
      throw new Error("Invalid token");
    } else {
      throw new Error("Invalid or expired token");
    }
  }
};

/**
 * ✅ Hàm debug token để xem cấu trúc
 */
export const debugToken = (token: string) => {
  try {
    const decoded = jwt.decode(token) as any;
    console.log("🐛 DEBUG TOKEN STRUCTURE:");
    console.log("📋 All keys:", Object.keys(decoded));
    console.log("🔍 Full payload:", decoded);

    // Kiểm tra các key có thể chứa thông tin employee
    const possibleEmployeeKeys = [
      "employee",
      "employeeId",
      "employeeCode",
      "empCode",
      "staffId",
      "fullName",
      "name",
      "position",
      "department",
      "title",
    ];

    possibleEmployeeKeys.forEach((key) => {
      if (decoded[key]) {
        console.log(`🎯 Found employee key "${key}":`, decoded[key]);
      }
    });

    return decoded;
  } catch (error) {
    console.error("❌ Debug token error:", error);
    return null;
  }
};
