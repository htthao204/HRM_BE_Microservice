import { Router } from "express";

import { authentication } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/authorizeMiddleware";
import {
  deleteAccountController,
  getAllAccountsController,
} from "../controllers/accountController";

const accountRouters = Router();

accountRouters.get(
  "/all",
  authentication,
  //authorize("view_account"),
  getAllAccountsController
);
accountRouters.delete("/:id", authentication, deleteAccountController);

export default accountRouters;
