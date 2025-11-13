import { Request, Response, NextFunction } from "express";
import overtimeRequestService from "../services/overtimeRequestService";
import { ResultResponse } from "../dto/response/resultResponse";

// ==============================
// 🔹 GET /overtime-requests
// ==============================
export const getOvertimeRequestsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await overtimeRequestService.getAll(req.query);
    return res.json(
      ResultResponse(true, 200, null, null, result.data, result.total)
    );
  } catch (err) {
    next(err);
  }
};

// ==============================
// 🔹 GET /overtime-requests/:id
// ==============================
export const getOvertimeRequestByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    const result = await overtimeRequestService.getById(id);
    return res.json(ResultResponse(true, 200, null, null, result));
  } catch (err) {
    next(err);
  }
};

// ==============================
// 🔹 POST /overtime-requests
// ==============================
export const createOvertimeRequestController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body;
    const newRecord = await overtimeRequestService.create(data);
    return res
      .status(201)
      .json(
        ResultResponse(
          true,
          201,
          null,
          "Tạo yêu cầu tăng ca thành công",
          newRecord
        )
      );
  } catch (err) {
    next(err);
  }
};

// ==============================
// 🔹 PUT /overtime-requests/:id
// ==============================
export const updateOvertimeRequestController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    const data = req.body;
    const updated = await overtimeRequestService.update(id, data);

    return res.json(
      ResultResponse(
        true,
        200,
        null,
        "Cập nhật yêu cầu tăng ca thành công",
        updated
      )
    );
  } catch (err) {
    next(err);
  }
};

// ==============================
// 🔹 DELETE /overtime-requests/:id
// ==============================
export const deleteOvertimeRequestController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    await overtimeRequestService.delete(id);
    return res.json(
      ResultResponse(true, 200, null, "Xóa yêu cầu tăng ca thành công")
    );
  } catch (err) {
    next(err);
  }
};

// ==============================
// 🔹 POST /overtime-requests/:id/approve (PHÊ DUYỆT ĐƠN GIẢN)
// ==============================
export const approveOvertimeRequestController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    const { approverId } = req.body;
    const updated = await overtimeRequestService.approve(
      id,
      Number(approverId)
    );

    return res.json(
      ResultResponse(
        true,
        200,
        null,
        "Phê duyệt yêu cầu tăng ca thành công",
        updated
      )
    );
  } catch (err) {
    next(err);
  }
};

// ==============================
// 🔹 POST /overtime-requests/:id/approve-with-transaction (PHÊ DUYỆT VỚI TRANSACTION)
// ==============================
export const approveOvertimeRequestWithTransactionController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    const { approverId, notes } = req.body;

    const result = await overtimeRequestService.approveSingle(
      id,
      Number(approverId),
      notes
    );

    if (!result.success) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, result.message, null, null));
    }

    return res.json(
      ResultResponse(true, 200, null, result.message, result.data)
    );
  } catch (err) {
    next(err);
  }
};

// ==============================
// 🔹 POST /overtime-requests/bulk-approve (PHÊ DUYỆT NHIỀU)
// ==============================
export const approveMultipleOvertimeRequestsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ids, approverId, notes } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json(
          ResultResponse(false, 400, "Danh sách ID không hợp lệ", null, null)
        );
    }

    const result = await overtimeRequestService.approveMultiple(
      ids,
      Number(approverId),
      notes
    );

    if (!result.success) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, result.message, null, null));
    }

    return res.json(
      ResultResponse(true, 200, null, result.message, result.data)
    );
  } catch (err) {
    next(err);
  }
};

// ==============================
// 🔹 POST /overtime-requests/approve-all (PHÊ DUYỆT TẤT CẢ)
// ==============================
export const approveAllOvertimeRequestsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { approverId, notes, departmentId, fromDate, toDate } = req.body;

    const result = await overtimeRequestService.approveAll(
      Number(approverId),
      { departmentId, fromDate, toDate },
      notes
    );

    if (!result.success) {
      return res
        .status(400)
        .json(ResultResponse(false, 400, result.message, null, null));
    }

    return res.json(
      ResultResponse(true, 200, null, result.message, result.data)
    );
  } catch (err) {
    next(err);
  }
};

// ==============================
// 🔹 POST /overtime-requests/:id/reject
// ==============================
export const rejectOvertimeRequestController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    const { approverId, notes } = req.body;
    const updated = await overtimeRequestService.reject(
      id,
      Number(approverId),
      notes
    );

    return res.json(
      ResultResponse(
        true,
        200,
        null,
        "Từ chối yêu cầu tăng ca thành công",
        updated
      )
    );
  } catch (err) {
    next(err);
  }
};

// ==============================
// 🔹 POST /overtime-requests/:id/complete
// ==============================
export const completeOvertimeRequestController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    const { actualHours, notes } = req.body;
    const updated = await overtimeRequestService.complete(
      id,
      Number(actualHours),
      notes
    );

    return res.json(
      ResultResponse(true, 200, null, "Đánh dấu hoàn thành thành công", updated)
    );
  } catch (err) {
    next(err);
  }
};
