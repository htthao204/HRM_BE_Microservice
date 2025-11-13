// src/routes/salaryType.routes.ts
import express from "express";
import SalaryTypeController from "../controllers/salaryTypeController";
import { authentication } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/authorizeMiddleware";
import multer from "multer";

const salaryTypeRouter = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

salaryTypeRouter.get(
  "/",
  authentication,
  //authorize("salary_type_view_all"),
  SalaryTypeController.getAll
);

salaryTypeRouter.get(
  "/dropdown",
  authentication,
  SalaryTypeController.getForDropdown
);

salaryTypeRouter.get(
  "/:id",
  authentication,
  //authorize("salary_type_view"),
  SalaryTypeController.getById
);

salaryTypeRouter.post(
  "/",
  authentication,
  //authorize("salary_type_create"),
  SalaryTypeController.create
);

salaryTypeRouter.put(
  "/:id",
  authentication,
  //authorize("salary_type_update"),
  SalaryTypeController.update
);

salaryTypeRouter.patch(
  "/:id/toggle",
  authentication,
  //authorize("salary_type_update"),
  SalaryTypeController.toggleStatus
);

salaryTypeRouter.delete(
  "/:id",
  authentication,
  //authorize("salary_type_delete"),
  SalaryTypeController.delete
);

salaryTypeRouter.get(
  "/export",
  authentication,
  //authorize("salary_type_export"),
  SalaryTypeController.export
);

salaryTypeRouter.post(
  "/import",
  authentication,
  //authorize("salary_type_import"),
  upload.single("file"),
  SalaryTypeController.import
);

salaryTypeRouter.get(
  "/template",
  authentication,
  SalaryTypeController.downloadTemplate
);

export default salaryTypeRouter;
