import { Router } from "express";

import { authentication } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/authorizeMiddleware";
import { getAllEmployeeInforController } from "../controllers/employeeController";

const employeeRouters = Router();

employeeRouters.get(
  "/all/page",
  authentication,
  authorize("view_all_users"),
  getAllEmployeeInforController
);

export default employeeRouters;
