# services/face_recognition_service.py
import cv2
import os
import datetime
import numpy as np
import base64
from services.attendance_log_service import AttendanceLogService
from config.db import get_connection
from psycopg2.extras import RealDictCursor


# def recognize_from_image(image_data, employee_id=None):
#     """
#     Nhận diện khuôn mặt từ ảnh và điểm danh
#     """
#     try:
#         # Load danh sách nhân viên
#         conn = get_connection()
#         cursor = conn.cursor(cursor_factory=RealDictCursor)
#         cursor.execute("SELECT id, employee_code, full_name FROM employee_information WHERE status = 'active'")
#         employees = cursor.fetchall()
#         cursor.close()
#         conn.close()

#         if not employees:
#             return {"success": False, "error": "Không có nhân viên nào trong hệ thống"}

#         employee_names = {emp["id"]: emp["full_name"] for emp in employees}
#         employee_codes = {emp["id"]: emp["employee_code"] for emp in employees}

#         # Load model LBPH
#         recognizer = cv2.face.LBPHFaceRecognizer_create()
#         trainer_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'utils', 'trainer', 'trainer.yml'))

#         if not os.path.exists(trainer_path):
#             return {"success": False, "error": "Model training chưa tồn tại. Hãy train model trước!"}

#         recognizer.read(trainer_path)

#         # Cascade face detection
#         cascade_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'utils', 'haarcascade_frontalface_default.xml'))
#         faceCascade = cv2.CascadeClassifier(cascade_path)

#         if faceCascade.empty():
#             return {"success": False, "error": "Không thể load cascade classifier"}

#         CONFIDENCE_THRESHOLD = 120  # LBPH confidence threshold

#         # Decode ảnh
#         if isinstance(image_data, str):
#             if image_data.startswith("data:image"):
#                 image_data = image_data.split(",")[1]

#             img_array = np.frombuffer(base64.b64decode(image_data), np.uint8)
#             img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
#         else:
#             img_array = np.frombuffer(image_data, np.uint8)
#             img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

#         if img is None:
#             return {"success": False, "error": "Không thể đọc ảnh từ dữ liệu đầu vào"}

#         # Resize ảnh lớn
#         h, w = img.shape[:2]
#         if h > 800 or w > 800:
#             scale = min(800/h, 800/w)
#             img = cv2.resize(img, (int(w * scale), int(h * scale)))

#         # Preprocess
#         gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
#         gray = cv2.equalizeHist(gray)
#         gray = cv2.GaussianBlur(gray, (3, 3), 0)

#         faces = faceCascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(40, 40))

#         recognized_faces = []
#         unknown_count = 0
#         attendance_success_count = 0

#         if len(faces) == 0:
#             return {
#                 "success": False,
#                 "error": "Không phát hiện khuôn mặt nào trong ảnh",
#                 "recognized_faces": [],
#                 "unknown_count": 0
#             }

#         for (x, y, w, h) in faces:
#             try:
#                 face_roi = gray[y:y+h, x:x+w]

#                 if w < 50 or h < 50:
#                     unknown_count += 1
#                     continue

#                 face_roi = cv2.resize(face_roi, (200, 200))

#                 # Predict
#                 id, confidence = recognizer.predict(face_roi)
#                 print(f"Predict: ID={id}, conf={confidence}")

#                 # Nếu đã truyền employee_id, chỉ mark cho ID này
#                 if employee_id and id != int(employee_id):
#                     continue  # bỏ qua các khuôn mặt khác

#                 if confidence > CONFIDENCE_THRESHOLD:
#                     unknown_count += 1
#                     continue

#                 name = employee_names.get(id, "Unknown")
#                 code = employee_codes.get(id, "Unknown")

#                 if name == "Unknown":
#                     unknown_count += 1
#                     continue

#                 # Xác định action
#                 action = determine_attendance_action(id)

#                 # Ghi log điểm danh
#                 attendance_result = AttendanceLogService.mark_attendance(
#                     employee_id=id,
#                     action=action,
#                     source="FACE_RECOGNITION",
#                     location=None
#                 )

#                 log_success = attendance_result.get("success", False)
#                 now = datetime.datetime.now()

#                 if log_success:
#                     attendance_status = "SUCCESS"
#                     attendance_message = f"Đã điểm danh {action} thành công"
#                     attendance_success_count += 1
#                 else:
#                     attendance_status = "SKIPPED"
#                     attendance_message = attendance_result.get("message", "Không thể điểm danh")

#                 recognized_faces.append({
#                     "employee_id": id,
#                     "employee_code": code,
#                     "name": name,
#                     "confidence": float(confidence),
#                     "action": action,
#                     "attendance_status": attendance_status,
#                     "attendance_message": attendance_message,
#                     "timestamp": now.isoformat()
#                 })

#             except Exception as e:
#                 print("Error:", e)
#                 unknown_count += 1


