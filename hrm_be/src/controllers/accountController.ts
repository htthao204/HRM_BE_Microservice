import { Request, Response, NextFunction } from "express";
import { ResultResponse } from "../dto/response/resultResponse";
import { deleteAccount, getAllAccounts } from "../services/accountService";
import { decodeToken } from "./auth/decodeToken";

// Lấy danh sách tất cả Account
export const getAllAccountsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const accounts = await getAllAccounts();
    res.json(ResultResponse(true, 200, null, null, accounts, accounts.length));
  } catch (err: any) {
    next(err);
  }
};

// Xóa Account theo id
export const deleteAccountController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, "ID của Account không được để trống"));
    }

    const deletedCount = await deleteAccount(id);

    if (deletedCount === 0) {
      return res
        .status(404)
        .json(ResultResponse(false, 404, "Không tìm thấy Account để xóa"));
    }

    return res.json(
      ResultResponse(true, 200, null, `Xóa account thành công`, null)
    );
  } catch (err: any) {
    next(err);
  }
};
export const getMe = (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token missing or invalid" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const user = decodeToken(token);
    return res.json({ success: true, user });
  } catch (error: any) {
    return res.status(401).json({ message: error.message });
  }
};
