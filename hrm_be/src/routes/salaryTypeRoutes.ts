import express from "express";
import {
  getSalaryTypesController,
  getSalaryTypeByIdController,
  createSalaryTypeController,
  updateSalaryTypeController,
  deleteSalaryTypeController,
} from "../controllers/salaryTypeController";
import { authentication } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/authorizeMiddleware";

const salaryTypeRouter = express.Router();

salaryTypeRouter.get(
  "/",
  authentication,
  ////authorize("salary_type_view_all"),
  getSalaryTypesController
);

salaryTypeRouter.get(
  "/:id",
  authentication,
  ////authorize("salary_type_view"),
  getSalaryTypeByIdController
);

salaryTypeRouter.post(
  "/",
  authentication,
  ////authorize("salary_type_create"),
  createSalaryTypeController
);

salaryTypeRouter.put(
  "/:id",
  authentication,
  ////authorize("salary_type_update"),
  updateSalaryTypeController
);

salaryTypeRouter.delete(
  "/:id",
  authentication,
  ////authorize("salary_type_delete"),
  deleteSalaryTypeController
);

export default salaryTypeRouter;
