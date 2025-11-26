# services/real_time_recognition.py
import base64
import cv2
import numpy as np
import logging
from datetime import datetime
from services.face_recognition_service import face_recognition_service
from services.attendance_log_service import AttendanceLogService
from services.anti_spoofing_service import anti_spoofing_service  
from config.db import get_connection
from psycopg2.extras import DictCursor

logger = logging.getLogger(__name__)

# Cấu hình anti-spoofing
ANTI_SPOOFING_ENABLED = True  # Bật/tắt anti-spoofing
MIN_ANTI_SPOOFING_CONFIDENCE = 0.6  # Ngưỡng confidence tối thiểu

def get_employee_name(employee_id: str) -> str:
    """Lấy tên nhân viên từ database"""
    try:
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=DictCursor)
        cursor.execute("""
            SELECT full_name FROM employee_information 
            WHERE id = %s
        """, (employee_id,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        return result['full_name'] if result else "Employee"
    except Exception as e:
        logger.error(f"Lỗi lấy tên nhân viên: {e}")
        return "Employee"

def draw_realtime_debug(img, face, employee_name="Unknown", similarity=0.0, is_real=True, spoof_confidence=1.0):
    """
    Vẽ bounding box + tên + trạng thái anti-spoofing
    """
    # Lấy tọa độ bbox
    x1, y1, x2, y2 = map(int, face.bbox)

    # Chọn màu theo kết quả
    if not is_real:
        color = (0, 0, 255)  # Đỏ: Spoof detected
    elif similarity >= 0.6:
        color = (0, 255, 0)  # Xanh: Thành công
    else:
        color = (0, 165, 255)  # Cam: Similarity thấp

    # Vẽ bounding box
    cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)

    # Tạo nhãn với thông tin spoofing
    spoof_status = "REAL" if is_real else "SPOOF"
    label = f"{employee_name} ({similarity:.1%}) - {spoof_status}"

    # Vẽ background cho nhãn
    label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
    cv2.rectangle(img, (x1, y1 - label_size[1] - 10), 
                  (x1 + label_size[0] + 10, y1), color, -1)
    
    # Vẽ text
    cv2.putText(img, label, (x1 + 5, y1 - 5),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

    # Thêm cảnh báo spoofing nếu phát hiện
    if not is_real:
        warning_text = "WARNING: POSSIBLE SPOOF DETECTED!"
        warning_size = cv2.getTextSize(warning_text, cv2.FONT_HERSHEY_SIMPLEX, 0.8, 3)[0]
        cv2.putText(img, warning_text, 
                    (img.shape[1]//2 - warning_size[0]//2, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 3)
        
        # Thêm thông tin confidence
        confidence_text = f"Anti-Spoof Confidence: {spoof_confidence:.1%}"
        cv2.putText(img, confidence_text,
                    (img.shape[1]//2 - warning_size[0]//2, 80),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

    # Encode JPEG -> base64
    _, buffer = cv2.imencode('.jpg', img)
    jpg_as_text = base64.b64encode(buffer).decode("utf-8")
    return jpg_as_text

def recognition_realtime(image_data: str, employee_id: str):
    """
    Nhận diện khuôn mặt real-time từ base64 image với ANTI-SPOOFING
    """
    try:
        if not image_data:
            return {
                "success": False,
                "error": "Không có dữ liệu ảnh",
                "timestamp": datetime.now().isoformat()
            }

        if not employee_id:
            return {
                "success": False,
                "error": "Thiếu employee_id",
                "timestamp": datetime.now().isoformat()
            }

        # -----------------------------
        # Decode ảnh base64
        # -----------------------------
        try:
            if image_data.startswith("data:image"):
                image_data = image_data.split(",")[1]

            image_bytes = base64.b64decode(image_data)
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if img is None:
                return {
                    "success": False,
                    "error": "Không thể decode ảnh base64",
                    "timestamp": datetime.now().isoformat()
                }

        except Exception as e:
            logger.error(f"Lỗi decode base64: {str(e)}")
            return {
                "success": False,
                "error": f"Lỗi decode ảnh: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }

        # Convert BGR → RGB cho InsightFace
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # -----------------------------
        # Detect và lấy embedding
        # -----------------------------
        faces = face_recognition_service.app.get(rgb_img)

        if len(faces) == 0:
            return {
                "success": False,
                "error": "Không phát hiện khuôn mặt",
                "face_count": 0,
                "timestamp": datetime.now().isoformat(),
                "realtime": True
            }

        # Lấy face có score cao nhất
        face = max(faces, key=lambda f: f.det_score)

        if face.det_score < 0.5:
            return {
                "success": False,
                "error": "Độ tin cậy phát hiện khuôn mặt thấp",
                "detection_score": float(face.det_score),
                "timestamp": datetime.now().isoformat(),
                "realtime": True
            }

        # -----------------------------
        # ANTI-SPOOFING CHECK - BƯỚC MỚI
        # -----------------------------
        spoof_result = {"is_real": True, "confidence": 1.0, "method": "default"}
        
        if ANTI_SPOOFING_ENABLED:
            spoof_result = anti_spoofing_service.detect_spoof_simple(rgb_img, face.bbox)
            
            # Kiểm tra kết quả anti-spoofing
            if not spoof_result["is_real"] or spoof_result["confidence"] < MIN_ANTI_SPOOFING_CONFIDENCE:
                logger.warning(f"🚨 Possible spoof detected for {employee_id}: {spoof_result}")
                
                debug_img_b64 = draw_realtime_debug(
                    img.copy(), face, "Unknown", 0.0, 
                    is_real=False, 
                    spoof_confidence=spoof_result["confidence"]
                )
                
                return {
                    "success": False,
                    "verified": False,
                    "error": "Cảnh báo: Có thể là ảnh/video giả mạo",
                    "spoof_detected": True,
                    "spoof_result": spoof_result,
                    "face_count": len(faces),
                    "debug_image": "data:image/jpeg;base64," + debug_img_b64,
                    "timestamp": datetime.now().isoformat(),
                    "realtime": True
                }

        # Lấy embedding user
        query_embedding = face.embedding
        known_emb = face_recognition_service.get_employee_embedding(employee_id)

        if known_emb is None:
            return {
                "success": False,
                "error": "Nhân viên chưa đăng ký khuôn mặt",
                "timestamp": datetime.now().isoformat(),
                "realtime": True
            }

        # -----------------------------
        # So sánh cosine similarity
        # -----------------------------
        similarity = np.dot(query_embedding, known_emb) / (
            np.linalg.norm(query_embedding) * np.linalg.norm(known_emb)
        )

        verified = similarity >= face_recognition_service.similarity_threshold

        result = {
            "success": bool(verified),
            "verified": bool(verified),
            "employee_id": str(employee_id),
            "face_count": len(faces),
            "similarity": float(similarity),
            "detection_score": float(face.det_score),
            "spoof_check": spoof_result,  # NEW: Thêm kết quả anti-spoofing
            "timestamp": datetime.now().isoformat(),
            "realtime": True
        }

        # Lấy tên nhân viên
        employee_name = get_employee_name(employee_id)

        # ------------------------------------------
        # Nếu nhận dạng thành công → điểm danh
        # ------------------------------------------
        if verified:
            try:
                attendance_result = AttendanceLogService.mark_attendance(
                    employee_id=employee_id,
                    source="FACE_RECOGNITION_REALTIME",
                    location="Camera System",
                    similarity=similarity,
                    spoof_check=spoof_result  # NEW: Log kết quả anti-spoofing
                )

                # Vẽ bounding box với trạng thái anti-spoofing
                debug_img_b64 = draw_realtime_debug(
                    img.copy(), face, employee_name, similarity, 
                    is_real=True, 
                    spoof_confidence=spoof_result["confidence"]
                )

                result["debug_image"] = "data:image/jpeg;base64," + debug_img_b64
                result.update({
                    "message": "Nhận diện thành công",
                    "attendance_result": attendance_result,
                    "employee_name": employee_name
                })

                logger.info(f"✅ Real-time nhận diện thành công: {employee_id} - {employee_name} - Similarity: {similarity:.3f} - Anti-spoof: {spoof_result['confidence']:.3f}")

            except Exception as e:
                logger.error(f"❌ Lỗi điểm danh real-time: {e}")
                debug_img_b64 = draw_realtime_debug(
                    img.copy(), face, employee_name, similarity, 
                    is_real=True,
                    spoof_confidence=spoof_result["confidence"]
                )
                result["debug_image"] = "data:image/jpeg;base64," + debug_img_b64
                
                result.update({
                    "success": False,
                    "message": "Nhận diện ok nhưng lỗi điểm danh",
                    "attendance_error": str(e),
                    "employee_name": employee_name
                })
        else:
            # Nhận diện thất bại
            debug_img_b64 = draw_realtime_debug(
                img.copy(), face, "Unknown", similarity, 
                is_real=True,
                spoof_confidence=spoof_result["confidence"]
            )
            result["debug_image"] = "data:image/jpeg;base64," + debug_img_b64

            result.update({
                "error": "Không nhận diện được",
                "message": f"Similarity quá thấp: {similarity:.3f} (cần >= {face_recognition_service.similarity_threshold})"
            })

            logger.info(f"❌ Real-time nhận diện thất bại: {employee_id} - Similarity: {similarity:.3f}")

        return result

    except Exception as e:
        logger.error(f"❌ Lỗi hệ thống real-time: {str(e)}")
        return {
            "success": False,
            "error": f"Lỗi hệ thống: {str(e)}",
            "timestamp": datetime.now().isoformat(),
            "realtime": True
        }