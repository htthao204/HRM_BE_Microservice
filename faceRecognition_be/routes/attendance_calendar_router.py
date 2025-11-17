from flask import Blueprint, jsonify, request
from datetime import datetime
from services.attendance_calendar_service import AttendanceCalendarService
from services.attendance_aggregation_service import AttendanceAggregationService
from config.db import get_connection

attendance_calendar_bp = Blueprint("attendance_calendar", __name__)

@attendance_calendar_bp.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

@attendance_calendar_bp.route("/monthly", methods=["GET", "OPTIONS"])
def get_monthly_calendar():
    """Lấy lịch chấm công hàng tháng - TỰ ĐỘNG TỔNG HỢP từ log"""
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200
        
    try:
        employee_id = request.args.get('employee_id', type=int)
        month = request.args.get('month', type=int, default=datetime.now().month)
        year = request.args.get('year', type=int, default=datetime.now().year)
        
        if not employee_id:
            return jsonify({"success": False, "message": "Thiếu employee_id"}), 400
            
        result = AttendanceCalendarService.get_monthly_calendar(employee_id, year, month)
        
        if result["success"]:
            return jsonify({
                "success": True,
                "data": {
                    "calendar": result["calendar"],
                    "summary": result["summary"]
                }
            })
        else:
            return jsonify({"success": False, "message": result["error"]}), 500
            
    except Exception as e:
        print(f"❌ Lỗi router lấy lịch chấm công: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

@attendance_calendar_bp.route("/stats/<int:employee_id>", methods=["GET", "OPTIONS"])
def get_attendance_stats(employee_id):
    """Lấy thống kê điểm danh - TỰ ĐỘNG TỔNG HỢP từ log"""
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200
        
    try:
        # Cho phép chọn tháng/năm tùy ý
        month = request.args.get('month', type=int, default=datetime.now().month)
        year = request.args.get('year', type=int, default=datetime.now().year)
        current_month = f"{year}-{month:02d}"
        
        # Lấy calendar để tính thống kê (đã tự động tổng hợp)
        result = AttendanceCalendarService.get_monthly_calendar(employee_id, year, month)
        
        if result["success"]:
            summary = result["summary"]
            
            return jsonify({
                "success": True,
                "data": {
                    "current_month": current_month,
                    "total_working_days": summary["working_days"],
                    "present_days": summary["present_days"],
                    "late_days": summary["late_days"],
                    "absent_days": summary["absent_days"],
                    "half_days": summary["half_days"],
                    "total_hours": summary["total_hours"],
                    "attendance_rate": summary["attendance_rate"],
                    "total_late_minutes": summary["total_late_minutes"],
                    "total_early_minutes": summary["total_early_minutes"]
                }
            })
        else:
            return jsonify({"success": False, "message": result["error"]}), 500
            
    except Exception as e:
        print(f"❌ Lỗi router lấy thống kê điểm danh: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

@attendance_calendar_bp.route("/details/<int:employee_id>", methods=["GET", "OPTIONS"])
def get_attendance_details(employee_id):
    """Lấy chi tiết điểm danh theo ngày - TỰ ĐỘNG TỔNG HỢP từ log"""
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200
        
    try:
        date_str = request.args.get('date')
        if not date_str:
            date_str = datetime.now().strftime('%Y-%m-%d')
        
        # Validate date format
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({"success": False, "message": "Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD"}), 400
        
        result = AttendanceCalendarService.get_attendance_details(employee_id, date_str)
        
        if result["success"]:
            return jsonify({
                "success": True,
                "data": result
            })
        else:
            return jsonify({"success": False, "message": result["error"]}), 500
            
    except Exception as e:
        print(f"❌ Lỗi router lấy chi tiết điểm danh: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

@attendance_calendar_bp.route("/recalculate", methods=["POST", "OPTIONS"])
def recalculate_attendance():
    """Tổng hợp lại attendance thủ công cho khoảng thời gian"""
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200
        
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "Thiếu dữ liệu"}), 400
        
        employee_id = data.get('employee_id')
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        
        if not start_date or not end_date:
            return jsonify({"success": False, "message": "Thiếu start_date hoặc end_date"}), 400
        
        # Validate dates
        try:
            start = datetime.strptime(start_date, '%Y-%m-%d').date()
            end = datetime.strptime(end_date, '%Y-%m-%d').date()
            if start > end:
                return jsonify({"success": False, "message": "start_date phải nhỏ hơn hoặc bằng end_date"}), 400
        except ValueError:
            return jsonify({"success": False, "message": "Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD"}), 400
        
        if employee_id:
            # Tổng hợp cho 1 nhân viên cụ thể
            result = AttendanceCalendarService.recalculate_employee_attendance(
                employee_id, start_date, end_date
            )
        else:
            # Tổng hợp cho tất cả nhân viên
            result = AttendanceAggregationService.aggregate_all_employees(start_date, end_date)
        
        if result["success"]:
            response_data = {
                "success": True,
                "message": result["message"],
                "affected_records": result.get("affected_days") or result.get("affected_records", 0)
            }
            # Thêm kết quả chi tiết nếu có
            if "results" in result:
                response_data["results"] = result["results"]
                
            return jsonify(response_data)
        else:
            return jsonify({"success": False, "message": result["error"]}), 500
            
    except Exception as e:
        print(f"❌ Lỗi router tổng hợp attendance: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

@attendance_calendar_bp.route("/aggregate/daily", methods=["POST", "OPTIONS"])
def trigger_daily_aggregation():
    """Kích hoạt tổng hợp attendance hàng ngày (chạy tự động)"""
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200
        
    try:
        result = AttendanceAggregationService.trigger_daily_aggregation()
        
        if result["success"]:
            response_data = {
                "success": True,
                "message": result["message"],
                "affected_records": result.get("affected_records", 0)
            }
            # Thêm kết quả chi tiết nếu có
            if "results" in result:
                response_data["results"] = result["results"]
                
            return jsonify(response_data)
        else:
            return jsonify({"success": False, "message": result["error"]}), 500
            
    except Exception as e:
        print(f"❌ Lỗi router tổng hợp hàng ngày: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

@attendance_calendar_bp.route("/aggregate/employee", methods=["POST", "OPTIONS"])
def aggregate_employee_attendance():
    """Tổng hợp attendance cho một nhân viên cụ thể"""
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200
        
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "Thiếu dữ liệu"}), 400
        
        employee_id = data.get('employee_id')
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        
        if not all([employee_id, start_date, end_date]):
            return jsonify({"success": False, "message": "Thiếu employee_id, start_date hoặc end_date"}), 400
        
        result = AttendanceAggregationService.aggregate_for_employee(employee_id, start_date, end_date)
        
        if result["success"]:
            return jsonify({
                "success": True,
                "message": result["message"],
                "affected_records": result["affected_records"],
                "results": result["results"]
            })
        else:
            return jsonify({"success": False, "message": result["error"]}), 500
            
    except Exception as e:
        print(f"❌ Lỗi router tổng hợp nhân viên: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

@attendance_calendar_bp.route("/debug/logs/<int:employee_id>", methods=["GET", "OPTIONS"])
def debug_attendance_logs(employee_id):
    """Debug: Xem log raw và dữ liệu đã tổng hợp"""
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200
        
    try:
        date_str = request.args.get('date', datetime.now().strftime('%Y-%m-%d'))
        
        conn = get_connection()
        cursor = conn.cursor()
        
        # Lấy log raw
        cursor.execute("""
            SELECT 
                id, log_time, action, source, status, location, device_id, notes
            FROM attendance_logs 
            WHERE employee_id = %s AND DATE(log_time) = %s
            ORDER BY log_time
        """, (employee_id, date_str))
        
        raw_logs = cursor.fetchall()
        
        # Lấy dữ liệu đã tổng hợp
        cursor.execute("""
            SELECT 
                status, checkin_time, checkout_time, actual_hours, 
                late_minutes, early_minutes, notes, work_shift_id
            FROM attendances 
            WHERE employee_id = %s AND date = %s
        """, (employee_id, date_str))
        
        aggregated_data = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        # Format response
        logs_formatted = []
        for log in raw_logs:
            logs_formatted.append({
                "id": log[0],
                "log_time": log[1].isoformat() if log[1] else None,
                "action": log[2],
                "source": log[3],
                "status": log[4],
                "location": log[5],
                "device_id": log[6],
                "notes": log[7]
            })
        
        aggregated_formatted = None
        if aggregated_data:
            aggregated_formatted = {
                "status": aggregated_data[0],
                "checkin_time": aggregated_data[1].isoformat() if aggregated_data[1] else None,
                "checkout_time": aggregated_data[2].isoformat() if aggregated_data[2] else None,
                "actual_hours": float(aggregated_data[3]) if aggregated_data[3] else 0,
                "late_minutes": aggregated_data[4] or 0,
                "early_minutes": aggregated_data[5] or 0,
                "notes": aggregated_data[6],
                "work_shift_id": aggregated_data[7]
            }
        
        return jsonify({
            "success": True,
            "data": {
                "employee_id": employee_id,
                "date": date_str,
                "raw_logs": logs_formatted,
                "aggregated_data": aggregated_formatted,
                "raw_logs_count": len(raw_logs)
            }
        })
        
    except Exception as e:
        print(f"❌ Lỗi router debug logs: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500