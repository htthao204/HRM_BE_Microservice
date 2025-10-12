import { Request, Response, NextFunction } from "express";
import { ResultResponse } from "../dto/response/resultResponse";

export interface CustomError extends Error {
  statusCode?: number;
  errorCode?: string | null;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error(err.stack);

  const response = ResultResponse(
    false,
    err.statusCode || 500,
    err.message || "Internal Server Error",
    err.errorCode || null
  );

  res.status(response.statusCode).json(response);
};
