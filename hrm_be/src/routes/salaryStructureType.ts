import express from "express";
import {
  getSalaryStructureTypesController,
  getSalaryStructureTypeByIdController,
  createSalaryStructureTypeController,
  updateSalaryStructureTypeController,
  deleteSalaryStructureTypeController,
} from "../controllers/salaryStructureTypeController";
import { authentication } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/authorizeMiddleware";

const salaryStructureTypeRouter = express.Router();

salaryStructureTypeRouter.get(
  "/",
  authentication,
  authorize("salary_structure_type_view_all"),
  getSalaryStructureTypesController
);

salaryStructureTypeRouter.get(
  "/:id",
  authentication,
  authorize("salary_structure_type_view"),
  getSalaryStructureTypeByIdController
);

salaryStructureTypeRouter.post(
  "/",
  authentication,
  authorize("salary_structure_type_create"),
  createSalaryStructureTypeController
);

salaryStructureTypeRouter.put(
  "/:id",
  authentication,
  authorize("salary_structure_type_update"),
  updateSalaryStructureTypeController
);

salaryStructureTypeRouter.delete(
  "/:id",
  authentication,
  authorize("salary_structure_type_delete"),
  deleteSalaryStructureTypeController
);

export default salaryStructureTypeRouter;
