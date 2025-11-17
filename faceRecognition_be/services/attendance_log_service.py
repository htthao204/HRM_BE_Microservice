# services/attendance_log_service.py
from datetime import datetime, timedelta
from config.db import get_connection
import psycopg2
from psycopg2.extras import DictCursor

class AttendanceLogService:
    @staticmethod
    def log_attendance(employee_id, action="CHECKIN", source="FACE_RECOGNITION", status="SUCCESS", location=None):
        """
        Ghi log điểm danh vào bảng attendance_logs
        """
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=DictCursor)

        now = datetime.now()
        now_str = now.strftime("%Y-%m-%d %H:%M:%S")

        valid_sources = ['DEVICE', 'FACE_RECOGNITION', 'MANUAL', 'MOBILE']
        
        if source not in valid_sources:
            print(f"⚠️ Source '{source}' không hợp lệ, chuyển về 'FACE_RECOGNITION'")
            source = 'FACE_RECOGNITION'

        print(f"🔧 Using valid source: {source} for employee {employee_id}")

        # Kiểm tra log gần nhất trong ngày
        cursor.execute("""
            SELECT log_time, action FROM attendance_logs
            WHERE employee_id = %s AND DATE(log_time) = CURRENT_DATE
            ORDER BY log_time DESC
            LIMIT 1
        """, (employee_id,))
        last_log = cursor.fetchone()

        should_log = False
        if not last_log:
            should_log = True
        else:
            last_time = last_log["log_time"]
            last_action = last_log["action"]
            
            if action != last_action:
                should_log = True
            elif now - last_time >= timedelta(minutes=5):
                should_log = True

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
                return True
            except Exception as e:
                print(f"❌ Lỗi database khi ghi log: {str(e)}")
                conn.rollback()
                cursor.close()
                conn.close()
                return False
        else:
            print(f"⏸ Bỏ qua log {action} (chưa đủ 5 phút cho {employee_id})")
            cursor.close()
            conn.close()
            return False

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
            success = AttendanceLogService.log_attendance(employee_id, action, source, "SUCCESS", location)
            
            if success:
                return {
                    "success": True,
                    "action": action,
                    "employee_id": employee_id,
                    "timestamp": datetime.now().isoformat(),
                    "message": f"Điểm danh {action} thành công"
                }
            else:
                return {
                    "success": False,
                    "message": f"Thao tác {action} bị từ chối (chưa đủ thời gian)"
                }
                
        except Exception as e:
            print(f"❌ Lỗi mark_attendance: {str(e)}")
            return {
                "success": False,
                "message": f"Lỗi hệ thống: {str(e)}"
            }

    @staticmethod
    def determine_attendance_action(employee_id):
        """
        Xác định nên checkin hay checkout dựa trên log gần nhất
        """
        try:
            conn = get_connection()
            cursor = conn.cursor(cursor_factory=DictCursor)
            
            cursor.execute("""
                SELECT action FROM attendance_logs 
                WHERE employee_id = %s AND DATE(log_time) = CURRENT_DATE
                ORDER BY log_time DESC 
                LIMIT 1
            """, (employee_id,))
            
            last_log = cursor.fetchone()
            cursor.close()
            conn.close()
            
            if not last_log or last_log["action"] == "CHECKOUT":
                return "CHECKIN"
            else:
                return "CHECKOUT"
                
        except Exception as e:
            print(f"⚠️ Lỗi xác định action: {str(e)}")
            return "CHECKIN"

    @staticmethod
    def get_attendance_status(employee_id):
        """
        Kiểm tra trạng thái điểm danh hiện tại
        """
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=DictCursor)
        
        cursor.execute("""
            SELECT action, log_time, source, status
            FROM attendance_logs 
            WHERE employee_id = %s AND DATE(log_time) = CURRENT_DATE
            ORDER BY log_time DESC 
            LIMIT 1
        """, (employee_id,))
        
        last_log = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        return {
            "last_action": last_log["action"] if last_log else None,
            "last_log_time": last_log["log_time"].isoformat() if last_log else None,
            "source": last_log["source"] if last_log else None,
            "status": last_log["status"] if last_log else None,
            "next_action": "CHECKIN" if not last_log or last_log["action"] == "CHECKOUT" else "CHECKOUT"
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
            cursor = conn.cursor()
            
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
                query += " AND DATE(al.log_time) = %s"
                params.append(date)
                
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
                
            # Count total records
            count_query = "SELECT COUNT(*) FROM (" + query + ") as count_table"
            cursor.execute(count_query, params)
            total_count = cursor.fetchone()[0]
            
            # Add pagination
            query += " ORDER BY al.log_time DESC LIMIT %s OFFSET %s"
            params.extend([page_size, offset])
            
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
                
                frontend_status = status_mapping_to_frontend.get(record[8], record[8])
                
                formatted_records.append({
                    "id": record[0],
                    "employee_id": record[1],
                    "employee_code": record[2],
                    "name": record[3],
                    "timestamp": record[4].isoformat(),
                    "date": record[5].isoformat(),
                    "time": str(record[6]),
                    "action": record[7],
                    "status": frontend_status,
                    "location": record[9],
                    "device_id": record[10],
                    "source": record[11],
                    "notes": record[12],
                    "created_at": record[13].isoformat() if record[13] else None,
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