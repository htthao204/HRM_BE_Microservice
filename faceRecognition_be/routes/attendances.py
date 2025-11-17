# from flask import Blueprint, jsonify, request
# from datetime import datetime, timedelta
# from config.db import get_connection

# attendance_bp = Blueprint("attendance", __name__)

# @attendance_bp.after_request
# def after_request(response):
#     response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
#     response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
#     response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
#     response.headers.add('Access-Control-Allow-Credentials', 'true')
#     return response

# @attendance_bp.route("/summary", methods=["GET", "OPTIONS"])
# def get_attendance_summary():
#     """Lấy tổng quan điểm danh"""
#     if request.method == "OPTIONS":
#         return jsonify({"success": True}), 200
        
#     try:
#         employee_id = request.args.get('employee_id', type=int)
#         month = request.args.get('month', type=int)
#         year = request.args.get('year', type=int)
        
#         if not employee_id or not month or not year:
#             return jsonify({
#                 "success": False, 
#                 "message": "Thiếu tham số employee_id, month hoặc year"
#             }), 400

#         conn = get_connection()
#         cursor = conn.cursor()
        
#         # Lấy thông tin nhân viên
#         cursor.execute("""
#             SELECT employee_code, full_name 
#             FROM employee_information 
#             WHERE id = %s AND deleted_at IS NULL
#         """, (employee_id,))
#         employee = cursor.fetchone()
        
#         if not employee:
#             return jsonify({"success": False, "message": "Không tìm thấy nhân viên"}), 404
        
#         # Tính ngày đầu tháng và cuối tháng
#         start_date = f"{year}-{month:02d}-01"
#         end_date = (datetime(year, month, 1) + timedelta(days=32)).replace(day=1) - timedelta(days=1)
#         end_date = end_date.strftime('%Y-%m-%d')
        
#         # Lấy tổng số ngày làm việc trong tháng (trừ cuối tuần)
#         cursor.execute("""
#             SELECT COUNT(*) 
#             FROM (
#                 SELECT DATE(%s) + INTERVAL seq DAY as work_date
#                 FROM (
#                     SELECT @row := @row + 1 as seq
#                     FROM (SELECT 0 UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3) a,
#                          (SELECT 0 UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3) b,
#                          (SELECT 0 UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3) c,
#                          (SELECT @row := -1) r
#                 ) seq
#                 WHERE DATE(%s) + INTERVAL seq DAY <= DATE(%s)
#             ) dates
#             WHERE DAYOFWEEK(dates.work_date) NOT IN (1, 7)
#         """, (start_date, start_date, end_date))
        
#         total_working_days = cursor.fetchone()[0] or 0
        
#         # Lấy dữ liệu điểm danh trong tháng từ bảng attendances
#         cursor.execute("""
#             SELECT 
#                 date,
#                 status,
#                 checkin_time,
#                 checkout_time,
#                 actual_hours
#             FROM attendances
#             WHERE employee_id = %s 
#                 AND YEAR(date) = %s 
#                 AND MONTH(date) = %s
#             ORDER BY date
#         """, (employee_id, year, month))
        
#         daily_records = cursor.fetchall()
        
#         # Tính toán thống kê
#         present_days = 0
#         absent_days = 0
#         late_days = 0
#         total_actual_hours = 0
        
#         formatted_daily = []
#         for record in daily_records:
#             date, status, checkin_time, checkout_time, actual_hours = record
            
#             if status == 'present':
#                 present_days += 1
#             elif status == 'absent':
#                 absent_days += 1
#             elif status == 'late':
#                 late_days += 1
#                 present_days += 1  # Vẫn tính là có mặt nhưng trễ
            
#             if actual_hours:
#                 total_actual_hours += float(actual_hours)
            
#             formatted_daily.append({
#                 "date": date.isoformat(),
#                 "status": status,
#                 "check_in": checkin_time.isoformat() if checkin_time else None,
#                 "check_out": checkout_time.isoformat() if checkout_time else None,
#                 "actual_hours": float(actual_hours) if actual_hours else 0
#             })
        
