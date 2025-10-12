from flask import Blueprint, jsonify, request
from services.recognition_service import run_recognition
from services.dataset_service import capture_dataset
from services.training_service import train_model

recognition_bp = Blueprint("recognition", __name__)

@recognition_bp.route("/attendance", methods=["GET"])
def start_recognition_api():
    try:
        result = run_recognition()
        return jsonify({"success": True, "data": result})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@recognition_bp.route("/capture_face", methods=["POST"])
def capture_face_api():
    data = request.json
    face_id = data.get("employee_id")
    if not face_id:
        return jsonify({"success": False, "message": "Thiếu employee_id"}), 400

    try:
        # --- 1️⃣ Chụp ảnh khuôn mặt ---
        success, msg = capture_dataset(face_id)
        if not success:
            return jsonify({"success": False, "message": msg}), 500

        # --- 2️⃣ Huấn luyện lại model sau khi chụp ---
        train_success, train_msg = train_model()

        if train_success:
            return jsonify({
                "success": True,
                "message": f"{msg}. Mô hình đã được train lại thành công!"
            })
        else:
            return jsonify({
                "success": False,
                "message": f"{msg}. Nhưng huấn luyện thất bại: {train_msg}"
            }), 500

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@recognition_bp.route("/train", methods=["POST"])
def train_api():
    try:
        success, msg = train_model()
        return jsonify({"success": success, "message": msg})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
