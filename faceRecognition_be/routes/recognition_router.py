# routes/recognition_router.py
from flask import Blueprint, request, jsonify
import base64
from services.recognize_from_image import recognize_from_image
from datetime import datetime
from config.db import get_connection
from psycopg2.extras import RealDictCursor
recognition_bp = Blueprint("recognition", __name__)

@recognition_bp.route("/recognize_from_image", methods=["POST", "OPTIONS"])
def recognize_from_image_api():
    """Nhận diện khuôn mặt từ ảnh upload"""
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

        print(f"🖼️ Nhận ảnh từ {file.filename}, kích thước: {len(image_data)} bytes")
        
        # Gọi service nhận diện
        result = recognize_from_image(image_data, employee_id)
        
        return jsonify({
            "success": result["success"],
            "data": result,
            "message": "Nhận diện khuôn mặt thành công" if result["success"] else result.get("error", "Lỗi nhận diện")
        })

    except Exception as e:
        print(f"❌ Lỗi endpoint nhận diện từ ảnh: {str(e)}")
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
        # Hiện tại trả về thông báo
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
     
        print(f"Lỗi khi lấy thông tin dataset: {str(e)}")
        return jsonify({
            "success": False, 
            "message": f"Lỗi server: {str(e)}"
        }), 500
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
            "timestamp": datetime.datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "service": "face-recognition", 
            "status": "unhealthy",
            "error": str(e)
        }), 500
@recognition_bp.route("/realtime", methods=["POST"])
def attendance_realtime():
    """Nhận frame base64 từ FE và điểm danh"""
    data = request.get_json()
    if not data or "image" not in data:
        return jsonify({"success": False, "error": "Không có image"}), 400

    image_data = data["image"]
    employee_id = data.get("employee_id")
    result = recognize_from_image(image_data, employee_id)
    return jsonify(result)