#         # Tính phần trăm điểm danh
#         attendance_rate = (present_days / total_working_days * 100) if total_working_days > 0 else 0
        
#         cursor.close()
#         conn.close()
        
#         return jsonify({
#             "success": True,
#             "data": {
#                 "employee_id": employee_id,
#                 "employee_code": employee[0],
#                 "name": employee[1],
#                 "year": year,
#                 "month": month,
#                 "total_working_days": total_working_days,
#                 "present_days": present_days,
#                 "absent_days": absent_days,
#                 "late_days": late_days,
#                 "attendance_rate": round(attendance_rate, 2),
#                 "total_actual_hours": round(total_actual_hours, 2),
#                 "daily_records": formatted_daily
#             }
#         })
        
#     except Exception as e:
#         print(f"❌ Lỗi khi lấy tổng quan điểm danh: {str(e)}")
#         return jsonify({"success": False, "message": str(e)}), 500

# @attendance_bp.route("/monthly", methods=["GET", "OPTIONS"])
# def get_monthly_attendance():
#     """Lấy bảng chấm công hàng tháng"""
#     if request.method == "OPTIONS":
#         return jsonify({"success": True}), 200
        
#     try:
#         employee_id = request.args.get('employee_id', type=int)
#         year = request.args.get('year', type=int)
#         month = request.args.get('month', type=int)
        
#         if not employee_id or not year or not month:
#             return jsonify({
#                 "success": False, 
#                 "message": "Thiếu tham số employee_id, year hoặc month"
#             }), 400

#         conn = get_connection()
#         cursor = conn.cursor()
        
#         # Lấy thông tin nhân viên
#         cursor.execute("""
#             SELECT employee_code, full_name 
#             FROM employee_information 
#             WHERE id = %s AND deleted_at IS NULL
#         """, (employee_id,))
#         employee = cursor.fetchone()
        
#         if not employee:
#             return jsonify({"success": False, "message": "Không tìm thấy nhân viên"}), 404
        
#         # Tạo lịch cho tháng
#         calendar = []
#         current_date = datetime(year, month, 1)
#         last_day = (current_date.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)
        
#         # Lấy danh sách ngày lễ
#         cursor.execute("""
#             SELECT holiday_date, name 
#             FROM holidays 
#             WHERE YEAR(holiday_date) = %s AND MONTH(holiday_date) = %s
#         """, (year, month))
#         holidays = {row[0]: row[1] for row in cursor.fetchall()}
        
#         while current_date.month == month:
#             date_str = current_date.strftime('%Y-%m-%d')
#             day_of_week = current_date.strftime('%A')
#             is_weekend = current_date.weekday() >= 5  # 5=Saturday, 6=Sunday
#             is_holiday = current_date.date() in holidays
            
#             # Lấy thông tin điểm danh cho ngày này từ bảng attendances
#             cursor.execute("""
#                 SELECT 
#                     status,
#                     checkin_time,
#                     checkout_time,
#                     actual_hours,
#                     notes
#                 FROM attendances
#                 WHERE employee_id = %s AND date = %s
#             """, (employee_id, current_date.date()))
            
#             attendance_data = cursor.fetchone()
            
#             if attendance_data:
#                 status = attendance_data[0]
#                 checkin_time = attendance_data[1]
#                 checkout_time = attendance_data[2]
#                 actual_hours = attendance_data[3]
#                 notes = attendance_data[4]
#             else:
#                 if is_weekend:
#                     status = 'weekend'
#                 elif is_holiday:
#                     status = 'holiday'
#                 else:
#                     status = 'absent'
#                 checkin_time = None
#                 checkout_time = None
#                 actual_hours = 0
#                 notes = holidays.get(current_date.date(), 'Ngày lễ') if is_holiday else None
            
