import { Position } from "../models";

export const createPosition = async (positionData: any) => {
  try {
    const newPosition = await Position.create(positionData);
    return newPosition.get({ plain: true });
  } catch (err: any) {
    console.error(err);
    throw new Error("Tạo vị trí thất bại");
  }
};

export const getPositionById = async (id: number) => {
  try {
    const position = await Position.findByPk(id);
    if (!position) {
      throw new Error("Vị trí không tồn tại");
    }
    return position.get({ plain: true });
  } catch (err: any) {
    console.error(err);
    throw new Error("Lấy vị trí thất bại");
  }
};

export const getAllPositions = async () => {
  try {
    const positions = await Position.findAll();
    return positions.map((p) => p.get({ plain: true }));
  } catch (err: any) {
    console.error(err);
    throw new Error("Lấy danh sách vị trí thất bại");
  }
};

export const updatePosition = async (id: number, positionData: any) => {
  try {
    const [affectedRows] = await Position.update(positionData, {
      where: { id },
    });
    if (affectedRows === 0) {
      throw new Error("Vị trí không tồn tại");
    }
    const updated = await Position.findByPk(id);
    return updated ? updated.get({ plain: true }) : null;
  } catch (err: any) {
    console.error(err);
    throw new Error("Cập nhật vị trí thất bại");
  }
};

export const deletePosition = async (id: number) => {
  try {
    const deletedCount = await Position.destroy({ where: { id } });
    if (deletedCount === 0) {
      throw new Error("Vị trí không tồn tại");
    }
    return deletedCount;
  } catch (err: any) {
    console.error(err);
    throw new Error("Xóa vị trí thất bại");
  }
};
