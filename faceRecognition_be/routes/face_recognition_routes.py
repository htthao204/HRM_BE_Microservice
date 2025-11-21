from flask import Blueprint, request, jsonify
from services.face_recognition_service import face_recognition_service
from services.face_registration_service import face_registration_service
from services.real_time_recognition import recognition_realtime  # ← THÊM IMPORT NÀY
from datetime import datetime

face_recognition_bp = Blueprint('face_recognition', __name__)

# ------------------ REAL-TIME RECOGNITION ------------------
@face_recognition_bp.route('/recognize/realtime', methods=['POST'])
def recognize_face_realtime():
    """
    Nhận diện khuôn mặt real-time từ base64 image
    """
    try:
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({
                "success": False, 
                "error": "Missing image data"
            }), 400

        image_data = data['image']
        employee_id = data.get('employee_id')
        
        if not employee_id:
            return jsonify({
                "success": False, 
                "error": "Missing employee_id"
            }), 400

        # Gọi service real-time recognition
        result = recognition_realtime(image_data, employee_id)
        
        return jsonify(result), 200 if result.get('success') else 400

    except Exception as e:
        return jsonify({
            "success": False, 
            "error": f"Server error: {str(e)}"
        }), 500

# ------------------ RECOGNIZE FACE ------------------
@face_recognition_bp.route('/recognize', methods=['POST'])
def recognize_face():
    """
    Nhận diện khuôn mặt - hỗ trợ file upload (camera) và image URL
    """
    try:
        # --- FILE UPLOAD ---
        if request.files and 'image' in request.files:
            image_file = request.files['image']
            employee_id = request.form.get('employee_id')
            if not employee_id:
                return jsonify({"success": False, "error": "Missing employee_id"}), 400

            # Gọi service với tên tham số đúng
            result = face_recognition_service.recognize_from_image_file(
                file=image_file, 
                employee_id=employee_id
            )

            return jsonify(result), 200 if result.get('success') else 400

        # --- IMAGE URL ---
        data = request.get_json()
        if not data or 'image_url' not in data or 'employee_id' not in data:
            return jsonify({"success": False, "error": "Missing image_url or employee_id"}), 400

        result = face_recognition_service.recognize_from_image_url(
            image_url=data['image_url'],
            employee_id=data['employee_id']
        )
        return jsonify(result), 200 if result.get('success') else 400

    except Exception as e:
        return jsonify({"success": False, "error": f"Server error: {str(e)}"}), 500

# ------------------ REGISTER FACE ------------------
@face_recognition_bp.route('/register', methods=['POST'])
def register_face():
    """
    Đăng ký khuôn mặt - hỗ trợ single hoặc multiple images
    """
    try:
        employee_id = request.form.get("employee_id")
        if not employee_id:
            return jsonify({"success": False, "error": "Missing employee_id"}), 400

        # Lấy file đơn hoặc nhiều file
        image_file = request.files.get("image")
        image_files = request.files.getlist("images")

        results = []

        # Multiple images
        for img_file in image_files:
            result = face_registration_service.register_employee_face_from_file(img_file, employee_id)
            results.append({
                "filename": img_file.filename,
                "success": result.get("success", False),
                "message": result.get("message", ""),
                "error": result.get("error", "")
            })

        # Single image nếu không có multiple
        if image_file and not image_files:
            result = face_registration_service.register_employee_face_from_file(image_file, employee_id)
            results.append({
                "filename": image_file.filename,
                "success": result.get("success", False),
                "message": result.get("message", ""),
                "error": result.get("error", "")
            })

        if not results:
            return jsonify({"success": False, "error": "No image files provided"}), 400

        success_count = sum(1 for r in results if r["success"])
        return jsonify({
            "success": success_count > 0,
            "message": f"Processed {success_count}/{len(results)} images successfully",
            "results": results,
            "total_images": len(results),
            "successful_uploads": success_count
        }), 200 if success_count > 0 else 400

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ------------------ BATCH REGISTER ------------------
@face_recognition_bp.route('/register/batch/<employee_id>', methods=['POST'])
def batch_register_face(employee_id):
    try:
        result = face_registration_service.batch_register_from_dataset(employee_id)
        return jsonify(result), 200 if result.get('success') else 400
    except Exception as e:
        return jsonify({"success": False, "error": f"Server error: {str(e)}"}), 500


# ------------------ VERIFY FACE (KHÔNG ĐIỂM DANH) ------------------
@face_recognition_bp.route('/verify', methods=['POST'])
def verify_face():
    try:
        data = request.get_json()
        if not data or 'image_url' not in data or 'employee_id' not in data:
            return jsonify({"success": False, "error": "Missing image_url or employee_id"}), 400

        result = face_recognition_service.verify_face(data['image_url'], data['employee_id'])
        return jsonify(result), 200 if result.get("success") else 400

    except Exception as e:
        return jsonify({"success": False, "error": f"Server error: {str(e)}"}), 500


# ------------------ REGISTRATION STATUS ------------------
@face_recognition_bp.route('/status/<employee_id>', methods=['GET'])
def get_registration_status(employee_id):
    try:
        result = face_registration_service.get_registration_status(employee_id)
        return jsonify(result), 200 if result.get('success') else 400
    except Exception as e:
        return jsonify({"success": False, "error": f"Server error: {str(e)}"}), 500


# ------------------ DATASET INFO ------------------
@face_recognition_bp.route('/dataset/<employee_id>', methods=['GET'])
def get_dataset_info(employee_id):
    try:
        result = face_registration_service.get_dataset_info(employee_id)
        return jsonify(result), 200 if result.get('success') else 400
    except Exception as e:
        return jsonify({"success": False, "error": f"Server error: {str(e)}"}), 500


# ------------------ HEALTH CHECK ------------------
@face_recognition_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "success": True,
        "message": "Face Recognition API is running",
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }), 200