#             calendar.append({
#                 "date": date_str,
#                 "day_of_week": day_of_week,
#                 "is_weekend": is_weekend,
#                 "is_holiday": is_holiday,
#                 "check_in": checkin_time.isoformat() if checkin_time else None,
#                 "check_out": checkout_time.isoformat() if checkout_time else None,
#                 "status": status,
#                 "actual_hours": float(actual_hours) if actual_hours else 0,
#                 "notes": notes
#             })
            
#             current_date += timedelta(days=1)
        
#         # Tính tổng hợp
#         total_days = len(calendar)
#         working_days = len([d for d in calendar if not d['is_weekend'] and not d['is_holiday']])
#         present_days = len([d for d in calendar if d['status'] == 'present'])
#         absent_days = len([d for d in calendar if d['status'] == 'absent'])
#         holidays_count = len([d for d in calendar if d['is_holiday']])
#         weekends_count = len([d for d in calendar if d['is_weekend']])
#         total_hours = sum([d['actual_hours'] for d in calendar])
        
#         attendance_rate = (present_days / working_days * 100) if working_days > 0 else 0
        
#         cursor.close()
#         conn.close()
        
#         return jsonify({
#             "success": True,
#             "data": {
#                 "employee_id": employee_id,
#                 "employee_code": employee[0],
#                 "name": employee[1],
#                 "year": year,
#                 "month": month,
#                 "calendar": calendar,
#                 "summary": {
#                     "total_days": total_days,
#                     "working_days": working_days,
#                     "present_days": present_days,
#                     "absent_days": absent_days,
#                     "holidays": holidays_count,
#                     "weekends": weekends_count,
#                     "total_hours": round(total_hours, 2),
#                     "attendance_rate": round(attendance_rate, 2)
#                 }
#             }
#         })
        
#     except Exception as e:
#         print(f"❌ Lỗi khi lấy bảng chấm công: {str(e)}")
#         return jsonify({"success": False, "message": str(e)}), 500

# @attendance_bp.route("/stats", methods=["GET", "OPTIONS"])
# def get_attendance_stats():
#     """Lấy thống kê điểm danh"""
#     if request.method == "OPTIONS":
#         return jsonify({"success": True}), 200
        
#     try:
#         employee_id = request.args.get('employee_id', type=int)
        
#         if not employee_id:
#             return jsonify({
#                 "success": False, 
#                 "message": "Thiếu tham số employee_id"
#             }), 400

#         conn = get_connection()
#         cursor = conn.cursor()
        
#         # Thống kê tháng hiện tại
#         current_month = datetime.now().strftime('%Y-%m')
        
#         # Tổng số ngày làm việc trong tháng
#         cursor.execute("""
#             SELECT COUNT(*) 
#             FROM (
#                 SELECT DATE(CONCAT(%s, '-01')) + INTERVAL seq DAY as work_date
#                 FROM (
#                     SELECT @row := @row + 1 as seq
#                     FROM (SELECT 0 UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3) a,
#                          (SELECT 0 UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3) b,
#                          (SELECT 0 UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3) c,
#                          (SELECT @row := -1) r
#                 ) seq
#                 WHERE DATE(CONCAT(%s, '-01')) + INTERVAL seq DAY < DATE(CONCAT(%s, '-01')) + INTERVAL 1 MONTH
#             ) dates
#             WHERE DAYOFWEEK(dates.work_date) NOT IN (1, 7)
#         """, (current_month, current_month, current_month))
        
#         total_working_days = cursor.fetchone()[0] or 0
        
#         # Số ngày đã điểm danh trong tháng
#         cursor.execute("""
#             SELECT COUNT(*) 
#             FROM attendances 
#             WHERE employee_id = %s 
#                 AND DATE_FORMAT(date, '%%Y-%%m') = %s
#                 AND status IN ('present', 'late')
#         """, (employee_id, current_month))
        
#         present_days = cursor.fetchone()[0] or 0
        
