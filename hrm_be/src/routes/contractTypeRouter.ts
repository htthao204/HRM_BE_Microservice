// routers/contractTypeRouter.ts
import { Router } from "express";
import { authentication } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/authorizeMiddleware";
import {
  getContractTypesController,
  getAllActiveContractTypesController,
  getContractTypeByIdController,
  createContractTypeController,
  updateContractTypeController,
  deleteContractTypeController,
  exportContractTypesController,
} from "../controllers/contractTypeController";

const contractTypeRouter = Router();

// Lấy tất cả loại hợp đồng có phân trang và filters
contractTypeRouter.get(
  "/",
  authentication,
  //authorize("contract_type_view"),
  getContractTypesController
);

// Lấy tất cả loại hợp đồng active (cho dropdown)
contractTypeRouter.get(
  "/active",
  authentication,
  //authorize("contract_type_view"),
  getAllActiveContractTypesController
);

// Export loại hợp đồng
contractTypeRouter.get(
  "/export",
  authentication,
  //authorize("contract_type_export"),
  exportContractTypesController
);

// Lấy loại hợp đồng theo ID
contractTypeRouter.get(
  "/:id",
  authentication,
  //authorize("contract_type_view"),
  getContractTypeByIdController
);

// Tạo loại hợp đồng mới
contractTypeRouter.post(
  "/",
  authentication,
  //authorize("contract_type_create"),
  createContractTypeController
);

// Cập nhật loại hợp đồng
contractTypeRouter.put(
  "/:id",
  authentication,
  //authorize("contract_type_update"),
  updateContractTypeController
);

// Xóa loại hợp đồng
contractTypeRouter.delete(
  "/:id",
  authentication,
  //authorize("contract_type_delete"),
  deleteContractTypeController
);

export default contractTypeRouter;
