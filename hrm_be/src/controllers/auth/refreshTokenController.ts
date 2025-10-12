import { Request, Response } from "express";
import { refreshAccessToken } from "../../services/auth/tokenService";

export const refreshToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };

    if (!refreshToken) {
      res.status(400).json({ message: "Refresh token is required" });
      return;
    }

    // Gọi service để tạo access token mới
    const { accessToken } = await refreshAccessToken(refreshToken);

    res.status(200).json({ accessToken });
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
};