#         # Số ngày đi muộn
#         cursor.execute("""
#             SELECT COUNT(*) 
#             FROM attendances 
#             WHERE employee_id = %s 
#                 AND DATE_FORMAT(date, '%%Y-%%m') = %s
#                 AND status = 'late'
#         """, (employee_id, current_month))
        
#         late_days = cursor.fetchone()[0] or 0
        
#         # Tổng số giờ làm việc trong tháng
#         cursor.execute("""
#             SELECT COALESCE(SUM(actual_hours), 0) 
#             FROM attendances 
#             WHERE employee_id = %s 
#                 AND DATE_FORMAT(date, '%%Y-%%m') = %s
#         """, (employee_id, current_month))
        
#         total_hours = cursor.fetchone()[0] or 0
        
#         # Điểm danh hôm nay
#         today = datetime.now().strftime('%Y-%m-%d')
#         cursor.execute("""
#             SELECT status, checkin_time, checkout_time
#             FROM attendances 
#             WHERE employee_id = %s AND date = %s
#         """, (employee_id, today))
        
#         today_attendance = cursor.fetchone()
        
#         cursor.close()
#         conn.close()
        
#         today_status = "Chưa điểm danh"
#         today_checkin = "--:--"
#         today_checkout = "--:--"
        
#         if today_attendance:
#             status, checkin_time, checkout_time = today_attendance
#             today_status = {
#                 'present': 'Đã điểm danh',
#                 'late': 'Đi muộn',
#                 'absent': 'Vắng mặt'
#             }.get(status, status)
            
#             if checkin_time:
#                 today_checkin = checkin_time.strftime('%H:%M')
#             if checkout_time:
#                 today_checkout = checkout_time.strftime('%H:%M')
        
#         return jsonify({
#             "success": True,
#             "data": {
#                 "current_month": current_month,
#                 "total_working_days": total_working_days,
#                 "present_days": present_days,
#                 "late_days": late_days,
#                 "total_hours": float(total_hours),
#                 "attendance_rate": round((present_days / total_working_days * 100), 2) if total_working_days > 0 else 0,
#                 "today_status": today_status,
#                 "today_checkin": today_checkin,
#                 "today_checkout": today_checkout
#             }
#         })
        
#     except Exception as e:
#         print(f"❌ Lỗi khi lấy thống kê điểm danh: {str(e)}")
#         return jsonify({"success": False, "message": str(e)}), 500

# @attendance_bp.route("/checkin", methods=["POST", "OPTIONS"])
# def checkin_attendance():
#     """Check-in điểm danh"""
#     if request.method == "OPTIONS":
#         return jsonify({"success": True}), 200
        
#     try:
#         data = request.json
#         employee_id = data.get('employee_id')
#         checkin_time = data.get('checkin_time')
#         location = data.get('location', 'Văn phòng')
        
#         if not employee_id:
#             return jsonify({
#                 "success": False, 
#                 "message": "Thiếu tham số employee_id"
#             }), 400

#         conn = get_connection()
#         cursor = conn.cursor()
        
#         # Kiểm tra nhân viên tồn tại
#         cursor.execute("""
#             SELECT id FROM employee_information WHERE id = %s AND deleted_at IS NULL
#         """, (employee_id,))
        
#         if not cursor.fetchone():
#             return jsonify({"success": False, "message": "Không tìm thấy nhân viên"}), 404
        
#         # Ngày hiện tại
#         today = datetime.now().strftime('%Y-%m-%d')
        
#         # Kiểm tra đã check-in chưa
#         cursor.execute("""
#             SELECT id FROM attendances 
#             WHERE employee_id = %s AND date = %s AND checkin_time IS NOT NULL
#         """, (employee_id, today))
        
#         if cursor.fetchone():
#             return jsonify({
#                 "success": False, 
#                 "message": "Bạn đã check-in hôm nay"
#             }), 400
        
#         # Xác định trạng thái (đúng giờ hay muộn)
#         current_time = datetime.now()
#         checkin_status = 'present'
        
