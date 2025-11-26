from flask import Blueprint, jsonify, request
from services.attendance_log_service import AttendanceLogService
from datetime import datetime
from config.db import get_connection
attendance_log_bp = Blueprint("attendance_log", __name__)

@attendance_log_bp.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

@attendance_log_bp.route("/history", methods=["POST", "OPTIONS"])
def get_attendance_history():
    """Lấy lịch sử điểm danh từ bảng attendance_logs"""
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200
        
    try:
        filters = request.json or {}
        result = AttendanceLogService.get_attendance_history(filters)
        
        if result["success"]:
            return jsonify({
                "success": True,
                "data": result,  #  hoặc "records": result["records"] nếu muốn chỉ danh sách
                "timestamp": datetime.now().isoformat()
            })

        else:
            return jsonify({
                "success": False, 
                "message": result.get("message", "Lỗi không xác định"),
                "timestamp": datetime.now().isoformat()
            }), 400
            
    except Exception as e:
        print(f"❌ Lỗi router lấy lịch sử điểm danh: {str(e)}")
        return jsonify({
            "success": False, 
            "message": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

@attendance_log_bp.route("/status/<int:employee_id>", methods=["GET", "OPTIONS"])
def get_attendance_status(employee_id):
    """Lấy trạng thái điểm danh hiện tại"""
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200
        
    try:
        status = AttendanceLogService.get_attendance_status(employee_id)
        return jsonify({"success": True, "data": status})
        
    except Exception as e:
        print(f"❌ Lỗi router lấy trạng thái điểm danh: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

@attendance_log_bp.route("/mark", methods=["POST", "OPTIONS"])
def mark_attendance():
    """Điểm danh (ghi log)"""
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200
        
    try:
        data = request.json
        employee_id = data.get('employee_id')
        action = data.get('action', 'AUTO')
        source = data.get('source', 'FACE_RECOGNITION')
        location = data.get('location')
        
        if not employee_id:
            return jsonify({"success": False, "message": "Thiếu employee_id"}), 400
            
        result = AttendanceLogService.mark_attendance(employee_id, action, source, location)
        
        if result["success"]:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        print(f"❌ Lỗi router điểm danh: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500