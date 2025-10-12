import { Request, Response, NextFunction } from "express";
import { ResultResponse } from "../dto/response/resultResponse";
import { getAllEmployeeInfor } from "../services/employeeService";

export const getAllEmployeeInforController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt((req.query.page as string) || "1");
    const pageSize = parseInt((req.query.pageSize as string) || "10");

    const result = await getAllEmployeeInfor(page, pageSize);

    res.json(
      ResultResponse(true, 200, null, null, result.data, result.totalItems)
    );
  } catch (err: any) {
    next(err);
  }
};
