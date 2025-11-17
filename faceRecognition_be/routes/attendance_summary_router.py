from flask import Blueprint, jsonify, request
from datetime import datetime
from services.attendance_summary_service import AttendanceSummaryService

attendance_summary_bp = Blueprint("attendance_summary", __name__)

@attendance_summary_bp.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response
@attendance_summary_bp.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

# ENDPOINT MỚI - khớp với frontend
@attendance_summary_bp.route("/summary/<int:employee_id>/<int:year>/<int:month>", methods=["GET", "OPTIONS"])
def get_attendance_summary_by_path(employee_id, year, month):
    """Lấy tổng quan điểm danh theo tháng (dạng path parameter)"""
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200
        
    try:
        result = AttendanceSummaryService.get_employee_attendance_summary(employee_id, year, month)
        
        if result["success"]:
            return jsonify({
                "success": True,
                "data": {
                    "summary": result["summary"],
                    "daily_records": result["daily_records"]
                }
            })
        else:
            return jsonify({"success": False, "message": result["error"]}), 500
            
    except Exception as e:
        print(f"❌ Lỗi router lấy tổng quan điểm danh (path): {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

@attendance_summary_bp.route("/summary", methods=["GET", "OPTIONS"])
def get_attendance_summary():
    """Lấy tổng quan điểm danh theo tháng"""
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200
        
    try:
        employee_id = request.args.get('employee_id', type=int)
        month = request.args.get('month', type=int, default=datetime.now().month)
        year = request.args.get('year', type=int, default=datetime.now().year)
        
        if not employee_id:
            return jsonify({"success": False, "message": "Thiếu employee_id"}), 400
            
        result = AttendanceSummaryService.get_employee_attendance_summary(employee_id, year, month)
        
        if result["success"]:
            return jsonify({
                "success": True,
                "data": {
                    "summary": result["summary"],
                    "daily_records": result["daily_records"]
                }
            })
        else:
            return jsonify({"success": False, "message": result["error"]}), 500
            
    except Exception as e:
        print(f"❌ Lỗi router lấy tổng quan điểm danh: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

@attendance_summary_bp.route("/checkin", methods=["POST", "OPTIONS"])
def checkin_attendance():
    """Check-in điểm danh"""
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200
        
    try:
        data = request.json
        employee_id = data.get('employee_id')
        location = data.get('location', 'Văn phòng')
        
        if not employee_id:
            return jsonify({"success": False, "message": "Thiếu employee_id"}), 400
            
        result = AttendanceSummaryService.checkin_employee(employee_id, location)
        
        if result["success"]:
            return jsonify({
                "success": True,
                "message": "Check-in thành công",
                "data": {
                    "checkin_time": result["checkin_time"],
                    "status": result["status"],
                    "late_minutes": result["late_minutes"]
                }
            })
        else:
            return jsonify({"success": False, "message": result["error"]}), 400
            
    except Exception as e:
        print(f"❌ Lỗi router check-in: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

@attendance_summary_bp.route("/checkout", methods=["POST", "OPTIONS"])
def checkout_attendance():
    """Check-out điểm danh"""
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200
        
    try:
        data = request.json
        employee_id = data.get('employee_id')
        
        if not employee_id:
            return jsonify({"success": False, "message": "Thiếu employee_id"}), 400
            
        result = AttendanceSummaryService.checkout_employee(employee_id)
        
        if result["success"]:
            return jsonify({
                "success": True,
                "message": "Check-out thành công",
                "data": {
                    "checkout_time": result["checkout_time"],
                    "actual_hours": result["actual_hours"],
                    "early_minutes": result["early_minutes"],
                    "work_duration": result["work_duration"]
                }
            })
        else:
            return jsonify({"success": False, "message": result["error"]}), 400
            
    except Exception as e:
        print(f"❌ Lỗi router check-out: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

@attendance_summary_bp.route("/today/<int:employee_id>", methods=["GET", "OPTIONS"])
def get_today_attendance(employee_id):
    """Lấy thông tin điểm danh hôm nay"""
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200
        
    try:
        today = datetime.now().strftime('%Y-%m-%d')
        
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                checkin_time,
                checkout_time,
                status,
                actual_hours
            FROM attendances 
            WHERE employee_id = %s AND date = %s
        """, (employee_id, today))
        
        attendance = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if attendance:
            checkin_time, checkout_time, status, actual_hours = attendance
            return jsonify({
                "success": True,
                "data": {
                    "checkin_time": checkin_time.isoformat() if checkin_time else None,
                    "checkout_time": checkout_time.isoformat() if checkout_time else None,
                    "status": status,
                    "actual_hours": float(actual_hours) if actual_hours else 0
                }
            })
        else:
            return jsonify({
                "success": True,
                "data": {
                    "checkin_time": None,
                    "checkout_time": None,
                    "status": "absent",
                    "actual_hours": 0
                }
            })
            
    except Exception as e:
        print(f"❌ Lỗi router lấy điểm danh hôm nay: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500