# services/real_time_recognition.py
import base64
import cv2
import numpy as np
import logging
from datetime import datetime
from services.face_recognition_service import face_recognition_service
from services.attendance_log_service import AttendanceLogService

logger = logging.getLogger(__name__)

def recognition_realtime(image_data: str, employee_id: str):
    """
    Nhận diện khuôn mặt real-time từ base64 image
    """
    try:
        # logger.info(f"🎯 Real-time recognition cho employee_id: {employee_id}")
        
        # Kiểm tra dữ liệu đầu vào
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

        # Decode base64 image
        try:
            # Remove data URL prefix nếu có
            if image_data.startswith('data:image'):
                image_data = image_data.split(',')[1]
            
            # Decode base64
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
            logger.error(f"❌ Lỗi decode base64: {str(e)}")
            return {
                "success": False,
                "error": f"Lỗi decode ảnh: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }

        # Convert to RGB
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # Detect faces với InsightFace
        try:
            faces = face_recognition_service.app.get(rgb_img)
            
            if len(faces) == 0:
                return {
                    "success": False,
                    "error": "Không phát hiện khuôn mặt",
                    "face_count": 0,
                    "timestamp": datetime.now().isoformat(),
                    "realtime": True
                }

            # Lấy face có detection score cao nhất
            face = max(faces, key=lambda x: x.det_score)
            
            # Kiểm tra detection score
            if face.det_score < 0.5:
                return {
                    "success": False,
                    "error": "Độ tin cậy phát hiện khuôn mặt quá thấp",
                    "detection_score": float(face.det_score),
                    "face_count": len(faces),
                    "timestamp": datetime.now().isoformat(),
                    "realtime": True
                }

            # Lấy embedding từ face detected
            query_embedding = face.embedding

            # Lấy embedding từ database
            known_emb = face_recognition_service.get_employee_embedding(employee_id)
            if known_emb is None:
                return {
                    "success": False,
                    "error": "Nhân viên chưa đăng ký khuôn mặt",
                    "face_count": len(faces),
                    "timestamp": datetime.now().isoformat(),
                    "realtime": True
                }

            # Tính similarity
            similarity = np.dot(query_embedding, known_emb) / (
                np.linalg.norm(query_embedding) * np.linalg.norm(known_emb)
            )
            
            verified = similarity >= face_recognition_service.similarity_threshold

            # Format kết quả
            result = {
                "success": bool(verified),
                "verified": bool(verified),
                "employee_id": str(employee_id),
                "face_count": len(faces),
                "similarity": float(similarity),
                "detection_score": float(face.det_score),
                "face_bbox": face.bbox.tolist() if verified else None,
                "timestamp": datetime.now().isoformat(),
                "realtime": True,
                "processing_time": datetime.now().strftime("%H:%M:%S")
            }

            # Nếu nhận diện thành công -> điểm danh
            if verified:
                try:
                    attendance_result = AttendanceLogService.mark_attendance(
                        employee_id=employee_id,
                        source="FACE_RECOGNITION_REALTIME",
                        location="Real-time Camera System"
                    )
                    
                    result.update({
                        "action": attendance_result.get("action", "CHECK_IN"),
                        "attendance_status": "SUCCESS",
                        "attendance_result": attendance_result,
                        "message": f"✅ Nhận diện thành công! Đã điểm danh {attendance_result.get('action', 'CHECK_IN')}"
                    })
                    
                    # logger.info(f"✅ Real-time recognition SUCCESS: {employee_id} - Similarity: {similarity:.3f}")
                    
                except Exception as e:
                    logger.error(f"❌ Lỗi điểm danh real-time: {str(e)}")
                    result.update({
                        "action": "CHECK_IN",
                        "attendance_status": "FAILED",
                        "attendance_error": str(e),
                        "message": "✅ Nhận diện thành công nhưng lỗi điểm danh"
                    })
            else:
                result.update({
                    "error": "Không nhận diện được nhân viên",
                    "message": f"❌ Không nhận diện được (Similarity: {similarity:.3f})"
                })
                logger.info(f"❌ Real-time recognition FAILED: {employee_id} - Similarity: {similarity:.3f}")

            return result

        except Exception as e:
            logger.error(f"❌ Lỗi nhận diện real-time: {str(e)}")
            return {
                "success": False,
                "error": f"Lỗi nhận diện: {str(e)}",
                "timestamp": datetime.now().isoformat(),
                "realtime": True
            }

    except Exception as e:
        logger.error(f"❌ Lỗi hệ thống real-time: {str(e)}")
        return {
            "success": False,
            "error": f"Lỗi hệ thống: {str(e)}",
            "timestamp": datetime.now().isoformat(),
            "realtime": True
        }