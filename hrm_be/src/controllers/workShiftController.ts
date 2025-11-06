import { Request, Response, NextFunction } from "express";
import WorkShiftService from "../services/workShiftService";
import { ResultResponse } from "../dto/response/resultResponse";

export const getAllWorkShiftsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt((req.query.page as string) || "1");
    const pageSize = parseInt((req.query.pageSize as string) || "10");

    const result = await WorkShiftService.getAll(page, pageSize);

    res.json(
      ResultResponse(true, 200, null, null, result.data, result.totalItems)
    );
  } catch (err) {
    next(err);
  }
};

export const createWorkShiftController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const workShiftData = req.body;
    const newWorkShift = await WorkShiftService.create(workShiftData);
    res
      .status(201)
      .json(
        ResultResponse(true, 201, "Tạo ca làm thành công", null, newWorkShift)
      );
  } catch (err: any) {
    next(err);
  }
};

export const updateWorkShiftController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const workShiftData = req.body;

    const updatedWorkShift = await WorkShiftService.update(id, workShiftData);
    if (!updatedWorkShift) {
      res.status(404).json(ResultResponse(false, 404, "Ca làm không tồn tại"));
      return;
    }

    res.json(
      ResultResponse(
        true,
        200,
        "Cập nhật ca làm thành công",
        null,
        updatedWorkShift
      )
    );
  } catch (err: any) {
    next(err);
  }
};

export const deleteWorkShiftController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await WorkShiftService.delete(id);
    if (!deleted) {
      res.status(404).json(ResultResponse(false, 404, "Ca làm không tồn tại"));
      return;
    }
    res.json(ResultResponse(true, 200, "Xóa ca làm thành công"));
  } catch (err: any) {
    next(err);
  }
};

export const getWorkShiftByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const workShift = await WorkShiftService.getById(id);
    if (!workShift) {
      res.status(404).json(ResultResponse(false, 404, "Ca làm không tồn tại"));
      return;
    }
    res.json(ResultResponse(true, 200, null, null, workShift));
  } catch (err: any) {
    next(err);
  }
};
export const exportWorkShiftsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filter = {
      isActive:
        req.query.isActive !== undefined
          ? req.query.isActive === "true"
          : undefined,
      search: req.query.search as string | undefined,
    };

    const buffer = await WorkShiftService.exportWorkShiftsToExcelBuffer(filter);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=work-shifts.xlsx"
    );
    res.setHeader("Content-Length", buffer.length);

    res.send(buffer);
  } catch (err: any) {
    next(err);
  }
};

// ===============================
// 🔹 Import WorkShift from Excel
// ===============================
export const importWorkShiftsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      res
        .status(400)
        .json(ResultResponse(false, 400, "Vui lòng tải lên file Excel"));
      return;
    }

    // Validate file type
    if (
      !req.file.originalname.endsWith(".xlsx") &&
      !req.file.originalname.endsWith(".xls")
    ) {
      res
        .status(400)
        .json(
          ResultResponse(false, 400, "Chỉ chấp nhận file Excel (.xlsx, .xls)")
        );
      return;
    }

    const results = await WorkShiftService.importWorkShiftsFromExcel(
      req.file.buffer
    );

    res.json(
      ResultResponse(
        true,
        200,
        `Import thành công: ${results.success} ca làm, Cập nhật: ${results.updated} ca làm`,
        null,
        results
      )
    );
  } catch (err: any) {
    next(err);
  }
};

// ===============================
// 🔹 Download WorkShift Template
// ===============================
export const downloadWorkShiftTemplateController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const buffer = await WorkShiftService.createWorkShiftTemplate();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=work-shift-template.xlsx"
    );
    res.setHeader("Content-Length", buffer.length);

    res.send(buffer);
  } catch (err: any) {
    next(err);
  }
};

// ===============================
// 🔹 Bulk Delete WorkShifts
// ===============================
export const bulkDeleteWorkShiftsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      res
        .status(400)
        .json(ResultResponse(false, 400, "Danh sách ID không hợp lệ"));
      return;
    }

    let successCount = 0;
    const errors: string[] = [];

    for (const id of ids) {
      try {
        const deleted = await WorkShiftService.delete(Number(id));
        if (deleted) {
          successCount++;
        } else {
          errors.push(`Ca làm với ID ${id} không tồn tại`);
        }
      } catch (error: any) {
        errors.push(`Lỗi khi xóa ca làm ${id}: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      res.json(
        ResultResponse(
          true,
          200,
          `Xóa thành công ${successCount} ca làm`,
          errors.join(", "),
          { successCount, errorCount: errors.length, errors }
        )
      );
    } else {
      res.json(
        ResultResponse(
          true,
          200,
          `Xóa thành công ${successCount} ca làm`,
          null,
          { successCount }
        )
      );
    }
  } catch (err: any) {
    next(err);
  }
};

// ===============================
// 🔹 Bulk Update WorkShift Status
// ===============================
export const bulkUpdateWorkShiftStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { ids, isActive } = req.body;

    if (
      !Array.isArray(ids) ||
      ids.length === 0 ||
      typeof isActive !== "boolean"
    ) {
      res.status(400).json(ResultResponse(false, 400, "Dữ liệu không hợp lệ"));
      return;
    }

    let successCount = 0;
    const errors: string[] = [];

    for (const id of ids) {
      try {
        const updated = await WorkShiftService.update(Number(id), { isActive });
        if (updated) {
          successCount++;
        } else {
          errors.push(`Ca làm với ID ${id} không tồn tại`);
        }
      } catch (error: any) {
        errors.push(`Lỗi khi cập nhật ca làm ${id}: ${error.message}`);
      }
    }

    const statusText = isActive ? "kích hoạt" : "vô hiệu hóa";

    if (errors.length > 0) {
      res.json(
        ResultResponse(
          true,
          200,
          `${statusText} thành công ${successCount} ca làm`,
          errors.join(", "),
          { successCount, errorCount: errors.length, errors }
        )
      );
    } else {
      res.json(
        ResultResponse(
          true,
          200,
          `${statusText} thành công ${successCount} ca làm`,
          null,
          { successCount }
        )
      );
    }
  } catch (err: any) {
    next(err);
  }
};
