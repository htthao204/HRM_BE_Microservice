import cv2
import os
from datetime import datetime
import numpy as np
from attendance_log_service import mark_attendance
from config.db import get_connection
from psycopg2.extras import RealDictCursor
from .attendance_log_service import log_attendance
def run_recognition(max_faces_per_run=5):
    """
    Nhận diện khuôn mặt và điểm danh tự động
    """
    try:
        # Load danh sách nhân viên
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT id, employee_code, full_name FROM employee_information WHERE status = 'active'")
        employees = cursor.fetchall()
        cursor.close()
        conn.close()

        if not employees:
            return {"error": "Không có nhân viên nào trong hệ thống"}

        employee_names = {emp["id"]: emp["full_name"] for emp in employees}
        employee_codes = {emp["id"]: emp["employee_code"] for emp in employees}

        # Load model nhận diện khuôn mặt
        recognizer = cv2.face.LBPHFaceRecognizer_create()
        trainer_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'utils', 'trainer', 'trainer.yml'))
        
        if not os.path.exists(trainer_path):
            return {"error": "Model training chưa tồn tại. Hãy train model trước!"}
        
        recognizer.read(trainer_path)

        # Load bộ nhận diện khuôn mặt
        cascade_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'utils', 'haarcascade_frontalface_default.xml'))
        faceCascade = cv2.CascadeClassifier(cascade_path)
        
        if faceCascade.empty():
            return {"error": "Không thể load cascade classifier"}

        font = cv2.FONT_HERSHEY_SIMPLEX

        # Mở camera
        cam = cv2.VideoCapture(0)
        if not cam.isOpened():
            return {"error": "Không thể mở camera"}
            
        cam.set(3, 640)
        cam.set(4, 480)
        minW = 0.1 * cam.get(3)
        minH = 0.1 * cam.get(4)

        # Biến trạng thái
        marked_today = {}
        recognized_faces = []
        last_message = ""
        last_message_time = None
        unknown_count = 0

        # Ngưỡng confidence 
        CONFIDENCE_THRESHOLD = 70  # < 70 = recognized, >= 70 = unknown

        print("🎯 Bắt đầu nhận diện khuôn mặt...")
        print("👆 Nhấn ESC để thoát")

        while True:
            ret, img = cam.read()
            if not ret:
                print("❌ Không thể đọc frame từ camera")
                break

            img = cv2.flip(img, 1)
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Detect faces với parameters tối ưu
            faces = faceCascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(int(minW), int(minH)),
                flags=cv2.CASCADE_SCALE_IMAGE
            )

            current_name = "Unknown"
            current_confidence = 0

            if len(faces) > 0:
                # Lấy khuôn mặt lớn nhất
                (x, y, w, h) = max(faces, key=lambda rect: rect[2] * rect[3])

                try:
                    # Dự đoán khuôn mặt
                    id, confidence = recognizer.predict(gray[y:y+h, x:x+w])
                    current_confidence = round(100 - confidence)

                    if confidence < CONFIDENCE_THRESHOLD:
                        name = employee_names.get(id, "Unknown")
                        current_name = name

                        if name != "Unknown":
                            now = datetime.datetime.now()
                            last_time = marked_today.get(id)

                            # Nếu chưa điểm danh hoặc đã quá 5 phút kể từ lần trước
                            if not last_time or (now - last_time).total_seconds() > 300:
                                try:
                                    mark_attendance(employee_id=id)
                                    marked_today[id] = now
                                    last_message = f"✅ Đã điểm danh cho {name}"
                                    last_message_time = now

                                    recognized_faces.append({
                                        "employee_id": id,
                                        "employee_code": employee_codes.get(id, "Unknown"),
                                        "name": name,
                                        "confidence": current_confidence,
                                        "timestamp": now.isoformat()
                                    })
                                    
                                    print(f"📝 Điểm danh: {name} (ID: {id}, Confidence: {current_confidence}%)")
                                    
                                except Exception as e:
                                    last_message = f"❌ Lỗi điểm danh: {str(e)}"
                                    last_message_time = now
                        else:
                            unknown_count += 1
                            last_message = "❌ Không nhận diện được"
                            last_message_time = datetime.datetime.now()
                    else:
                        # Confidence quá cao → người lạ
                        current_name = "Unknown"
                        unknown_count += 1
                        last_message = "👤 Không xác định"
                        last_message_time = datetime.datetime.now()

                except Exception as e:
                    print(f"⚠️ Lỗi nhận diện: {str(e)}")
                    current_name = "Error"
                    last_message = "❌ Lỗi nhận diện"

                # Vẽ khung nhận diện
                color = (0, 255, 0) if current_name != "Unknown" and current_name != "Error" else (0, 0, 255)
                cv2.rectangle(img, (x, y), (x + w, y + h), color, 2)
                cv2.putText(img, current_name, (x + 5, y - 10), font, 0.8, (255, 255, 255), 2)
                cv2.putText(img, f"{current_confidence}%", (x + 5, y + h - 10), font, 0.6, (255, 255, 0), 1)

            # Hiển thị thông báo (trong 3 giây)
            if last_message and last_message_time:
                if (datetime.datetime.now() - last_message_time).total_seconds() < 3:
                    color = (0, 255, 0) if "✅" in last_message else (0, 0, 255)
                    cv2.putText(img, last_message, (20, 40), font, 0.7, color, 2)

            # Hiển thị thống kê
            stats_text = f"Đã nhận diện: {len(recognized_faces)} | Unknown: {unknown_count}"
            cv2.putText(img, stats_text, (20, 70), font, 0.6, (255, 255, 255), 1)

            # Hiển thị camera
            cv2.imshow("Face Recognition - Nhấn ESC để thoát", img)

            # Thoát nếu nhấn ESC hoặc đủ số khuôn mặt đã điểm danh
            key = cv2.waitKey(1) & 0xff
            if key == 27 or len(recognized_faces) >= max_faces_per_run:
                break

    except Exception as e:
        print(f"❌ Lỗi hệ thống nhận diện: {str(e)}")
        return {"error": f"Lỗi hệ thống: {str(e)}"}
        
    finally:
        if 'cam' in locals():
            cam.release()
        cv2.destroyAllWindows()

    print(f"✅ Kết thúc nhận diện. Đã điểm danh: {len(recognized_faces)} nhân viên")
    
    return {
        "success": True,
        "recognized_count": len(recognized_faces),
        "unknown_count": unknown_count,
        "recognized_faces": recognized_faces,
        "timestamp": datetime.datetime.now().isoformat()
    }
