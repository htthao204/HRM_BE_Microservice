# services/face_recognition_service.py

import insightface
from insightface.app import FaceAnalysis
import cv2
import numpy as np
import requests
from psycopg2.extras import RealDictCursor
from config.db import get_connection
from services.attendance_log_service import AttendanceLogService
from datetime import datetime
import logging
import json

logging.basicConfig(level=logging.INFO)

logger = logging.getLogger(__name__)

class FaceRecognitionService:
    def __init__(self, similarity_threshold: float = 0.6):
        """
        similarity_threshold: ngưỡng cosine similarity khi verify face
        """
        self.similarity_threshold = similarity_threshold
        # Khởi tạo InsightFace app
        self.app = FaceAnalysis(allowed_modules=['detection', 'recognition'])
        self.app.prepare(ctx_id=0)  # Sửa từ -1 thành 0
        self.min_face_size = 100
        self.max_face_size = 800

    # ---------------------- UTILS ----------------------
    def download_image(self, image_url: str):
        try:
            response = requests.get(image_url, timeout=30)
            if response.status_code != 200:
                raise Exception(f"HTTP {response.status_code}")
            arr = np.asarray(bytearray(response.content), dtype=np.uint8)
            img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            if img is None:
                raise Exception("Cannot decode image")
            return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        except Exception as e:
            logging.error(f"Error downloading image: {e}")
            return None

    def process_image_file(self, file):
        try:
            file_bytes = file.read()
            nparr = np.frombuffer(file_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                raise Exception("Cannot decode image")
            return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        except Exception as e:
            logging.error(f"Error processing image file: {e}")
            return None

    def get_employee_embedding(self, employee_id):
        """Lấy embedding khuôn mặt đã đăng ký"""
        try:
            conn = get_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute("""
                SELECT face_encoding FROM employee_face_data
                WHERE employee_id=%s AND is_active=TRUE
                ORDER BY created_at DESC LIMIT 1
            """, (employee_id,))
            result = cursor.fetchone()
            cursor.close()
            conn.close()
            if result and result['face_encoding']:
                return np.frombuffer(result['face_encoding'], dtype=np.float32)
            return None
        except Exception as e:
            logging.error(f"Error getting employee embedding: {e}")
            return None

    def detect_faces(self, image):
        """Detect tất cả khuôn mặt trong ảnh"""
        try:
            faces = self.app.get(image)
            return faces
        except Exception as e:
            logging.error(f"Error detecting faces: {e}")
            return []

    def compare_embeddings(self, emb1, emb2):
        """Cosine similarity"""
        return np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2))

    # ---------------------- RECOGNITION ----------------------
    def recognize_face(self, image, employee_id):
        """
        Nhận diện khuôn mặt và so sánh với employee_id
        """
        known_emb = self.get_employee_embedding(employee_id)
        if known_emb is None:
            return {"success": False, "error": "Employee face not registered", "face_count": 0}

        faces = self.detect_faces(image)
        if len(faces) == 0:
            return {"success": False, "error": "No face detected", "face_count": 0}

        # Chọn face có detection score cao nhất
        face = max(faces, key=lambda x: x.det_score)
        emb = face.embedding  # Sửa từ normed_embedding thành embedding
        similarity = self.compare_embeddings(emb, known_emb)
        verified = similarity >= self.similarity_threshold

        return {
            "success": bool(verified),  # ĐẢM BẢO LÀ BOOL
            "face_count": len(faces),
            "similarity": float(similarity),
            "detection_score": float(face.det_score),
            "face_bbox": face.bbox.tolist() if verified else None,
            "error": None if verified else "Employee not recognized"
        }

    # ---------------------- RECOGNIZE FROM FILE ----------------------
    def recognize_from_image_file(self, file, employee_id):
        image = self.process_image_file(file)
        if image is None:
            return {"success": False, "error": "Cannot process image"}

        result = self.recognize_face(image, employee_id)
        
        # CHUYỂN ĐỔI TẤT CẢ VỀ KIỂU DỮ LIỆU JSON SERIALIZABLE
        result_clean = {
            "success": bool(result.get("success")),
            "face_count": int(result.get("face_count", 0)),
            "similarity": float(result.get("similarity", 0)),
            "detection_score": float(result.get("detection_score", 0)),
            "face_bbox": result.get("face_bbox"),
            "error": result.get("error"),
            "employee_id": str(employee_id)
        }

        if not result_clean["success"]:
            return result_clean

        # Điểm danh nếu nhận diện thành công
        try:
            attendance = AttendanceLogService.mark_attendance(
                employee_id=employee_id,
                source="FACE_RECOGNITION",
                location="Face Recognition System"
            )

            # Đảm bảo attendance data là JSON serializable
            if attendance and isinstance(attendance, dict):
                attendance_clean = {}
                for k, v in attendance.items():
                    if isinstance(v, (bool, np.bool_)):
                        attendance_clean[k] = bool(v)
                    elif isinstance(v, (int, np.integer)):
                        attendance_clean[k] = int(v)
                    elif isinstance(v, (float, np.floating)):
                        attendance_clean[k] = float(v)
                    else:
                        attendance_clean[k] = v
            else:
                attendance_clean = {"success": True, "action": "CHECK_IN"}

            result_clean.update({
                "action": str(attendance_clean.get("action", "CHECK_IN")),
                "attendance_status": "SUCCESS" if bool(attendance_clean.get("success", True)) else "FAILED",
                "timestamp": datetime.now().isoformat()
            })

        except Exception as e:
            logging.error(f"Error marking attendance: {e}")
            result_clean.update({
                "action": "CHECK_IN",
                "attendance_status": "FAILED",
                "attendance_error": str(e),
                "timestamp": datetime.now().isoformat()
            })

        return result_clean

    # ---------------------- RECOGNIZE FROM URL ----------------------
    def recognize_from_image_url(self, image_url, employee_id):
        image = self.download_image(image_url)
        if image is None:
            return {"success": False, "error": "Cannot download image"}

        result = self.recognize_face(image, employee_id)
        
        # CHUYỂN ĐỔI TẤT CẢ VỀ KIỂU DỮ LIỆU JSON SERIALIZABLE
        result_clean = {
            "success": bool(result.get("success")),
            "face_count": int(result.get("face_count", 0)),
            "similarity": float(result.get("similarity", 0)),
            "detection_score": float(result.get("detection_score", 0)),
            "face_bbox": result.get("face_bbox"),
            "error": result.get("error"),
            "employee_id": str(employee_id),
            "image_url": str(image_url)
        }

        if not result_clean["success"]:
            return result_clean

        # Điểm danh nếu nhận diện thành công
        try:
            attendance = AttendanceLogService.mark_attendance(
                employee_id=employee_id,
                source="FACE_RECOGNITION",
                location="Face Recognition System"
            )

            # Đảm bảo attendance data là JSON serializable
            if attendance and isinstance(attendance, dict):
                attendance_clean = {}
                for k, v in attendance.items():
                    if isinstance(v, (bool, np.bool_)):
                        attendance_clean[k] = bool(v)
                    elif isinstance(v, (int, np.integer)):
                        attendance_clean[k] = int(v)
                    elif isinstance(v, (float, np.floating)):
                        attendance_clean[k] = float(v)
                    else:
                        attendance_clean[k] = v
            else:
                attendance_clean = {"success": True, "action": "CHECK_IN"}

            result_clean.update({
                "action": str(attendance_clean.get("action", "CHECK_IN")),
                "attendance_status": "SUCCESS" if bool(attendance_clean.get("success", True)) else "FAILED",
                "timestamp": datetime.now().isoformat()
            })

        except Exception as e:
            logging.error(f"Error marking attendance: {e}")
            result_clean.update({
                "action": "CHECK_IN",
                "attendance_status": "FAILED",
                "attendance_error": str(e),
                "timestamp": datetime.now().isoformat()
            })

        return result_clean

    # ---------------------- VERIFY FACE ----------------------
    def verify_face(self, image_url, employee_id):
        """Xác thực khuôn mặt không điểm danh"""
        try:
            image = self.download_image(image_url)
            if image is None:
                return {"success": False, "error": "Cannot download image"}

            result = self.recognize_face(image, employee_id)
            
            # Đảm bảo JSON serializable
            return {
                "success": bool(result.get("success")),
                "verified": bool(result.get("success")),
                "similarity": float(result.get("similarity", 0)),
                "detection_score": float(result.get("detection_score", 0)),
                "face_count": int(result.get("face_count", 0)),
                "error": result.get("error")
            }
        except Exception as e:
            logging.error(f"Verify face error: {e}")
            return {"success": False, "error": str(e)}

    def recognize_from_base64(self, image_base64: str, employee_id: str):
        """
        Nhận diện từ ảnh base64 - cho real-time
        """
        try:
            # Decode base64
            if image_base64.startswith('data:image'):
                # Remove data URL prefix
                image_base64 = image_base64.split(',')[1]
            
            image_data = base64.b64decode(image_base64)
            nparr = np.frombuffer(image_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is None:
                return {"success": False, "error": "Cannot decode base64 image"}

            # Convert to RGB
            rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

            # Nhận diện
            result = self.recognize_face(rgb_img, employee_id)
            
            # Format result
            result_clean = {
                "success": bool(result.get("success")),
                "face_count": int(result.get("face_count", 0)),
                "similarity": float(result.get("similarity", 0)),
                "detection_score": float(result.get("detection_score", 0)),
                "face_bbox": result.get("face_bbox"),
                "error": result.get("error"),
                "employee_id": str(employee_id),
                "timestamp": datetime.now().isoformat()
            }

            # Điểm danh nếu nhận diện thành công
            if result_clean["success"]:
                try:
                    attendance = AttendanceLogService.mark_attendance(
                        employee_id=employee_id,
                        source="FACE_RECOGNITION_REALTIME",
                        location="Real-time Camera"
                    )
                    
                    result_clean.update({
                        "action": "CHECK_IN",
                        "attendance_status": "SUCCESS",
                        "attendance_result": attendance
                    })
                except Exception as e:
                    logging.error(f"Error marking attendance in real-time: {e}")
                    result_clean.update({
                        "action": "CHECK_IN",
                        "attendance_status": "FAILED",
                        "attendance_error": str(e)
                    })

            return result_clean

        except Exception as e:
            logging.error(f"Real-time base64 recognition error: {e}")
            return {"success": False, "error": str(e)}
    def recognition_realtime(image_data: str, employee_id: str):
        """
        Nhận diện khuôn mặt real-time từ base64 image
        """
        try:
            logger.info(f"🎯 Real-time recognition cho employee_id: {employee_id}")
            
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
                        
                        logger.info(f"✅ Real-time recognition SUCCESS: {employee_id} - Similarity: {similarity:.3f}")
                        
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
# Singleton
face_recognition_service = FaceRecognitionService()