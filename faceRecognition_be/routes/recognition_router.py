# routes/recognition_router.py
from flask import Blueprint, request, jsonify
import base64
from services.recognize_from_image import recognize_from_image
from datetime import datetime
from config.db import get_connection
from psycopg2.extras import RealDictCursor
import logging

# Setup logging
logger = logging.getLogger(__name__)

recognition_bp = Blueprint("recognition", __name__)

@recognition_bp.route("/recognize_from_image", methods=["POST", "OPTIONS"])
def recognize_from_image_api():
    """Nhận diện khuôn mặt từ ảnh upload (multipart/form-data)"""
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200
        
    try:
        # Kiểm tra xem có file ảnh không
        if 'image' not in request.files:
            return jsonify({
                "success": False,
                "error": "Không tìm thấy file ảnh"
            }), 400

        file = request.files['image']
        if file.filename == '':
            return jsonify({
                "success": False,
                "error": "Không có file được chọn"
            }), 400

        # Kiểm tra định dạng file
        allowed_extensions = {'jpg', 'jpeg', 'png', 'bmp'}
        if '.' in file.filename and file.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
            return jsonify({
                "success": False,
                "error": "Định dạng file không hỗ trợ. Chỉ chấp nhận JPG, JPEG, PNG, BMP"
            }), 400

        # Đọc employee_id từ form data (nếu có)
        employee_id = request.form.get('employee_id')
        image_data = file.read()
        
        # Kiểm tra kích thước file (tối đa 5MB)
        if len(image_data) > 5 * 1024 * 1024:
            return jsonify({
                "success": False,
                "error": "File ảnh quá lớn. Kích thước tối đa là 5MB"
            }), 400

        logger.info(f"🖼️ Nhận ảnh từ {file.filename}, kích thước: {len(image_data)} bytes, employee_id: {employee_id}")
        
        # Gọi service nhận diện
        result = recognize_from_image(image_data, employee_id)
        
        return jsonify({
            "success": result["success"],
            "data": result,
            "message": result.get("message", "Nhận diện khuôn mặt thành công") if result["success"] else result.get("error", "Lỗi nhận diện")
        })

    except Exception as e:
        logger.error(f"❌ Lỗi endpoint nhận diện từ ảnh: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Lỗi server: {str(e)}"
        }), 500

@recognition_bp.route("/recognize_from_base64", methods=["POST", "OPTIONS"])
def recognize_from_base64_api():
    """Nhận diện khuôn mặt từ ảnh base64 (JSON)"""
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200
        
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                "success": False,
                "error": "Không có dữ liệu JSON"
            }), 400

        # Lấy base64 image và employee_id
        image_data = data.get("image")
        employee_id = data.get("employee_id")

        if not image_data:
            return jsonify({
                "success": False,
                "error": "Thiếu trường 'image' (base64)"
            }), 400

        if not employee_id:
            return jsonify({
                "success": False,
                "error": "Thiếu trường 'employee_id'"
            }), 400

        logger.info(f"🖼️ Nhận ảnh base64, employee_id: {employee_id}")

        # Gọi service nhận diện
        result = recognize_from_image(image_data, employee_id)
        
        return jsonify({
            "success": result["success"],
            "data": result,
            "message": result.get("message", "Nhận diện khuôn mặt thành công") if result["success"] else result.get("error", "Lỗi nhận diện")
        })

    except Exception as e:
        logger.error(f"❌ Lỗi endpoint nhận diện từ base64: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Lỗi server: {str(e)}"
        }), 500

