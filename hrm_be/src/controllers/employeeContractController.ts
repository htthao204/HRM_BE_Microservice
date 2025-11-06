// controllers/employeeContractController.ts
import { Request, Response, NextFunction } from "express";
import { ResultResponse } from "../dto/response/resultResponse";
import {
  getEmployeeContractsByFilter,
  getEmployeeContractsPaginated,
  getEmployeeContractById,
  createEmployeeContract,
  updateEmployeeContract,
  deleteEmployeeContract,
  getContractsByEmployeeId,
  updateContractStatus,
  signContract,
  getExpiringContracts,
  exportEmployeeContracts,
} from "../services/employeeContractService";

// Lấy danh sách hợp đồng nhân viên có phân trang và filters
export const getEmployeeContractsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt((req.query.page as string) || "1");
    const pageSize = parseInt((req.query.pageSize as string) || "10");

    // Lấy filters từ query parameters
    const filters = {
      employeeId: req.query.employeeId
        ? parseInt(req.query.employeeId as string)
        : undefined,
      employeeName: req.query.employeeName as string,
      contractNumber: req.query.contractNumber as string,
      contractTypeId: req.query.contractTypeId
        ? parseInt(req.query.contractTypeId as string)
        : undefined,
      departmentId: req.query.departmentId
        ? parseInt(req.query.departmentId as string)
        : undefined,
      status: req.query.status as string,
      startDateFrom: req.query.startDateFrom as string,
      startDateTo: req.query.startDateTo as string,
      endDateFrom: req.query.endDateFrom as string,
      endDateTo: req.query.endDateTo as string,
    };

    const result = await getEmployeeContractsByFilter(page, pageSize, filters);

    res.json(
      ResultResponse(true, 200, null, "Lấy danh sách hợp đồng thành công", {
        data: result.data,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalItems: result.totalItems,
          pageSize: pageSize,
        },
      })
    );
  } catch (err: any) {
    next(err);
  }
};

// Lấy hợp đồng theo ID
export const getEmployeeContractByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const contractId = parseInt(req.params.id);

    // Validate ID
    if (isNaN(contractId)) {
      res
        .status(400)
        .json(ResultResponse(false, 400, null, "ID hợp đồng không hợp lệ"));
      return;
    }

    const contract = await getEmployeeContractById(contractId);

    if (!contract) {
      res
        .status(404)
        .json(ResultResponse(false, 404, null, "Không tìm thấy hợp đồng"));
      return;
    }

    res.json(
      ResultResponse(true, 200, null, "Lấy hợp đồng thành công", contract)
    );
  } catch (err: any) {
    next(err);
  }
};

// Lấy hợp đồng theo nhân viên ID
export const getContractsByEmployeeIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const employeeId = parseInt(req.params.employeeId);

    // Validate ID
    if (isNaN(employeeId)) {
      res
        .status(400)
        .json(ResultResponse(false, 400, null, "ID nhân viên không hợp lệ"));
      return;
    }

    const contracts = await getContractsByEmployeeId(employeeId);

    res.json(
      ResultResponse(
        true,
        200,
        null,
        "Lấy hợp đồng theo nhân viên thành công",
        contracts
      )
    );
  } catch (err: any) {
    next(err);
  }
};

// Tạo hợp đồng mới
export const createEmployeeContractController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const newContract = req.body;

    // Validation cơ bản
    if (
      !newContract.employeeId ||
      !newContract.contractTypeId ||
      !newContract.startDate
    ) {
      res
        .status(400)
        .json(
          ResultResponse(
            false,
            400,
            null,
            "Nhân viên, loại hợp đồng và ngày bắt đầu là bắt buộc"
          )
        );
      return;
    }

    const createdContract = await createEmployeeContract(newContract);
    res
      .status(201)
      .json(
        ResultResponse(
          true,
          201,
          null,
          "Tạo hợp đồng thành công",
          createdContract
        )
      );
  } catch (err: any) {
    next(err);
  }
};

