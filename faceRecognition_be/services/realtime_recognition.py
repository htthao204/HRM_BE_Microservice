# services/realtime_recognition.py
import cv2
import numpy as np
import datetime
from services.recognize_from_image import recognize_from_image
from services.attendance_log_service import AttendanceLogService
from config.db import get_connection
from psycopg2.extras import RealDictCursor

def recognize_from_frame(frame, employee_id=None):
    """
    Nhận diện từ frame OpenCV và điểm danh (dùng cho realtime)
    
    Args:
        frame: OpenCV image (numpy array)
        employee_id: ID nhân viên (optional)
        
    Returns:
        dict: Kết quả nhận diện và điểm danh
    """
    try:
        print(f"🔍 Processing realtime frame, shape: {frame.shape}")
        
        # Encode frame to JPEG bytes
        success, encoded_image = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
        if not success:
            return {
                "success": False, 
                "error": "Could not encode image",
                "recognized_count": 0,
                "unknown_count": 0,
                "recognized_faces": []
            }
        
        image_bytes = encoded_image.tobytes()
        
        # Use existing recognition service
        result = recognize_from_image(image_bytes, employee_id)
        
        print(f"🎯 Realtime recognition result: {result.get('recognized_count', 0)} faces")
        return result
        
    except Exception as e:
        print(f"❌ Realtime recognition error: {str(e)}")
        return {
            "success": False, 
            "error": f"Recognition error: {str(e)}",
            "recognized_count": 0,
            "unknown_count": 0,
            "recognized_faces": []
        }

def process_realtime_stream(frame, employee_id=None):
    """
    Xử lý stream realtime với optimization và điểm danh
    """
    try:
        # Resize frame để tăng performance
        if frame.shape[1] > 800:
            scale = 800 / frame.shape[1]
            new_width = 800
            new_height = int(frame.shape[0] * scale)
            frame = cv2.resize(frame, (new_width, new_height))
        
        # Gọi nhận diện (đã bao gồm điểm danh)
        return recognize_from_frame(frame, employee_id)
        
    except Exception as e:
        print(f"❌ Stream processing error: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "recognized_count": 0,
            "unknown_count": 0,
            "recognized_faces": []
        }

def determine_attendance_action(employee_id):
    """Xác định CHECKIN hay CHECKOUT cho realtime"""
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

    except Exception as e:
        print(f"⚠️ Error determining action: {str(e)}")
        return "CHECKIN"

def mark_realtime_attendance(employee_id, confidence, action=None):
    """
    Điểm danh realtime với xử lý tối ưu
    """
    try:
        if action is None:
            action = determine_attendance_action(employee_id)
            
        print(f"📝 Marking realtime attendance: {employee_id} - {action}")
        
        attendance_result = AttendanceLogService.mark_attendance(
            employee_id=employee_id,
            action=action,
            source="FACE_RECOGNITION_REALTIME",
            location=None,
            confidence=confidence
        )
        
        return attendance_result
        
    except Exception as e:
        print(f"❌ Realtime attendance error: {str(e)}")
        return {"success": False, "message": str(e)}