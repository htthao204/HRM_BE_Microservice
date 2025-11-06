// controllers/contractAmendmentController.ts
import { Request, Response, NextFunction } from "express";
import { ResultResponse } from "../dto/response/resultResponse";
import {
  getContractAmendmentsByFilter,
  getContractAmendmentsPaginated,
  getContractAmendmentById,
  createContractAmendment,
  updateContractAmendment,
  deleteContractAmendment,
  approveContractAmendment,
  getAmendmentsByContractId,
  exportContractAmendments,
} from "../services/contractAmendmentService";

// Lấy danh sách phụ lục hợp đồng có phân trang và filters
export const getContractAmendmentsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt((req.query.page as string) || "1");
    const pageSize = parseInt((req.query.pageSize as string) || "10");

    // Lấy filters từ query parameters
    const filters = {
      contractId: req.query.contractId
        ? parseInt(req.query.contractId as string)
        : undefined,
      amendmentNumber: req.query.amendmentNumber as string,
      amendmentType: req.query.amendmentType as string,
      status: req.query.status as string,
      effectiveDateFrom: req.query.effectiveDateFrom as string,
      effectiveDateTo: req.query.effectiveDateTo as string,
      employeeName: req.query.employeeName as string,
      contractNumber: req.query.contractNumber as string,
    };

    const result = await getContractAmendmentsByFilter(page, pageSize, filters);

    res.json(
      ResultResponse(
        true,
        200,
        null,
        "Lấy danh sách phụ lục hợp đồng thành công",
        {
          data: result.data,
          pagination: {
            currentPage: result.currentPage,
            totalPages: result.totalPages,
            totalItems: result.totalItems,
            pageSize: pageSize,
          },
        }
      )
    );
  } catch (err: any) {
    next(err);
  }
};

// Lấy phụ lục hợp đồng theo ID
export const getContractAmendmentByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const amendmentId = parseInt(req.params.id);

    // Validate ID
    if (isNaN(amendmentId)) {
      res
        .status(400)
        .json(
          ResultResponse(false, 400, null, "ID phụ lục hợp đồng không hợp lệ")
        );
      return;
    }

    const amendment = await getContractAmendmentById(amendmentId);

    if (!amendment) {
      res
        .status(404)
        .json(
          ResultResponse(false, 404, null, "Không tìm thấy phụ lục hợp đồng")
        );
      return;
    }

    res.json(
      ResultResponse(
        true,
        200,
        null,
        "Lấy phụ lục hợp đồng thành công",
        amendment
      )
    );
  } catch (err: any) {
    next(err);
  }
};

// Lấy phụ lục theo hợp đồng ID
export const getAmendmentsByContractIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const contractId = parseInt(req.params.contractId);

    // Validate ID
    if (isNaN(contractId)) {
      res
        .status(400)
        .json(ResultResponse(false, 400, null, "ID hợp đồng không hợp lệ"));
      return;
    }

    const amendments = await getAmendmentsByContractId(contractId);

    res.json(
      ResultResponse(
        true,
        200,
        null,
        "Lấy phụ lục theo hợp đồng thành công",
        amendments
      )
    );
  } catch (err: any) {
    next(err);
  }
};

// Tạo phụ lục hợp đồng mới
export const createContractAmendmentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const newAmendment = req.body;

    // Validation cơ bản
    if (
      !newAmendment.contractId ||
      !newAmendment.changeDescription ||
      !newAmendment.effectiveDate
    ) {
      res
        .status(400)
        .json(
          ResultResponse(
            false,
            400,
            null,
            "Hợp đồng, mô tả thay đổi và ngày hiệu lực là bắt buộc"
          )
        );
      return;
    }

    const createdAmendment = await createContractAmendment(newAmendment);
    res
      .status(201)
      .json(
        ResultResponse(
          true,
          201,
          null,
          "Tạo phụ lục hợp đồng thành công",
          createdAmendment
        )
      );
  } catch (err: any) {
    next(err);
  }
};

// Cập nhật phụ lục hợp đồng
export const updateContractAmendmentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const amendmentId = parseInt(req.params.id);
    const updateData = req.body;

    // Validate ID
    if (isNaN(amendmentId)) {
      res
        .status(400)
        .json(
          ResultResponse(false, 400, null, "ID phụ lục hợp đồng không hợp lệ")
        );
      return;
    }

    const updatedAmendment = await updateContractAmendment(
      amendmentId,
      updateData
    );
    res
      .status(200)
      .json(
        ResultResponse(
          true,
          200,
          null,
          "Cập nhật phụ lục hợp đồng thành công",
          updatedAmendment
        )
      );
  } catch (err: any) {
    next(err);
  }
};

// Xóa phụ lục hợp đồng
export const deleteContractAmendmentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const amendmentId = parseInt(req.params.id);

    // Validate ID
    if (isNaN(amendmentId)) {
      res
        .status(400)
        .json(
          ResultResponse(false, 400, null, "ID phụ lục hợp đồng không hợp lệ")
        );
      return;
    }

    const result = await deleteContractAmendment(amendmentId);

    res.status(200).json(ResultResponse(true, 200, null, result.message));
  } catch (err: any) {
    next(err);
  }
};

// Phê duyệt phụ lục hợp đồng
export const approveContractAmendmentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const amendmentId = parseInt(req.params.id);
    const { approvedBy, comments } = req.body;

    // Validate ID
    if (isNaN(amendmentId)) {
      res
        .status(400)
        .json(
          ResultResponse(false, 400, null, "ID phụ lục hợp đồng không hợp lệ")
        );
      return;
    }

    // Validate required fields
    if (!approvedBy) {
      res
        .status(400)
        .json(ResultResponse(false, 400, null, "Người phê duyệt là bắt buộc"));
      return;
    }

    const approvedAmendment = await approveContractAmendment(
      amendmentId,
      approvedBy,
      comments
    );
    res
      .status(200)
      .json(
        ResultResponse(
          true,
          200,
          null,
          "Phê duyệt phụ lục hợp đồng thành công",
          approvedAmendment
        )
      );
  } catch (err: any) {
    next(err);
  }
};

// Export phụ lục hợp đồng
export const exportContractAmendmentsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Lấy filters từ query parameters
    const filters = {
      contractId: req.query.contractId
        ? parseInt(req.query.contractId as string)
        : undefined,
      amendmentNumber: req.query.amendmentNumber as string,
      amendmentType: req.query.amendmentType as string,
      status: req.query.status as string,
    };

    const exportData = await exportContractAmendments(filters);

    res.json(
      ResultResponse(
        true,
        200,
        null,
        "Export phụ lục hợp đồng thành công",
        exportData
      )
    );
  } catch (err: any) {
    next(err);
  }
};
