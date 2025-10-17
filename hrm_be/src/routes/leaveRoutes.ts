// routes/leaveRoutes.ts
import { Router } from "express";
import { authentication } from "./../middlewares/authMiddleware";
import { authorize } from "./../middlewares/authorizeMiddleware";

import {
  createLeaveController,
  getLeaveByIdController,
  getAllLeavesController,
  updateLeaveController,
  deleteLeaveController,
} from "../controllers/leaveController";

const leaveRouter = Router();

leaveRouter.post(
  "/",
  authentication,
  // //authorize("leave_create"),
  createLeaveController
);

leaveRouter.get(
  "/",
  authentication,
  // //authorize("leave_view_all"),
  getAllLeavesController
);

leaveRouter.get(
  "/:id",
  authentication,
  // //authorize("leave_view"),
  getLeaveByIdController
);

leaveRouter.put(
  "/:id",
  authentication,
  // //authorize("leave_update"),
  updateLeaveController
);

leaveRouter.delete(
  "/:id",
  authentication,
  // //authorize("leave_delete"),
  deleteLeaveController
);

export default leaveRouter;
