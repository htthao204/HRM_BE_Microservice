import os
import time
import cv2
import numpy as np
import tkinter as tk
from tkinter import simpledialog
from insightface.app import FaceAnalysis

SAVE_DIR = "known_faces"
DET_SIZE = (640, 640)
CAMERA_INDEX = 0


def ask_name_popup():
    root = tk.Tk()
    root.withdraw()
    name = simpledialog.askstring("Đăng ký khuôn mặt", "Nhập tên nhân viên:")
    root.destroy()
    return name


def ensure_dir(path):
    if not os.path.exists(path):
        os.makedirs(path)


def save_face_image(name, frame):
    person_folder = os.path.join(SAVE_DIR, name)
    ensure_dir(person_folder)

    filename = f"{int(time.time())}.jpg"
    filepath = os.path.join(person_folder, filename)
    cv2.imwrite(filepath, frame)
    return filepath


def main():
    print("[INFO] Khởi tạo InsightFace model...")
    app = FaceAnalysis(name="antelope")

    try:
        app.prepare(ctx_id=0, det_size=DET_SIZE)   # GPU
    except:
        app.prepare(ctx_id=-1, det_size=DET_SIZE)  # CPU fallback

    cap = cv2.VideoCapture(CAMERA_INDEX, cv2.CAP_DSHOW)
    if not cap.isOpened():
        print("[ERROR] Không mở được camera")
        return

    win_name = "Đăng ký khuôn mặt - Nhấn R để chụp | Q để thoát"
    cv2.namedWindow(win_name, cv2.WINDOW_NORMAL)
    cv2.resizeWindow(win_name, 960, 600)

    print("[INFO] Sẵn sàng chụp. Nhấn R để chụp ảnh đăng ký.")

    while True:
        ret, frame = cap.read()
        if not ret:
            print("[WARN] Không đọc được frame từ camera.")
            break

        faces = app.get(frame)
        # vẽ bounding box để người dùng canh mặt
        for f in faces:
            x1, y1, x2, y2 = map(int, f.bbox)
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)

        cv2.imshow(win_name, frame)
        key = cv2.waitKey(1) & 0xFF

        # Đăng ký
        if key == ord('r'):
            print("[INFO] Chụp ảnh để đăng ký...")

            # popup nhập tên
            name = ask_name_popup()
            if not name:
                print("[WARN] Không nhập tên, bỏ qua.")
                continue

            # lưu ảnh
            saved_path = save_face_image(name, frame)
            print(f"[OK] Đã lưu ảnh: {saved_path}")

            # detect lại mặt để kiểm tra hợp lệ
            f = app.get(frame)
            if not f:
                print("[ERROR] Không tìm thấy mặt trong ảnh vừa chụp!")
            else:
                print(f"[SUCCESS] Đăng ký khuôn mặt '{name}' thành công!")

            # hiển thị thông báo trên màn hình
            cv2.putText(frame, "REGISTERED!", (50, 80),
                        cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 255, 0), 3)

            cv2.imshow(win_name, frame)
            cv2.waitKey(1200)

        # Thoát
        if key == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
