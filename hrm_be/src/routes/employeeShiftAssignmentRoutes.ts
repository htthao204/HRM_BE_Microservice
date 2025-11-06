// routes/employeeShiftAssignmentRouter.ts
import { Router } from "express";
import { authentication } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/authorizeMiddleware";
import {
  getAllShiftAssignmentsController,
  getShiftAssignmentByIdController,
  createShiftAssignmentController,
  updateShiftAssignmentController,
  deleteShiftAssignmentController,
  getAssignmentsByFilterController,
  importShiftAssignmentsFromExcelController,
  exportShiftAssignmentsToExcelController,
  exportShiftAssignmentsWithBodyController,
  downloadShiftAssignmentTemplateController,
} from "../controllers/employeeShiftAssignmentController";
import multer from "multer";

const employeeShiftAssignmentRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});
// Tạo mới phân ca làm việc
employeeShiftAssignmentRouter.post(
  "/",
  authentication,
  // authorize("create_shift_assignment"),
  createShiftAssignmentController
);

// Lấy tất cả phân ca (có phân trang + search)
employeeShiftAssignmentRouter.get(
  "/",
  authentication,
  //authorize("view_shift_assignment"),
  getAllShiftAssignmentsController
);

// Lấy theo filter nâng cao
employeeShiftAssignmentRouter.get(
  "/filter",
  authentication,
  //authorize("view_shift_assignment"),
  getAssignmentsByFilterController
);
employeeShiftAssignmentRouter.get(
  "/export/excel",
  exportShiftAssignmentsToExcelController
);
employeeShiftAssignmentRouter.post(
  "/export/excel",
  exportShiftAssignmentsWithBodyController
);
employeeShiftAssignmentRouter.post(
  "/import/excel",
  upload.single("file"),
  importShiftAssignmentsFromExcelController
);
employeeShiftAssignmentRouter.get(
  "/template/download",
  downloadShiftAssignmentTemplateController
);
// Lấy theo ID
employeeShiftAssignmentRouter.get(
  "/:id",
  authentication,
  // authorize("view_shift_assignment"),
  getShiftAssignmentByIdController
);

// Cập nhật phân ca
employeeShiftAssignmentRouter.put(
  "/:id",
  authentication,
  // authorize("update_shift_assignment"),
  updateShiftAssignmentController
);

// Xóa phân ca
employeeShiftAssignmentRouter.delete(
  "/:id",
  authentication,
  //authorize("delete_shift_assignment"),
  deleteShiftAssignmentController
);

export default employeeShiftAssignmentRouter;
