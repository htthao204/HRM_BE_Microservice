# services/attendance_log_service.py
from datetime import datetime, timedelta
from config.db import get_connection
import psycopg2
from psycopg2.extras import DictCursor

class AttendanceLogService:
    
    # Thêm constants cho giới hạn
    MAX_ATTENDANCE_PER_DAY = 10  # Tối đa 10 lần điểm danh/ngày
    MINUTES_BETWEEN_SAME_ACTION = 5  # 5 phút chờ giữa cùng action
    MAX_SWITCHES_PER_DAY = 6  # Tối đa 6 lần chuyển đổi CHECKIN/CHECKOUT

    @staticmethod
    def log_attendance(employee_id, action="CHECKIN", source="FACE_RECOGNITION", status="SUCCESS", location=None):
        """
        Ghi log điểm danh vào bảng attendance_logs với các giới hạn
        """
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=DictCursor)

        now = datetime.now()
        now_str = now.strftime("%Y-%m-%d %H:%M:%S")
        today = now.strftime("%Y-%m-%d")

        valid_sources = ['DEVICE', 'FACE_RECOGNITION', 'MANUAL', 'MOBILE']
        
        if source not in valid_sources:
            print(f"⚠️ Source '{source}' không hợp lệ, chuyển về 'FACE_RECOGNITION'")
            source = 'FACE_RECOGNITION'

        print(f"🔧 Using valid source: {source} for employee {employee_id}")

        # 1. KIỂM TRA TỔNG SỐ LẦN ĐIỂM DANH TRONG NGÀY
        cursor.execute("""
            SELECT COUNT(*) as today_count 
            FROM attendance_logs 
            WHERE employee_id = %s AND DATE(log_time) = CURRENT_DATE
        """, (employee_id,))
        
        today_count_result = cursor.fetchone()
        today_count = today_count_result["today_count"] if today_count_result else 0
        
        if today_count >= AttendanceLogService.MAX_ATTENDANCE_PER_DAY:
            cursor.close()
            conn.close()
            return {
                "success": False,
                "error": "daily_limit_exceeded",
                "message": f"Bạn đã điểm danh {today_count} lần hôm nay. Giới hạn tối đa là {AttendanceLogService.MAX_ATTENDANCE_PER_DAY} lần/ngày."
            }

        # 2. KIỂM TRA SỐ LẦN CHUYỂN ĐỔI CHECKIN/CHECKOUT
        cursor.execute("""
            SELECT action, COUNT(*) as switch_count
            FROM (
                SELECT action, 
                       LAG(action) OVER (ORDER BY log_time) as prev_action
                FROM attendance_logs 
                WHERE employee_id = %s AND DATE(log_time) = CURRENT_DATE
                ORDER BY log_time
            ) as switches
            WHERE action != prev_action OR prev_action IS NULL
            GROUP BY action
        """, (employee_id,))
        
        switch_results = cursor.fetchall()
        total_switches = sum(result["switch_count"] for result in switch_results)
        
        if total_switches >= AttendanceLogService.MAX_SWITCHES_PER_DAY:
            cursor.close()
            conn.close()
            return {
                "success": False,
                "error": "switch_limit_exceeded",
                "message": f"Bạn đã chuyển đổi CHECKIN/CHECKOUT {total_switches} lần hôm nay. Giới hạn tối đa là {AttendanceLogService.MAX_SWITCHES_PER_DAY} lần/ngày."
            }

        # 3. KIỂM TRA LOG GẦN NHẤT (giữ nguyên logic cũ)
        cursor.execute("""
            SELECT log_time, action FROM attendance_logs
            WHERE employee_id = %s AND DATE(log_time) = CURRENT_DATE
            ORDER BY log_time DESC
            LIMIT 1
        """, (employee_id,))
        last_log = cursor.fetchone()

        should_log = False
        remaining_minutes = 0
        
        if not last_log:
            should_log = True
        else:
            last_time = last_log["log_time"]
            last_action = last_log["action"]
            
            if action != last_action:
                should_log = True
            else:
                time_diff = now - last_time
                remaining_minutes = max(0, AttendanceLogService.MINUTES_BETWEEN_SAME_ACTION - (time_diff.total_seconds() / 60))
                
                if time_diff >= timedelta(minutes=AttendanceLogService.MINUTES_BETWEEN_SAME_ACTION):
                    should_log = True
                else:
                    print(f"⏸ Bỏ qua log {action} (chưa đủ {AttendanceLogService.MINUTES_BETWEEN_SAME_ACTION} phút cho {employee_id}, còn {remaining_minutes:.1f} phút)")

        if should_log:
            query = """
                INSERT INTO attendance_logs (employee_id, log_time, action, source, status, location)
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            try:
                cursor.execute(query, (employee_id, now_str, action, source, status, location))
                conn.commit()
                print(f"✅ Ghi log thành công: {employee_id} - {action} - {source} lúc {now_str}")
                
                cursor.close()
                conn.close()
                return {
                    "success": True,
                    "action": action,
                    "timestamp": now_str,
                    "today_count": today_count + 1,
                    "remaining_today": AttendanceLogService.MAX_ATTENDANCE_PER_DAY - (today_count + 1)
                }
            except Exception as e:
                print(f"❌ Lỗi database khi ghi log: {str(e)}")
                conn.rollback()
                cursor.close()
                conn.close()
                return {
                    "success": False,
                    "error": f"Lỗi database: {str(e)}"
                }
        else:
            last_time_str = last_log["log_time"].strftime("%H:%M:%S") if last_log else "N/A"
            print(f"⏸ Bỏ qua log {action} (chưa đủ {AttendanceLogService.MINUTES_BETWEEN_SAME_ACTION} phút cho {employee_id})")
            cursor.close()
            conn.close()
            return {
                "success": False,
                "error": "attendance_cooldown",
                "message": f"Bạn vừa điểm danh {last_log['action']} lúc {last_time_str}. Vui lòng chờ thêm {remaining_minutes:.1f} phút trước khi điểm danh {action} tiếp theo.",
                "last_action": last_log["action"] if last_log else None,
                "last_time": last_time_str,
                "remaining_minutes": remaining_minutes,
                "next_available_time": (last_log["log_time"] + timedelta(minutes=AttendanceLogService.MINUTES_BETWEEN_SAME_ACTION)).strftime("%H:%M:%S") if last_log else None
            }

    @staticmethod
    def mark_attendance(employee_id, action="CHECKIN", source="FACE_RECOGNITION", location=None):
        """
        Ghi điểm danh - hàm chính để các service khác gọi
        """
        try:
            # Xác định action nếu không chỉ định
            if action == "AUTO":
                action = AttendanceLogService.determine_attendance_action(employee_id)
            
            # Ghi log điểm danh
            result = AttendanceLogService.log_attendance(employee_id, action, source, "SUCCESS", location)
            
            if result["success"]:
                return {
                    "success": True,
                    "action": action,
                    "employee_id": employee_id,
                    "timestamp": result["timestamp"],
                    "today_count": result["today_count"],
                    "remaining_today": result["remaining_today"],
                    "message": f"Điểm danh {action} thành công lúc {result['timestamp']} ({result['today_count']}/{AttendanceLogService.MAX_ATTENDANCE_PER_DAY} lần hôm nay)"
                }
            else:
                # Xử lý các loại lỗi
                error_type = result.get("error")
                if error_type == "attendance_cooldown":
                    return {
                        "success": False,
                        "error": "attendance_cooldown",
                        "message": result["message"],
                        "last_action": result.get("last_action"),
                        "last_time": result.get("last_time"),
                        "remaining_minutes": result.get("remaining_minutes"),
                        "next_available_time": result.get("next_available_time")
                    }
                elif error_type == "daily_limit_exceeded":
                    return {
                        "success": False,
                        "error": "daily_limit_exceeded",
                        "message": result["message"]
                    }
                elif error_type == "switch_limit_exceeded":
                    return {
                        "success": False,
                        "error": "switch_limit_exceeded", 
                        "message": result["message"]
                    }
                else:
                    return {
                        "success": False,
                        "message": result.get("error", "Lỗi khi điểm danh")
                    }
                
        except Exception as e:
            print(f"❌ Lỗi mark_attendance: {str(e)}")
            return {
                "success": False,
                "message": f"Lỗi hệ thống: {str(e)}"
            }

   
    @staticmethod
    def get_attendance_history(filters):
        """
        Service lấy lịch sử điểm danh từ bảng attendance_logs
        """
        try:
            employee_id = filters.get('employee_id')
            employee_code = filters.get('employee_code')
            start_date = filters.get('start_date')
            end_date = filters.get('end_date')
            date = filters.get('date')
            page = filters.get('page', 1)
            page_size = filters.get('page_size', 20)
            status = filters.get('status')
            
            offset = (page - 1) * page_size
            
            conn = get_connection()
            cursor = conn.cursor(cursor_factory=DictCursor)  # Sửa thành DictCursor
            
            # Build query
            query = """
                SELECT 
                    al.id,
                    al.employee_id,
                    ei.employee_code,
                    ei.full_name as name,
                    al.log_time as timestamp,
                    DATE(al.log_time) as date,
                    al.log_time::time as time,
                    al.action,
                    al.status,
                    al.location,
                    al.device_id,
                    al.source,
                    al.notes,
                    al.created_at
                FROM attendance_logs al
                JOIN employee_information ei ON al.employee_id = ei.id
                WHERE 1=1
            """
            params = []
            
            if employee_id:
                query += " AND al.employee_id = %s"
                params.append(employee_id)
                
            if employee_code:
                query += " AND ei.employee_code = %s"
                params.append(employee_code)
                
            if start_date and end_date:
                query += " AND DATE(al.log_time) BETWEEN %s AND %s"
                params.extend([start_date, end_date])
            elif date:
                query += " AND al.log_time >= %s AND al.log_time < (%s::date + INTERVAL '1 day')"
                params.extend([date, date])

                
            if status:
                status_mapping_to_db = {
                    'present': 'SUCCESS',
                    'absent': 'FAILED',
                    'late': 'LATE', 
                    'early_leave': 'EARLY'
                }
                db_status = status_mapping_to_db.get(status, status)
                query += " AND al.status = %s"
                params.append(db_status)
                
            # SỬA LẠI PHẦN ĐẾM RECORDS - TÁCH RIÊNG
            count_query = "SELECT COUNT(*) as total FROM (" + query + ") as count_table"
            
            # Thực hiện count query với params
            cursor.execute(count_query, params)
            count_result = cursor.fetchone()
            total_count = count_result['total'] if count_result else 0
            
            # Add pagination cho main query
            query += " ORDER BY al.log_time DESC LIMIT %s OFFSET %s"
            params.extend([page_size, offset])
            
            # Thực hiện main query
            cursor.execute(query, params)
            records = cursor.fetchall()
            
            # Format records
            formatted_records = []
            for record in records:
                status_mapping_to_frontend = {
                    'SUCCESS': 'present',
                    'FAILED': 'absent', 
                    'LATE': 'late',
                    'EARLY': 'early_leave'
                }
                
                frontend_status = status_mapping_to_frontend.get(record['status'], record['status'])
                
                formatted_records.append({
                    "id": record['id'],
                    "employee_id": record['employee_id'],
                    "employee_code": record['employee_code'],
                    "name": record['name'],
                    "timestamp": record['timestamp'].isoformat() if record['timestamp'] else None,
                    "date": record['date'].isoformat() if record['date'] else None,
                    "time": str(record['time']),
                    "action": record['action'],
                    "status": frontend_status,
                    "location": record['location'],
                    "device_id": record['device_id'],
                    "source": record['source'],
                    "notes": record['notes'],
                    "created_at": record['created_at'].isoformat() if record['created_at'] else None,
                    "confidence": 95.0
                })
            
            cursor.close()
            conn.close()
            
            return {
                "success": True,
                "records": formatted_records,
                "total_count": total_count,
                "page": page,
                "page_size": page_size,
                "total_pages": (total_count + page_size - 1) // page_size
            }
            
        except Exception as e:
            print(f"❌ Lỗi service lấy lịch sử điểm danh: {str(e)}")
            return {
                "success": False,
                "message": str(e)
            }
    