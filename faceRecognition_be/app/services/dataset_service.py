import cv2
import os
from config.db import get_connection

def capture_dataset(face_id, max_images=30):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM employee_information WHERE id=%s", (face_id,))
    employee = cursor.fetchone()
    if not employee:
        conn.close()
        return False, f"Nhân viên ID {face_id} không tồn tại"

    dataset_path = "dataset"
    if not os.path.exists(dataset_path):
        os.makedirs(dataset_path)

    cam = cv2.VideoCapture(0)
    cam.set(3, 640)
    cam.set(4, 480)

    cascade_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'utils', 'haarcascade_frontalface_default.xml'))
    faceCascade = cv2.CascadeClassifier(cascade_path)
    if faceCascade.empty():
        conn.close()
        return False, f"Cascade file không tìm thấy: {cascade_path}"

    count = 0
    while True:
        ret, img = cam.read()
        if not ret:
            break
        img = cv2.flip(img, 1)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = faceCascade.detectMultiScale(gray, 1.3, 5)

        for (x, y, w, h) in faces:
            cv2.rectangle(img, (x, y), (x+w, y+h), (255, 0, 0), 2)
            count += 1
            cv2.imwrite(os.path.join(dataset_path, f"User.{face_id}.{count}.jpg"), gray[y:y+h, x:x+w])
            cv2.imshow('image', img)

        k = cv2.waitKey(100) & 0xff
        if k == 27 or count >= max_images:
            break

    cam.release()
    cv2.destroyAllWindows()
    conn.close()
    return True, f"Hoàn tất chụp {count} ảnh cho nhân viên {employee['full_name']}"