// Cập nhật hợp đồng
export const updateEmployeeContractController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const contractId = parseInt(req.params.id);
    const updateData = req.body;

    // Validate ID
    if (isNaN(contractId)) {
      res
        .status(400)
        .json(ResultResponse(false, 400, null, "ID hợp đồng không hợp lệ"));
      return;
    }

    const updatedContract = await updateEmployeeContract(
      contractId,
      updateData
    );
    res
      .status(200)
      .json(
        ResultResponse(
          true,
          200,
          null,
          "Cập nhật hợp đồng thành công",
          updatedContract
        )
      );
  } catch (err: any) {
    next(err);
  }
};

// Xóa hợp đồng
export const deleteEmployeeContractController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const contractId = parseInt(req.params.id);

    // Validate ID
    if (isNaN(contractId)) {
      res
        .status(400)
        .json(ResultResponse(false, 400, null, "ID hợp đồng không hợp lệ"));
      return;
    }

    const result = await deleteEmployeeContract(contractId);

    res.status(200).json(ResultResponse(true, 200, null, result.message));
  } catch (err: any) {
    next(err);
  }
};

// Cập nhật trạng thái hợp đồng
export const updateContractStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const contractId = parseInt(req.params.id);
    const { status, updatedBy } = req.body;

    // Validate ID
    if (isNaN(contractId)) {
      res
        .status(400)
        .json(ResultResponse(false, 400, null, "ID hợp đồng không hợp lệ"));
      return;
    }

    // Validate required fields
    if (!status || !updatedBy) {
      res
        .status(400)
        .json(
          ResultResponse(
            false,
            400,
            null,
            "Trạng thái và người cập nhật là bắt buộc"
          )
        );
      return;
    }

    const updatedContract = await updateContractStatus(
      contractId,
      status,
      updatedBy
    );
    res
      .status(200)
      .json(
        ResultResponse(
          true,
          200,
          null,
          "Cập nhật trạng thái hợp đồng thành công",
          updatedContract
        )
      );
  } catch (err: any) {
    next(err);
  }
};

// Ký hợp đồng
export const signContractController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const contractId = parseInt(req.params.id);
    const { signedBy, signerId } = req.body;

    // Validate ID
    if (isNaN(contractId)) {
      res
        .status(400)
        .json(ResultResponse(false, 400, null, "ID hợp đồng không hợp lệ"));
      return;
    }

    // Validate required fields
    if (!signedBy || !signerId) {
      res
        .status(400)
        .json(
          ResultResponse(false, 400, null, "Loại ký và người ký là bắt buộc")
        );
      return;
    }

    const signedContract = await signContract(contractId, signedBy, signerId);
    res
      .status(200)
      .json(
        ResultResponse(
          true,
          200,
          null,
          "Ký hợp đồng thành công",
          signedContract
        )
      );
  } catch (err: any) {
    next(err);
  }
};

// Lấy hợp đồng sắp hết hạn
export const getExpiringContractsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;

    const contracts = await getExpiringContracts(days);

    res.json(
      ResultResponse(
        true,
        200,
        null,
        "Lấy hợp đồng sắp hết hạn thành công",
        contracts
      )
    );
  } catch (err: any) {
    next(err);
  }
};

// Export hợp đồng
export const exportEmployeeContractsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Lấy filters từ query parameters
    const filters = {
      employeeId: req.query.employeeId
        ? parseInt(req.query.employeeId as string)
        : undefined,
      employeeName: req.query.employeeName as string,
      contractNumber: req.query.contractNumber as string,
      contractTypeId: req.query.contractTypeId
        ? parseInt(req.query.contractTypeId as string)
        : undefined,
      departmentId: req.query.departmentId
        ? parseInt(req.query.departmentId as string)
        : undefined,
      status: req.query.status as string,
    };

    const exportData = await exportEmployeeContracts(filters);

    res.json(
      ResultResponse(true, 200, null, "Export hợp đồng thành công", exportData)
    );
  } catch (err: any) {
    next(err);
  }
};
