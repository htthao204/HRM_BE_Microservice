import { Router } from "express";
import { authentication } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/authorizeMiddleware";
import {
  bulkDeleteWorkShiftsController,
  bulkUpdateWorkShiftStatusController,
  createWorkShiftController,
  deleteWorkShiftController,
  downloadWorkShiftTemplateController,
  exportWorkShiftsController,
  getAllWorkShiftsController,
  getWorkShiftByIdController,
  importWorkShiftsController,
  updateWorkShiftController,
} from "../controllers/workShiftController";
import multer from "multer";

const workShiftRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});
// Lấy danh sách WorkShift
workShiftRouter.get(
  "/",
  authentication,
  // authorize("workshift_view_all"),
  getAllWorkShiftsController
);
workShiftRouter.get("/export/excel", exportWorkShiftsController);
workShiftRouter.post(
  "/import/excel",
  upload.single("file"),
  importWorkShiftsController
);
workShiftRouter.get("/template/download", downloadWorkShiftTemplateController);

// 🔹 Bulk Operations Routes
workShiftRouter.post("/bulk/delete", bulkDeleteWorkShiftsController);
workShiftRouter.post(
  "/bulk/update-status",
  bulkUpdateWorkShiftStatusController
);
// Lấy WorkShift theo ID
workShiftRouter.get(
  "/:id",
  authentication,
  // authorize("workshift_view"),
  getWorkShiftByIdController
);

// Tạo WorkShift
workShiftRouter.post(
  "/",
  authentication,
  // authorize("workshift_create"),
  createWorkShiftController
);

// Cập nhật WorkShift
workShiftRouter.put(
  "/:id",
  authentication,
  // authorize("workshift_update"),
  updateWorkShiftController
);

// Xóa WorkShift
workShiftRouter.delete(
  "/:id",
  authentication,
  // authorize("workshift_delete"),
  deleteWorkShiftController
);

export default workShiftRouter;
