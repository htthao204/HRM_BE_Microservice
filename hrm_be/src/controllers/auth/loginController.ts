import { Request, Response } from "express";
import { loginAccount } from "../../services/auth/loginService";

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    const { accessToken, refreshToken } = await loginAccount({
      username,
      password,
    });

    res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
};
