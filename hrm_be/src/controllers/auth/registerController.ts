import { Request, Response } from "express";
import { registerAccount } from "../../services/auth/registerService";
import Account from "../../models/accountModel";
import Role from "../../models/roleModel";

interface RegisterRequestBody {
  username: string;
  password: string;
  roleId: number;
}

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, roleId } = req.body as RegisterRequestBody;
    console.log("Register request body:", req.body);

    // 1. Tạo Account mới
    const newAccount = await registerAccount({ username, password, roleId });
    console.log("Newly created account:", newAccount);

    // 2. Lấy account kèm role
    const accountWithRole = await Account.findByPk(newAccount.id, {
      include: [{ model: Role, as: "role" }],
    });

    // 3. Trả về response có roleId và roleName
    res.status(201).json({
      message: "Account registered successfully",
      Account: {
        id: accountWithRole!.id,
        username: accountWithRole!.username,
        roleId: accountWithRole!.role ? accountWithRole!.role.id : null,
        roleName: accountWithRole!.role ? accountWithRole!.role.name : null,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Register error:", error.message);
      res.status(400).json({ message: error.message });
    } else {
      res.status(400).json({ message: "Unknown error" });
    }
  }
};
