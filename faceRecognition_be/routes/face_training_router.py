from flask import Blueprint, jsonify, request
from services.training_service import train_model, train_employee, get_training_status, debug_training_data

face_training_bp = Blueprint("face_training", __name__)

@face_training_bp.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

@face_training_bp.route("/train", methods=["POST", "OPTIONS"])
def train_face_model():
    """
    POST /train
    body: { "employee_id": optional int } 
    Nếu có employee_id -> train incremental cho nhân viên
    Nếu không -> train toàn bộ dataset
    """
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200

    try:
        data = request.get_json(silent=True) or {}
        employee_id = data.get("employee_id")

        if employee_id:
            # Training incremental cho 1 nhân viên
            success, message = train_employee(employee_id)
        else:
            # Training toàn bộ dataset
            success, message = train_model()

        if success:
            return jsonify({
                "success": True,
                "message": message
            })
        else:
            return jsonify({
                "success": False,
                "message": message
            }), 400

    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Lỗi server: {str(e)}"
        }), 500

@face_training_bp.route("/status", methods=["GET", "OPTIONS"])
def status_model():
    """
    GET /status
    Kiểm tra trạng thái training hiện tại
    """
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200

    try:
        success, message = get_training_status()
        return jsonify({
            "success": success,
            "message": message
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Lỗi server: {str(e)}"
        }), 500

@face_training_bp.route("/debug", methods=["GET", "OPTIONS"])
def debug_data():
    """
    GET /debug
    Kiểm tra dữ liệu training trong DB
    """
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200

    try:
        has_data = debug_training_data()
        return jsonify({
            "success": has_data,
            "message": f"Dữ liệu training {'có sẵn' if has_data else 'không có'}"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Lỗi server: {str(e)}"
        }), 500
