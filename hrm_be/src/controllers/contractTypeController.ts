// controllers/contractTypeController.ts
import { Request, Response, NextFunction } from "express";
import { ResultResponse } from "../dto/response/resultResponse";
import {
  getContractTypesByFilter,
  getContractTypesPaginated,
  getContractTypeById,
  createContractType,
  updateContractType,
  deleteContractType,
  getAllActiveContractTypes,
  exportContractTypes,
} from "../services/contractTypeService";

// Lấy danh sách loại hợp đồng có phân trang và filters
export const getContractTypesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt((req.query.page as string) || "1");
    const pageSize = parseInt((req.query.pageSize as string) || "10");

    // Lấy filters từ query parameters
    const filters = {
      name: req.query.name as string,
      code: req.query.code as string,
      isActive: req.query.isActive ? req.query.isActive === "true" : undefined,
      isRenewable: req.query.isRenewable
        ? req.query.isRenewable === "true"
        : undefined,
    };

    const result = await getContractTypesByFilter(page, pageSize, filters);

    res.json(
      ResultResponse(
        true,
        200,
        null,
        "Lấy danh sách loại hợp đồng thành công",
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

// Lấy tất cả loại hợp đồng (cho dropdown)
export const getAllActiveContractTypesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const contractTypes = await getAllActiveContractTypes();

    res.json(
      ResultResponse(
        true,
        200,
        null,
        "Lấy danh sách loại hợp đồng thành công",
        contractTypes
      )
    );
  } catch (err: any) {
    next(err);
  }
};

// Lấy loại hợp đồng theo ID
export const getContractTypeByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const contractTypeId = parseInt(req.params.id);

    // Validate ID
    if (isNaN(contractTypeId)) {
      res
        .status(400)
        .json(
          ResultResponse(false, 400, null, "ID loại hợp đồng không hợp lệ")
        );
      return;
    }

    const contractType = await getContractTypeById(contractTypeId);

    if (!contractType) {
      res
        .status(404)
        .json(ResultResponse(false, 404, null, "Không tìm thấy loại hợp đồng"));
      return;
    }

    res.json(
      ResultResponse(
        true,
        200,
        null,
        "Lấy loại hợp đồng thành công",
        contractType
      )
    );
  } catch (err: any) {
    next(err);
  }
};

// Tạo loại hợp đồng mới
export const createContractTypeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const newContractType = req.body;

    // Validation cơ bản
    if (!newContractType.name || !newContractType.code) {
      res
        .status(400)
        .json(
          ResultResponse(
            false,
            400,
            null,
            "Tên và mã loại hợp đồng là bắt buộc"
          )
        );
      return;
    }

    const createdContractType = await createContractType(newContractType);
    res
      .status(201)
      .json(
        ResultResponse(
          true,
          201,
          null,
          "Tạo loại hợp đồng thành công",
          createdContractType
        )
      );
  } catch (err: any) {
    next(err);
  }
};

// Cập nhật loại hợp đồng
export const updateContractTypeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const contractTypeId = parseInt(req.params.id);
    const updateData = req.body;

    // Validate ID
    if (isNaN(contractTypeId)) {
      res
        .status(400)
        .json(
          ResultResponse(false, 400, null, "ID loại hợp đồng không hợp lệ")
        );
      return;
    }

    const updatedContractType = await updateContractType(
      contractTypeId,
      updateData
    );
    res
      .status(200)
      .json(
        ResultResponse(
          true,
          200,
          null,
          "Cập nhật loại hợp đồng thành công",
          updatedContractType
        )
      );
  } catch (err: any) {
    next(err);
  }
};

// Xóa loại hợp đồng
export const deleteContractTypeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const contractTypeId = parseInt(req.params.id);

    // Validate ID
    if (isNaN(contractTypeId)) {
      res
        .status(400)
        .json(
          ResultResponse(false, 400, null, "ID loại hợp đồng không hợp lệ")
        );
      return;
    }

    const result = await deleteContractType(contractTypeId);

    res.status(200).json(ResultResponse(true, 200, null, result.message));
  } catch (err: any) {
    next(err);
  }
};

// Export loại hợp đồng
export const exportContractTypesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Lấy filters từ query parameters
    const filters = {
      name: req.query.name as string,
      code: req.query.code as string,
      isActive: req.query.isActive ? req.query.isActive === "true" : undefined,
      isRenewable: req.query.isRenewable
        ? req.query.isRenewable === "true"
        : undefined,
    };

    const exportData = await exportContractTypes(filters);

    res.json(
      ResultResponse(
        true,
        200,
        null,
        "Export loại hợp đồng thành công",
        exportData
      )
    );
  } catch (err: any) {
    next(err);
  }
};
