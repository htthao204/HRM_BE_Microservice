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

const salaryStructureRouter = express.Router();

salaryStructureRouter.get(
  "/",
  authentication,
  authorize("salary_structure_type_view_all"),
  getSalaryStructureTypesController
);

salaryStructureRouter.get(
  "/:id",
  authentication,
  authorize("salary_structure_type_view"),
  getSalaryStructureTypeByIdController
);

salaryStructureRouter.post(
  "/",
  authentication,
  authorize("salary_structure_type_create"),
  createSalaryStructureTypeController
);

salaryStructureRouter.put(
  "/:id",
  authentication,
  authorize("salary_structure_type_update"),
  updateSalaryStructureTypeController
);

salaryStructureRouter.delete(
  "/:id",
  authentication,
  authorize("salary_structure_type_delete"),
  deleteSalaryStructureTypeController
);

export default salaryStructureRouter;