#         # Giờ check-in tiêu chuẩn (8:00 AM)
#         standard_checkin = current_time.replace(hour=8, minute=0, second=0, microsecond=0)
        
#         if current_time > standard_checkin + timedelta(minutes=15):  # Muộn 15 phút
#             checkin_status = 'late'
        
#         # Tạo hoặc cập nhật bản ghi điểm danh
#         cursor.execute("""
#             INSERT INTO attendances 
#                 (employee_id, date, checkin_time, status, location, actual_hours)
#             VALUES (%s, %s, %s, %s, %s, 0)
#             ON DUPLICATE KEY UPDATE 
#                 checkin_time = VALUES(checkin_time),
#                 status = VALUES(status),
#                 location = VALUES(location),
#                 updated_at = CURRENT_TIMESTAMP
#         """, (employee_id, today, current_time, checkin_status, location))
        
#         conn.commit()
        
#         cursor.close()
#         conn.close()
        
#         return jsonify({
#             "success": True,
#             "message": f"Check-in thành công lúc {current_time.strftime('%H:%M')}",
#             "data": {
#                 "checkin_time": current_time.isoformat(),
#                 "status": checkin_status,
#                 "location": location
#             }
#         })
        
#     except Exception as e:
#         print(f"❌ Lỗi khi check-in: {str(e)}")
#         return jsonify({"success": False, "message": str(e)}), 500

# @attendance_bp.route("/checkout", methods=["POST", "OPTIONS"])
# def checkout_attendance():
#     """Check-out điểm danh"""
#     if request.method == "OPTIONS":
#         return jsonify({"success": True}), 200
        
#     try:
#         data = request.json
#         employee_id = data.get('employee_id')
        
#         if not employee_id:
#             return jsonify({
#                 "success": False, 
#                 "message": "Thiếu tham số employee_id"
#             }), 400

#         conn = get_connection()
#         cursor = conn.cursor()
        
#         # Ngày hiện tại
#         today = datetime.now().strftime('%Y-%m-%d')
        
#         # Kiểm tra đã check-in chưa
#         cursor.execute("""
#             SELECT id, checkin_time FROM attendances 
#             WHERE employee_id = %s AND date = %s
#         """, (employee_id, today))
        
#         attendance = cursor.fetchone()
        
#         if not attendance:
#             return jsonify({
#                 "success": False, 
#                 "message": "Bạn chưa check-in hôm nay"
#             }), 400
        
#         attendance_id, checkin_time = attendance
        
#         # Kiểm tra đã check-out chưa
#         cursor.execute("""
#             SELECT checkout_time FROM attendances 
#             WHERE id = %s AND checkout_time IS NOT NULL
#         """, (attendance_id,))
        
#         if cursor.fetchone():
#             return jsonify({
#                 "success": False, 
#                 "message": "Bạn đã check-out hôm nay"
#             }), 400
        
#         # Tính tổng giờ làm việc
#         checkout_time = datetime.now()
#         work_duration = checkout_time - checkin_time
#         actual_hours = work_duration.total_seconds() / 3600  # Chuyển sang giờ
        
#         # Cập nhật check-out và tổng giờ
#         cursor.execute("""
#             UPDATE attendances 
#             SET checkout_time = %s, 
#                 actual_hours = %s,
#                 updated_at = CURRENT_TIMESTAMP
#             WHERE id = %s
#         """, (checkout_time, actual_hours, attendance_id))
        
#         conn.commit()
        
#         cursor.close()
#         conn.close()
        
#         return jsonify({
#             "success": True,
#             "message": f"Check-out thành công lúc {checkout_time.strftime('%H:%M')}",
#             "data": {
#                 "checkout_time": checkout_time.isoformat(),
#                 "actual_hours": round(actual_hours, 2),
#                 "work_duration": str(work_duration).split('.')[0]  # Loại bỏ microsecond
#             }
#         })
        
#     except Exception as e:
#         print(f"❌ Lỗi khi check-out: {str(e)}")
#         return jsonify({"success": False, "message": str(e)}), 500