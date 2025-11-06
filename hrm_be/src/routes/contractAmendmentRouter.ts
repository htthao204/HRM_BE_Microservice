// routers/contractAmendmentRouter.ts
import { Router } from "express";
import { authentication } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/authorizeMiddleware";
import {
  getContractAmendmentsController,
  getContractAmendmentByIdController,
  getAmendmentsByContractIdController,
  createContractAmendmentController,
  updateContractAmendmentController,
  deleteContractAmendmentController,
  approveContractAmendmentController,
  exportContractAmendmentsController,
} from "../controllers/contractAmendmentController";

const contractAmendmentRouter = Router();

// Lấy tất cả phụ lục hợp đồng có phân trang và filters
contractAmendmentRouter.get(
  "/",
  authentication,
  //authorize("contract_amendment_view"),
  getContractAmendmentsController
);

// Export phụ lục hợp đồng
contractAmendmentRouter.get(
  "/export",
  authentication,
  //authorize("contract_amendment_export"),
  exportContractAmendmentsController
);

// Lấy phụ lục theo hợp đồng ID
contractAmendmentRouter.get(
  "/contract/:contractId",
  authentication,
  //authorize("contract_amendment_view"),
  getAmendmentsByContractIdController
);

// Lấy phụ lục hợp đồng theo ID
contractAmendmentRouter.get(
  "/:id",
  authentication,
  //authorize("contract_amendment_view"),
  getContractAmendmentByIdController
);

// Tạo phụ lục hợp đồng mới
contractAmendmentRouter.post(
  "/",
  authentication,
  //authorize("contract_amendment_create"),
  createContractAmendmentController
);

// Cập nhật phụ lục hợp đồng
contractAmendmentRouter.put(
  "/:id",
  authentication,
  //authorize("contract_amendment_update"),
  updateContractAmendmentController
);

// Phê duyệt phụ lục hợp đồng
contractAmendmentRouter.patch(
  "/:id/approve",
  authentication,
  //authorize("contract_amendment_approve"),
  approveContractAmendmentController
);

// Xóa phụ lục hợp đồng
contractAmendmentRouter.delete(
  "/:id",
  authentication,
  //authorize("contract_amendment_delete"),
  deleteContractAmendmentController
);

export default contractAmendmentRouter;