@recognition_bp.route("/attendance", methods=["GET", "OPTIONS"])
def start_recognition_api():
    """Khởi động nhận diện khuôn mặt để điểm danh (real-time)"""
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200
        
    try:
        # TODO: Triển khai real-time recognition từ camera
        return jsonify({
            "success": True,
            "message": "Real-time recognition endpoint - Chưa triển khai",
            "data": {
                "recognized_count": 0,
                "unknown_count": 0,
                "recognized_faces": []
            }
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@recognition_bp.route("/dataset_info/<int:employee_id>", methods=["GET", "OPTIONS"])
def get_dataset_info_api(employee_id):
    """Lấy thông tin dataset của nhân viên"""
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200
        
    try:
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute("""
            SELECT 
                ei.id as employee_id,
                ei.employee_code,
                ei.full_name,
                COUNT(efd.id) as image_count,
                MAX(efd.created_at) as last_updated
            FROM employee_information ei
            LEFT JOIN employee_face_dataset efd ON ei.id = efd.employee_id
            WHERE ei.id = %s AND ei.deleted_at IS NULL
            GROUP BY ei.id, ei.employee_code, ei.full_name
        """, (employee_id,))
        
        info = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if info:
            return jsonify({
                "success": True,
                "data": {
                    "employee_id": employee_id,
                    "employee_code": info['employee_code'],
                    "full_name": info['full_name'],
                    "image_count": info['image_count'] or 0,
                    "last_updated": info['last_updated'].isoformat() if info['last_updated'] else None,
                    "has_dataset": info['image_count'] > 0
                }
            })
        else:
            return jsonify({"success": False, "message": "Không tìm thấy nhân viên"}), 404
            
    except Exception as e:
        logger.error(f"Lỗi khi lấy thông tin dataset: {str(e)}")
        return jsonify({
            "success": False, 
            "message": f"Lỗi server: {str(e)}"
        }), 500
@recognition_bp.route("/check_dataset_quality/<int:employee_id>", methods=["GET"])
def check_dataset_quality(employee_id):
    """Kiểm tra chất lượng dataset"""
    try:
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute("""
            SELECT image_url, image_order, face_detected
            FROM employee_face_dataset 
            WHERE employee_id = %s
            ORDER BY image_order
        """, (employee_id,))
        
        images = cursor.fetchall()
        cursor.close()
        conn.close()
        
        # Phân tích chất lượng
        total_images = len(images)
        face_detected = sum(1 for img in images if img['face_detected'])
        quality_score = (face_detected / total_images) * 100 if total_images > 0 else 0
        
        return jsonify({
            "success": True,
            "employee_id": employee_id,
            "total_images": total_images,
            "face_detected_count": face_detected,
            "quality_score": f"{quality_score:.1f}%",
            "status": "GOOD" if quality_score >= 80 else "POOR"
        })
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
@recognition_bp.route("/health", methods=["GET", "OPTIONS"])
def health_check():
    """Health check endpoint"""
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200
        
    try:
        import os
        from config.db import get_connection
        
        # Test database connection
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.close()
        conn.close()
        
        # Check cascade file
        cascade_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'utils', 'haarcascade_frontalface_default.xml'))
        cascade_exists = os.path.exists(cascade_path)
        
        # Check trainer file
        trainer_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'utils', 'trainer', 'trainer.yml'))
        trainer_exists = os.path.exists(trainer_path)
        
        return jsonify({
            "success": True,
            "service": "face-recognition",
            "status": "healthy",
            "database": "connected",
            "cascade_file": "exists" if cascade_exists else "missing",
            "trainer_file": "exists" if trainer_exists else "missing",
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "service": "face-recognition", 
            "status": "unhealthy",
            "error": str(e)
        }), 500

# @recognition_bp.route("/realtime", methods=["POST", "OPTIONS"])
# def attendance_realtime():
#     """Nhận frame base64 từ FE và điểm danh (alias của recognize_from_base64)"""
#     if request.method == "OPTIONS":
#         return jsonify({"success": True}), 200
        
#     try:
#         data = request.get_json()
#         if not data or "image" not in data:
#             return jsonify({"success": False, "error": "Không có image"}), 400

#         image_data = data["image"]
#         employee_id = data.get("employee_id")
        
#         if not employee_id:
#             return jsonify({"success": False, "error": "Thiếu employee_id"}), 400

#         logger.info(f"🔍 Real-time recognition cho employee_id: {employee_id}")
        
#         result = recognize_from_image(image_data, employee_id)
#         return jsonify(result)
        
#     except Exception as e:
#         logger.error(f"❌ Lỗi real-time recognition: {str(e)}")
#         return jsonify({
#             "success": False,
#             "error": f"Lỗi server: {str(e)}"
#         }), 500

@recognition_bp.route("/debug_predict", methods=["POST", "OPTIONS"])
def debug_predict_api():
    """Endpoint debug để xem model đang dự đoán gì"""
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200
        
    try:
        data = request.get_json()
        image_data = data.get("image")
        employee_id = data.get("employee_id")

        if not image_data or not employee_id:
            return jsonify({"success": False, "error": "Thiếu image hoặc employee_id"}), 400

        # Import service để debug
        from services.face_recognition_service import recognize_from_image
        
        result = recognize_from_image(image_data, employee_id)
        
        # Thêm debug info
        debug_info = {
            "employee_id_target": employee_id,
            "received_image_size": len(image_data) if isinstance(image_data, str) else "binary",
            "result_details": result
        }
        
        return jsonify({
            "success": result.get("success", False),
            "debug_info": debug_info,
            "result": result
        })
        
    except Exception as e:
        logger.error(f"❌ Lỗi debug endpoint: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Lỗi debug: {str(e)}"
        }), 500