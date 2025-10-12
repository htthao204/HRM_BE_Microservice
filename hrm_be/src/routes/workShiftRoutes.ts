import { Router } from "express";
import { authentication } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/authorizeMiddleware";
import {
  createWorkShiftController,
  deleteWorkShiftController,
  getAllWorkShiftsController,
  getWorkShiftByIdController,
  updateWorkShiftController,
} from "../controllers/workShiftController";

const workShiftRouter = Router();

workShiftRouter.get(
  "/",
  authentication,
  authorize("workshift_view_all"),
  getAllWorkShiftsController
);

workShiftRouter.get(
  "/:id",
  authentication,
  authorize("workshift_view"),
  getWorkShiftByIdController
);

workShiftRouter.post(
  "/",
  authentication,
  authorize("workshift_create"),
  createWorkShiftController
);

workShiftRouter.put(
  "/:id",
  authentication,
  authorize("workshift_update"),
  updateWorkShiftController
);

workShiftRouter.delete(
  "/:id",
  authentication,
  authorize("workshift_delete"),
  deleteWorkShiftController
);

export default workShiftRouter;
