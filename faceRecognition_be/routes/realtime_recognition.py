# services/realtime_recognition.py
import cv2
import numpy as np
import base64
from services.recognize_from_image import recognize_from_image

def recognize_from_frame(frame, employee_id=None):
    """
    Nhận diện từ frame OpenCV (dùng cho realtime)
    """
    try:
        # Encode frame to JPEG bytes
        success, encoded_image = cv2.imencode('.jpg', frame)
        if not success:
            return {"success": False, "error": "Could not encode image"}
        
        image_bytes = encoded_image.tobytes()
        
        # Use existing recognition service
        result = recognize_from_image(image_bytes, employee_id)
        return result
        
    except Exception as e:
        return {"success": False, "error": f"Recognition error: {str(e)}"}