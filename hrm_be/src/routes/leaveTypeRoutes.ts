import express from "express";
import {
  getAllLeaveTypesController,
  getLeaveTypeByIdController,
  createLeaveTypeController,
  updateLeaveTypeController,
  deleteLeaveTypeController,
} from "../controllers/leaveTypeController";
import { authentication } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/authorizeMiddleware";

const leaveTypeRouter = express.Router();

//  Lấy danh sách tất cả loại nghỉ phép
leaveTypeRouter.get(
  "/",
  authentication,
  // //authorize("leave_type_view_all"),
  getAllLeaveTypesController
);

//  Lấy chi tiết loại nghỉ phép theo ID
leaveTypeRouter.get(
  "/:id",
  authentication,
  // //authorize("leave_type_view"),
  getLeaveTypeByIdController
);

// Tạo loại nghỉ phép mới
leaveTypeRouter.post(
  "/",
  authentication,
  ////authorize("leave_type_create"),
  createLeaveTypeController
);

//  Cập nhật loại nghỉ phép
leaveTypeRouter.put(
  "/:id",
  authentication,
  ////authorize("leave_type_update"),
  updateLeaveTypeController
);

// Xóa loại nghỉ phép
leaveTypeRouter.delete(
  "/:id",
  authentication,
  ////authorize("leave_type_delete"),
  deleteLeaveTypeController
);

export default leaveTypeRouter;
