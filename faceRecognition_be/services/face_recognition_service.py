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
import base64

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
        self.app.prepare(ctx_id=0)
        self.min_face_size = 100
        self.max_face_size = 800

    # ---------------------- UTILS ----------------------
    def download_image(self, image_url: str):
        """Tải ảnh từ URL"""
        try:
            response = requests.get(image_url, timeout=30)
            if response.status_code != 200:
                raise Exception(f"HTTP {response.status_code}")
            arr = np.asarray(bytearray(response.content), dtype=np.uint8)
            img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            if img is None:
                raise Exception("Không thể giải mã ảnh")
            return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        except Exception as e:
            logging.error(f"Lỗi tải ảnh: {e}")
            return None

    def process_image_file(self, file):
        """Xử lý file ảnh upload"""
        try:
            file_bytes = file.read()
            nparr = np.frombuffer(file_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                raise Exception("Không thể giải mã ảnh")
            return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        except Exception as e:
            logging.error(f"Lỗi xử lý file ảnh: {e}")
            return None

    def get_employee_embedding(self, employee_id):
        """Lấy embedding khuôn mặt đã đăng ký từ database"""
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
            logging.error(f"Lỗi lấy embedding nhân viên: {e}")
            return None

    def detect_faces(self, image):
        """Phát hiện tất cả khuôn mặt trong ảnh"""
        try:
            faces = self.app.get(image)
            return faces
        except Exception as e:
            logging.error(f"Lỗi phát hiện khuôn mặt: {e}")
            return []

    def compare_embeddings(self, emb1, emb2):
        """Tính cosine similarity giữa hai embedding"""
        return np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2))

    def get_detailed_message(self, result: dict) -> str:
        """Tạo thông báo chi tiết bằng tiếng Việt"""
        success = result.get("success", False)
        face_count = result.get("face_count", 0)
        similarity = result.get("similarity", 0)
        detection_score = result.get("detection_score", 0)
        
        if success:
            return f" NHẬN DIỆN THÀNH CÔNG\n• Số khuôn mặt: {face_count}\n• Độ tương đồng: {similarity:.1%}\n• Độ tin cậy: {detection_score:.1%}\n• Hành động: {result.get('action', 'CHECK_IN')}"
        
        # Các trường hợp lỗi
        if face_count == 0:
            return "❌ KHÔNG PHÁT HIỆN KHUÔN MẶT\n• Vui lòng đảm bảo khuôn mặt rõ ràng trong ảnh\n• Ánh sáng đủ và không bị mờ"
        
        if similarity < self.similarity_threshold:
            return f"❌ KHÔNG KHỚP KHUÔN MẶT\n• Số khuôn mặt: {face_count}\n• Độ tương đồng: {similarity:.1%} (cần >= {self.similarity_threshold:.1%})\n• Độ tin cậy: {detection_score:.1%}\n• Vui lòng thử lại với ảnh rõ hơn"
        
        if detection_score < 0.5:
            return f"⚠️ CHẤT LƯỢNG ẢNH THẤP\n• Số khuôn mặt: {face_count}\n• Độ tin cậy phát hiện: {detection_score:.1%} (cần >= 50%)\n• Vui lòng chụp ảnh rõ hơn"
        
        return "❌ LỖI KHÔNG XÁC ĐỊNH\n• Vui lòng thử lại hoặc liên hệ quản trị viên"

    # ---------------------- RECOGNITION ----------------------
    def recognize_face(self, image, employee_id):
        """
        Nhận diện khuôn mặt và so sánh với employee_id
        """
        # Kiểm tra embedding đã đăng ký
        known_emb = self.get_employee_embedding(employee_id)
        if known_emb is None:
            return {
                "success": False, 
                "error": "Nhân viên chưa đăng ký khuôn mặt trong hệ thống",
                "face_count": 0,
                "message": "❌ CHƯA ĐĂNG KÝ KHUÔN MẶT\n• Vui lòng đăng ký khuôn mặt trước khi sử dụng nhận diện"
            }

        # Phát hiện khuôn mặt
        faces = self.detect_faces(image)
        if len(faces) == 0:
            return {
                "success": False, 
                "error": "Không phát hiện được khuôn mặt trong ảnh",
                "face_count": 0,
                "message": "❌ KHÔNG PHÁT HIỆN KHUÔN MẶT\n• Vui lòng đảm bảo khuôn mặt rõ ràng\n• Ánh sáng đủ và không bị mờ"
            }

        # Chọn face có detection score cao nhất
        face = max(faces, key=lambda x: x.det_score)
        
        # Kiểm tra chất lượng phát hiện
        if face.det_score < 0.5:
            return {
                "success": False,
                "error": "Chất lượng phát hiện khuôn mặt quá thấp",
                "face_count": len(faces),
                "detection_score": float(face.det_score),
                "similarity": 0,
                "message": f"⚠️ CHẤT LƯỢNG ẢNH THẤP\n• Số khuôn mặt: {len(faces)}\n• Độ tin cậy: {face.det_score:.1%} (cần >= 50%)\n• Vui lòng chụp ảnh rõ hơn"
            }

        emb = face.embedding
        similarity = self.compare_embeddings(emb, known_emb)
        verified = similarity >= self.similarity_threshold

        result = {
            "success": bool(verified),
            "face_count": len(faces),
            "similarity": float(similarity),
            "detection_score": float(face.det_score),
            "face_bbox": face.bbox.tolist() if verified else None,
            "employee_id": str(employee_id)
        }

        # Thêm thông báo chi tiết
        result["message"] = self.get_detailed_message(result)
        
        if not verified:
            result["error"] = f"Không khớp khuôn mặt (độ tương đồng: {similarity:.1%})"

        return result

    # ---------------------- RECOGNIZE FROM FILE ----------------------
    def recognize_from_image_file(self, file, employee_id):
        """Nhận diện từ file ảnh upload"""
        logger.info(f"🔄 Bắt đầu nhận diện từ file cho nhân viên: {employee_id}")
        
        image = self.process_image_file(file)
        if image is None:
            return {
                "success": False, 
                "error": "Không thể xử lý file ảnh",
                "message": "❌ LỖI XỬ LÝ ẢNH\n• File ảnh có thể bị hỏng\n• Vui lòng thử lại với ảnh khác"
            }

        result = self.recognize_face(image, employee_id)
        
        # Định dạng kết quả
        result_clean = {
            "success": bool(result.get("success")),
            "face_count": int(result.get("face_count", 0)),
            "similarity": float(result.get("similarity", 0)),
            "detection_score": float(result.get("detection_score", 0)),
            "face_bbox": result.get("face_bbox"),
            "error": result.get("error"),
            "employee_id": str(employee_id),
            "message": result.get("message", "Không có thông báo"),
            "timestamp": datetime.now().isoformat()
        }

        if not result_clean["success"]:
            return result_clean

        # Điểm danh nếu nhận diện thành công
        try:
            logger.info(f" Nhận diện thành công, bắt đầu điểm danh cho: {employee_id}")
            attendance = AttendanceLogService.mark_attendance(
                employee_id=employee_id,
                source="FACE_RECOGNITION",
                location="Hệ thống nhận diện khuôn mặt"
            )

            # Định dạng kết quả điểm danh
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
                "attendance_result": attendance_clean,
                "message": f" ĐIỂM DANH THÀNH CÔNG\n{result_clean['message']}\n• Thời gian: {datetime.now().strftime('%H:%M:%S %d/%m/%Y')}"
            })

            logger.info(f"🎉 Hoàn thành điểm danh cho: {employee_id}")

        except Exception as e:
            logger.error(f"❌ Lỗi điểm danh: {e}")
            result_clean.update({
                "action": "CHECK_IN",
                "attendance_status": "FAILED",
                "attendance_error": str(e),
                "message": f" NHẬN DIỆN THÀNH CÔNG\n• ĐÃ NHẬN DIỆN ĐƯỢC NHÂN VIÊN\n• LỖI ĐIỂM DANH: {str(e)}\n• Vui lòng thử lại hoặc liên hệ quản trị"
            })

        return result_clean

    # ---------------------- RECOGNIZE FROM URL ----------------------
    def recognize_from_image_url(self, image_url, employee_id):
        """Nhận diện từ URL ảnh"""
        logger.info(f"🔄 Bắt đầu nhận diện từ URL cho nhân viên: {employee_id}")
        
        image = self.download_image(image_url)
        if image is None:
            return {
                "success": False, 
                "error": "Không thể tải ảnh từ URL",
                "message": "❌ LỖI TẢI ẢNH\n• URL có thể không hợp lệ\n• Vui lòng kiểm tra lại đường dẫn"
            }

        result = self.recognize_face(image, employee_id)
        
        # Định dạng kết quả
        result_clean = {
            "success": bool(result.get("success")),
            "face_count": int(result.get("face_count", 0)),
            "similarity": float(result.get("similarity", 0)),
            "detection_score": float(result.get("detection_score", 0)),
            "face_bbox": result.get("face_bbox"),
            "error": result.get("error"),
            "employee_id": str(employee_id),
            "image_url": str(image_url),
            "message": result.get("message", "Không có thông báo"),
            "timestamp": datetime.now().isoformat()
        }

        if not result_clean["success"]:
            return result_clean

        # Điểm danh nếu nhận diện thành công
        try:
            attendance = AttendanceLogService.mark_attendance(
                employee_id=employee_id,
                source="FACE_RECOGNITION",
                location="Hệ thống nhận diện khuôn mặt"
            )

            # Định dạng kết quả điểm danh
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
                "attendance_result": attendance_clean,
                "message": f" ĐIỂM DANH THÀNH CÔNG\n{result_clean['message']}\n• Thời gian: {datetime.now().strftime('%H:%M:%S %d/%m/%Y')}"
            })

        except Exception as e:
            logger.error(f"❌ Lỗi điểm danh từ URL: {e}")
            result_clean.update({
                "action": "CHECK_IN",
                "attendance_status": "FAILED",
                "attendance_error": str(e),
                "message": f" NHẬN DIỆN THÀNH CÔNG\n• ĐÃ NHẬN DIỆN ĐƯỢC NHÂN VIÊN\n• LỖI ĐIỂM DANH: {str(e)}"
            })

        return result_clean

    # ---------------------- VERIFY FACE ----------------------
    def verify_face(self, image_url, employee_id):
        """Xác thực khuôn mặt không điểm danh"""
        try:
            logger.info(f"🔄 Xác thực khuôn mặt cho nhân viên: {employee_id}")
            
            image = self.download_image(image_url)
            if image is None:
                return {
                    "success": False, 
                    "error": "Không thể tải ảnh từ URL",
                    "message": "❌ LỖI TẢI ẢNH\n• Không thể tải ảnh từ URL được cung cấp"
                }

            result = self.recognize_face(image, employee_id)
            
            # Định dạng kết quả xác thực
            verified = result.get("success", False)
            return {
                "success": verified,
                "verified": verified,
                "similarity": float(result.get("similarity", 0)),
                "detection_score": float(result.get("detection_score", 0)),
                "face_count": int(result.get("face_count", 0)),
                "error": result.get("error"),
                "message": result.get("message", "Không có thông báo"),
                "employee_id": str(employee_id)
            }
        except Exception as e:
            logger.error(f"❌ Lỗi xác thực khuôn mặt: {e}")
            return {
                "success": False, 
                "error": str(e),
                "message": f"❌ LỖI HỆ THỐNG\n• {str(e)}\n• Vui lòng thử lại sau"
            }

    # ---------------------- REAL-TIME RECOGNITION ----------------------
    def recognize_from_base64(self, image_base64: str, employee_id: str):
        """
        Nhận diện real-time từ ảnh base64
        - In console
        - Lưu similarity + success vào AttendanceLogService.evaluation_log
        - Điểm danh nếu thành công
        """
        try:
            print(f"🎯 Real-time recognition bắt đầu cho employee_id: {employee_id}")

            if not image_base64:
                return {"success": False, "error": "Không có dữ liệu ảnh", "timestamp": datetime.now().isoformat()}
            if not employee_id:
                return {"success": False, "error": "Thiếu employee_id", "timestamp": datetime.now().isoformat()}

            # Decode base64
            if image_base64.startswith('data:image'):
                image_base64 = image_base64.split(',')[1]
            image_bytes = base64.b64decode(image_base64)
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                return {"success": False, "error": "Không thể decode ảnh base64"}

            rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

            # Nhận diện khuôn mặt
            result = self.recognize_face(rgb_img, employee_id)
            similarity = float(result.get("similarity", 0))
            success = bool(result.get("success", False))
            face_count = int(result.get("face_count", 0))

            # In console
            print(f"🔹 Employee: {employee_id} | Similarity: {similarity:.3f} | Success: {success} | Faces: {face_count}")

            # Lưu vào evaluation service
            evaluation_service.add_evaluation_result(
                employee_id=employee_id,
                success=success,
                similarity=similarity,
                face_count=face_count,
                timestamp=datetime.now()
            )

            result_clean = {
                "success": success,
                "employee_id": employee_id,
                "face_count": face_count,
                "similarity": similarity,
                "message": result.get("message", ""),
                "timestamp": datetime.now().isoformat()
            }

            # Điểm danh nếu nhận diện thành công
            if success:
                attendance_result = AttendanceLogService.mark_attendance(
                    employee_id=employee_id,
                    source="FACE_RECOGNITION_REALTIME",
                    location="Camera Real-time",
                    similarity=similarity  # Thêm similarity vào log
                )
                result_clean.update({
                    "action": attendance_result.get("action", "CHECK_IN"),
                    "attendance_status": "SUCCESS" if attendance_result.get("success", True) else "FAILED",
                    "attendance_result": attendance_result
                })

            return result_clean

        except Exception as e:
            print(f"❌ Lỗi real-time recognition: {str(e)}")
            return {"success": False, "error": str(e), "employee_id": employee_id, "timestamp": datetime.now().isoformat()}


# Singleton instance
face_recognition_service = FaceRecognitionService()