#         return {
#             "success": True,
#             "recognized_count": len(recognized_faces),
#             "unknown_count": unknown_count,
#             "recognized_faces": recognized_faces,
#             "attendance_summary": {
#                 "total_attendance": attendance_success_count,
#                 "message": f"Đã điểm danh {attendance_success_count} nhân viên"
#             }
#         }

#     except Exception as e:
#         return {
#             "success": False,
#             "error": str(e)
#         }

def recognize_from_image(image_data, employee_id=None):
    """
    Nhận diện khuôn mặt từ ảnh và điểm danh CHO 1 NHÂN VIÊN CỤ THỂ
    """
    try:
        if not employee_id:
            return {"success": False, "error": "Thiếu employee_id"}

        # Load THÔNG TIN NHÂN VIÊN CỤ THỂ
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute(
            "SELECT id, employee_code, full_name FROM employee_information WHERE id = %s AND status = 'active'", 
            (employee_id,)
        )
        employee = cursor.fetchone()
        cursor.close()
        conn.close()

        if not employee:
            return {"success": False, "error": f"Không tìm thấy nhân viên với ID: {employee_id}"}

        # Load model LBPH
        recognizer = cv2.face.LBPHFaceRecognizer_create()
        trainer_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'utils', 'trainer', 'trainer.yml'))

        if not os.path.exists(trainer_path):
            return {"success": False, "error": "Model training chưa tồn tại. Hãy train model trước!"}

        recognizer.read(trainer_path)

        # Cascade face detection
        cascade_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'utils', 'haarcascade_frontalface_default.xml'))
        faceCascade = cv2.CascadeClassifier(cascade_path)

        if faceCascade.empty():
            return {"success": False, "error": "Không thể load cascade classifier"}

        CONFIDENCE_THRESHOLD = 120

        # Decode ảnh
        if isinstance(image_data, str):
            if image_data.startswith("data:image"):
                image_data = image_data.split(",")[1]
            img_array = np.frombuffer(base64.b64decode(image_data), np.uint8)
            img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        else:
            img_array = np.frombuffer(image_data, np.uint8)
            img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

        if img is None:
            return {"success": False, "error": "Không thể đọc ảnh từ dữ liệu đầu vào"}

        # Preprocess
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        gray = cv2.equalizeHist(gray)
        gray = cv2.GaussianBlur(gray, (3, 3), 0)

        faces = faceCascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(40, 40))

        if len(faces) == 0:
            return {
                "success": False,
                "error": "Không phát hiện khuôn mặt nào trong ảnh"
            }

        # CHỈ TÌM KIẾM NHÂN VIÊN CỤ THỂ
        target_employee_found = False
        best_confidence = float('inf')
        best_face = None

        for (x, y, w, h) in faces:
            try:
                face_roi = gray[y:y+h, x:x+w]

                if w < 50 or h < 50:
                    continue

                face_roi = cv2.resize(face_roi, (200, 200))

                # Predict
                predicted_id, confidence = recognizer.predict(face_roi)
                print(f"Predict: ID={predicted_id}, conf={confidence}, Target ID={employee_id}")

                # CHỈ QUAN TÂM ĐẾN NHÂN VIÊN MỤC TIÊU
                if predicted_id == int(employee_id) and confidence < CONFIDENCE_THRESHOLD:
                    if confidence < best_confidence:  # Chọn khuôn mặt có confidence tốt nhất
                        best_confidence = confidence
                        best_face = (x, y, w, h)
                        target_employee_found = True

            except Exception as e:
                print("Error processing face:", e)
                continue

        if not target_employee_found:
            return {
                "success": False,
                "error": f"Không tìm thấy hoặc không nhận diện được nhân viên {employee['full_name']} trong ảnh"
            }

        # ĐIỂM DANH CHO NHÂN VIÊN ĐÃ TÌM THẤY
        action = determine_attendance_action(employee_id)
        
        attendance_result = AttendanceLogService.mark_attendance(
            employee_id=employee_id,
            action=action,
            source="FACE_RECOGNITION",
            location=None
        )

        if attendance_result.get("success", False):
            return {
                "success": True,
                "employee_id": employee_id,
                "employee_code": employee["employee_code"],
                "name": employee["full_name"],
                "confidence": float(best_confidence),
                "action": action,
                "attendance_status": "SUCCESS",
                "message": f"Đã điểm danh {action} thành công cho {employee['full_name']}",
                "timestamp": datetime.datetime.now().isoformat()
            }
        else:
            return {
                "success": False,
                "error": attendance_result.get("message", "Không thể điểm danh")
            }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
def determine_attendance_action(employee_id):
    """Xác định CHECKIN hay CHECKOUT"""
    try:
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        cursor.execute("""
            SELECT action FROM attendance_logs
            WHERE employee_id = %s AND DATE(log_time) = CURRENT_DATE
            ORDER BY log_time DESC LIMIT 1
        """, (employee_id,))

        last = cursor.fetchone()
        cursor.close()
        conn.close()

        if not last or last["action"] == "CHECKOUT":
            return "CHECKIN"
        return "CHECKOUT"

    except:
        return "CHECKIN"
