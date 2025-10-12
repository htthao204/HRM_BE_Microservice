import { Request, Response } from "express";
import { loginAccount } from "../../services/auth/loginService";
import Permission from "../../models/permissionModel";
import { Account } from "../../models/index";
// Kiểu trả về của Account
interface Role {
  name: string;
  permissions?: { name: string }[];
}

interface AccountType {
  id: number;
  username: string;
  role?: Role | null;
}

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body as {
      username: string;
      password: string;
    };

    const { account, accessToken, refreshToken } = await loginAccount({
      username,
      password,
    });

    // Lấy role và permissions
    const role = account.role?.get({ plain: true });
    const permissions = role?.permissions?.map((p: any) => p.name) || [];

    res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
      Account: {
        id: account.id,
        username: account.username,
        role: role?.name || null,
        permissions,
      },
    });
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
};
