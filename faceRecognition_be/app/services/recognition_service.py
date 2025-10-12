import cv2
import os
import datetime
from services.attendance_service import mark_attendance
from config.db import get_connection


def run_recognition(max_faces_per_run=5):
    # --- Load danh sách nhân viên ---
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id, full_name FROM employee_information")
    employees = cursor.fetchall()
    cursor.close()
    conn.close()

    employee_names = {emp["id"]: emp["full_name"] for emp in employees}

    # --- Load model nhận diện khuôn mặt ---
    recognizer = cv2.face.LBPHFaceRecognizer_create()
    trainer_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'utils', 'trainer', 'trainer.yml'))
    recognizer.read(trainer_path)

    # --- Load bộ nhận diện khuôn mặt ---
    cascade_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'utils', 'haarcascade_frontalface_default.xml'))
    faceCascade = cv2.CascadeClassifier(cascade_path)
    font = cv2.FONT_HERSHEY_SIMPLEX

    # --- Mở camera ---
    cam = cv2.VideoCapture(0)
    cam.set(3, 640)
    cam.set(4, 480)
    minW = 0.1 * cam.get(3)
    minH = 0.1 * cam.get(4)

    # --- Biến trạng thái ---
    marked_today = {}
    recognized_faces = []
    last_message = ""
    last_message_time = None

    # --- Ngưỡng confidence để lọc người lạ ---
    CONFIDENCE_THRESHOLD = 70  

    while True:
        ret, img = cam.read()
        if not ret:
            break

        img = cv2.flip(img, 1)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = faceCascade.detectMultiScale(
            gray,
            scaleFactor=1.2,
            minNeighbors=5,
            minSize=(int(minW), int(minH))
        )

        if len(faces) > 0:
    
            (x, y, w, h) = max(faces, key=lambda rect: rect[2] * rect[3])

            # Dự đoán khuôn mặt
            id, confidence = recognizer.predict(gray[y:y+h, x:x+w])

            if confidence < CONFIDENCE_THRESHOLD:
                name = employee_names.get(id, "Unknown")

                if name != "Unknown":
                    now = datetime.datetime.now()
                    last_time = marked_today.get(id)

                    # Nếu chưa điểm danh hoặc đã quá 5 phút kể từ lần trước
                    if not last_time or (now - last_time).total_seconds() > 300:
                        mark_attendance(employee_id=id)
                        marked_today[id] = now
                        last_message = f" Đã điểm danh cho {name}"
                        last_message_time = now

                        recognized_faces.append({
                            "id": id,
                            "name": name,
                            "confidence": round(100 - confidence)
                        })
            else:
                #  Người lạ — confidence quá cao
                name = "Unknown"
              
                last_message_time = datetime.datetime.now()

            # --- Vẽ khung nhận diện ---
            cv2.rectangle(img, (x, y), (x + w, y + h), (0, 255, 0) if name != "Unknown" else (0, 0, 255), 2)
            cv2.putText(img, name, (x + 5, y - 5), font, 1, (255, 255, 255), 2)
            cv2.putText(img, f"{round(100 - confidence)}%", (x + 5, y + h - 5), font, 1, (255, 255, 0), 1)

        #  Hiển thị thông báo (trong 3 giây)
        if last_message and last_message_time:
            if (datetime.datetime.now() - last_message_time).total_seconds() < 3:
                color = (0, 255, 0) if "" in last_message else (0, 0, 255)
                cv2.putText(img, last_message, (20, 50), font, 1, color, 3)

        # --- Hiển thị camera ---
        cv2.imshow("camera", img)

        # Thoát nếu nhấn ESC hoặc đủ số khuôn mặt đã điểm danh
        if cv2.waitKey(10) & 0xff == 27 or len(marked_today) >= max_faces_per_run:
            break

    cam.release()
    cv2.destroyAllWindows()
    return recognized_faces
