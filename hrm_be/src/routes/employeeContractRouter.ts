// routers/employeeContractRouter.ts
import { Router } from "express";
import { authentication } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/authorizeMiddleware";
import {
  getEmployeeContractsController,
  getEmployeeContractByIdController,
  getContractsByEmployeeIdController,
  createEmployeeContractController,
  updateEmployeeContractController,
  deleteEmployeeContractController,
  updateContractStatusController,
  signContractController,
  getExpiringContractsController,
  exportEmployeeContractsController,
} from "../controllers/employeeContractController";

const employeeContractRouter = Router();

// Lấy tất cả hợp đồng có phân trang và filters
employeeContractRouter.get(
  "/",
  authentication,
  //authorize("employee_contract_view"),
  getEmployeeContractsController
);

// Lấy hợp đồng sắp hết hạn
employeeContractRouter.get(
  "/expiring",
  authentication,
  //authorize("employee_contract_view"),
  getExpiringContractsController
);

// Export hợp đồng
employeeContractRouter.get(
  "/export",
  authentication,
  //authorize("employee_contract_export"),
  exportEmployeeContractsController
);

// Lấy hợp đồng theo nhân viên ID
employeeContractRouter.get(
  "/employee/:employeeId",
  authentication,
  //authorize("employee_contract_view"),
  getContractsByEmployeeIdController
);

// Lấy hợp đồng theo ID
employeeContractRouter.get(
  "/:id",
  authentication,
  //authorize("employee_contract_view"),
  getEmployeeContractByIdController
);

// Tạo hợp đồng mới
employeeContractRouter.post(
  "/",
  authentication,
  //authorize("employee_contract_create"),
  createEmployeeContractController
);

// Cập nhật hợp đồng
employeeContractRouter.put(
  "/:id",
  authentication,
  //authorize("employee_contract_update"),
  updateEmployeeContractController
);

// Cập nhật trạng thái hợp đồng
employeeContractRouter.patch(
  "/:id/status",
  authentication,
  //authorize("employee_contract_update_status"),
  updateContractStatusController
);

// Ký hợp đồng
employeeContractRouter.patch(
  "/:id/sign",
  authentication,
  //authorize("employee_contract_sign"),
  signContractController
);

// Xóa hợp đồng
employeeContractRouter.delete(
  "/:id",
  authentication,
  //authorize("employee_contract_delete"),
  deleteEmployeeContractController
);

export default employeeContractRouter;
