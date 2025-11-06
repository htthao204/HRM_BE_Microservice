export interface IResultResponse<T = any> {
  success: boolean;
  statusCode: number;
  message?: string | null;
  errorMessage?: string | null;
  errorCode?: string | null;
  data?: T | null;
  totalItem?: number | null;
}

export const ResultResponse = <T = any>(
  success: boolean = true,
  statusCode: number,
  errorMessage?: string | null,
  errorCode: string | null = null,
  data: T | null = null,
  totalItem?: number | null // optional
): IResultResponse<T> => {
  const res: IResultResponse<T> = {
    success,
    statusCode,
    errorCode,
    errorMessage,
    data,
  };

  if (totalItem !== undefined && totalItem !== null) {
    res.totalItem = totalItem;
  }

  return res;
};
