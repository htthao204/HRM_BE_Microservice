import {
  createPositionController,
  deletePositionController,
  getAllPositionsController,
  getPositionByIdController,
  updatePositionController,
} from "../controllers/positionController";
import { Router } from "express";
import { authentication } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares///authorizeMiddleware";

const positionRouter = Router();

// Lấy tất cả chức vụ (positions)
positionRouter.get(
  "/all",
  authentication,
  ////authorize("position_view_all"),
  getAllPositionsController
);

// Lấy chi tiết 1 chức vụ
positionRouter.get(
  "/:id",
  authentication,
  ////authorize("position_view"),
  getPositionByIdController
);

// Tạo mới chức vụ
positionRouter.post(
  "/",
  authentication,
  ////authorize("position_create"),
  createPositionController
);

// Cập nhật chức vụ
positionRouter.put(
  "/:id",
  authentication,
  ////authorize("position_update"),
  updatePositionController
);

// Xoá chức vụ
positionRouter.delete(
  "/:id",
  authentication,
  ////authorize("position_delete"),
  deletePositionController
);

export default positionRouter;
