# services/attendance_log_service.py
import logging
from datetime import datetime, timedelta
from config.db import get_connection
from psycopg2.extras import DictCursor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AttendanceLogService:
    
    # Giới hạn điểm danh - TĂNG GIỚI HẠN ĐỂ TEST
    MAX_ATTENDANCE_PER_DAY = 50  # Tăng lên để test
    MINUTES_BETWEEN_SAME_ACTION = 0.1  # Giảm xuống 6 GIÂY để test
    MAX_SWITCHES_PER_DAY = 20  # Tăng lên

    @staticmethod
    def _get_today_date():
        """Lấy ngày hiện tại theo timezone Việt Nam"""
        return datetime.now().strftime('%Y-%m-%d')

    @staticmethod
    def log_attendance(employee_id, action="CHECKIN", source="FACE_RECOGNITION", status="SUCCESS", location=None):
        """
        Ghi log điểm danh (phiên bản cũ - KHÔNG lưu similarity)
        → Giữ lại để tương thích nếu có nơi khác gọi
        """
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=DictCursor)

        now = datetime.now()
        today_date = AttendanceLogService._get_today_date()

        valid_sources = ['DEVICE', 'FACE_RECOGNITION', 'MANUAL', 'MOBILE', 'FACE_RECOGNITION_REALTIME']
        if source not in valid_sources:
            source = 'FACE_RECOGNITION'

        # DEBUG: Kiểm tra số bản ghi thực tế
        cursor.execute("""
            SELECT COUNT(*) as today_count, 
                   string_agg(CONCAT(action, ' at ', log_time::text), '; ') as logs_info
            FROM attendance_logs 
            WHERE employee_id = %s AND DATE(log_time) = %s
        """, (employee_id, today_date))
        
        debug_result = cursor.fetchone()
        today_count = debug_result["today_count"] or 0
        logs_info = debug_result["logs_info"] or "Không có bản ghi"
        
        logger.info(f"🔍 DEBUG log_attendance: employee_id={employee_id}, today_count={today_count}, today_date={today_date}, logs_info={logs_info}")

        if today_count >= AttendanceLogService.MAX_ATTENDANCE_PER_DAY:
            cursor.close()
            conn.close()
            return {
                "success": False,
                "error": "daily_limit_exceeded",
                "message": f"Đã vượt quá {AttendanceLogService.MAX_ATTENDANCE_PER_DAY} lần điểm danh hôm nay.",
                "debug_info": {
                    "today_count": today_count,
                    "today_date": today_date,
                    "max_allowed": AttendanceLogService.MAX_ATTENDANCE_PER_DAY,
                    "existing_logs": logs_info
                }
            }

        # Kiểm tra số lần chuyển đổi CHECKIN/CHECKOUT
        cursor.execute("""
            SELECT COUNT(*) as switch_count FROM (
                SELECT action,
                       LAG(action) OVER (ORDER BY log_time) as prev_action
                FROM attendance_logs 
                WHERE employee_id = %s AND DATE(log_time) = %s
            ) t WHERE action != prev_action OR prev_action IS NULL
        """, (employee_id, today_date))
        
        switch_count = cursor.fetchone()["switch_count"] or 0

        if switch_count >= AttendanceLogService.MAX_SWITCHES_PER_DAY:
            cursor.close()
            conn.close()
            return {
                "success": False,
                "error": "switch_limit_exceeded",
                "message": "Đã vượt quá số lần chuyển đổi trạng thái trong ngày.",
                "switch_count": switch_count
            }

        # ❌ TẠM THỜI BỎ QUA KIỂM TRA COOLDOWN TRONG HÀM CŨ
        # Để tránh xung đột với hàm mới
        should_log = True

        if should_log:
            query = """
                INSERT INTO attendance_logs (employee_id, log_time, action, source, status, location)
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            try:
                cursor.execute(query, (employee_id, now, action, source, status, location or "Hệ thống nhận diện khuôn mặt"))
                conn.commit()
                logger.info(f"Đã ghi log (không similarity): {employee_id} - {action} - Ngày: {today_date}")
            except Exception as e:
                logger.error(f"Lỗi ghi log cũ: {e}")
                conn.rollback()
                cursor.close()
                conn.close()
                return {"success": False, "error": f"Database error: {str(e)}"}
        else:
            cursor.close()
            conn.close()
            return {
                "success": False,
                "error": "cooldown",
                "remaining_minutes": 0,
                "last_action": None,
                "last_time": None
            }

        cursor.close()
        conn.close()
        return {"success": True, "action": action, "today_date": today_date}

    @staticmethod
    def mark_attendance(employee_id: int, source: str = "FACE_RECOGNITION", location: str = None, 
                       similarity: float = None, spoof_check: dict = None):  # THÊM spoof_check PARAMETER
        """
        HÀM CHÍNH ĐƯỢC DÙNG CHO NHẬN DIỆN KHUÔN MẶT
        → BẮT BUỘC DÙNG HÀM NÀY ĐỂ LƯU similarity_score VÀ spoof_check
        """
        conn = None
        cursor = None
        try:
            conn = get_connection()
            cursor = conn.cursor(cursor_factory=DictCursor)
            
            # Lấy ngày hiện tại theo timezone Việt Nam
            today_date = AttendanceLogService._get_today_date()
            logger.info(f"📅 Today's date (VN timezone): {today_date}")
            
            # DEBUG: Kiểm tra chi tiết số bản ghi
            cursor.execute("""
                SELECT 
                    COUNT(*) as today_count,
                    string_agg(CONCAT(action, ' at ', log_time::text), '; ') as logs_info,
                    COUNT(CASE WHEN action = 'CHECKIN' THEN 1 END) as checkin_count,
                    COUNT(CASE WHEN action = 'CHECKOUT' THEN 1 END) as checkout_count
                FROM attendance_logs 
                WHERE employee_id = %s AND DATE(log_time) = %s
                AND status = 'SUCCESS'
            """, (employee_id, today_date))
            
            debug_result = cursor.fetchone()
            today_count = debug_result["today_count"] if debug_result else 0
            logs_info = debug_result["logs_info"] if debug_result and debug_result["logs_info"] else "Không có bản ghi"
            checkin_count = debug_result["checkin_count"] if debug_result else 0
            checkout_count = debug_result["checkout_count"] if debug_result else 0
            
            logger.info(f"🔍 DEBUG mark_attendance: employee_id={employee_id}, today_count={today_count}, today_date={today_date}, checkin_count={checkin_count}, checkout_count={checkout_count}")
            logger.info(f"📋 Existing logs: {logs_info}")
            
            if today_count >= AttendanceLogService.MAX_ATTENDANCE_PER_DAY:
                cursor.close()
                conn.close()
                return {
                    "success": False,
                    "error": "daily_limit_exceeded",
                    "message": f"Đã vượt quá {AttendanceLogService.MAX_ATTENDANCE_PER_DAY} lần điểm danh hôm nay.",
                    "today_count": today_count,
                    "today_date": today_date,
                    "max_allowed": AttendanceLogService.MAX_ATTENDANCE_PER_DAY,
                    "debug_info": {
                        "existing_logs": logs_info,
                        "checkin_count": checkin_count,
                        "checkout_count": checkout_count
                    }
                }
            
            # Kiểm tra số lần chuyển đổi CHECKIN/CHECKOUT - CHỈ KHI CÓ BẢN GHI
            switch_count = 0
            if today_count > 0:
                cursor.execute("""
                    SELECT COUNT(*) as switch_count FROM (
                        SELECT action, 
                            LAG(action) OVER (ORDER BY log_time) as prev_action
                        FROM attendance_logs 
                        WHERE employee_id = %s AND DATE(log_time) = %s
                        AND status = 'SUCCESS'
                    ) t WHERE action != prev_action OR prev_action IS NULL
                """, (employee_id, today_date))
                result = cursor.fetchone()
                switch_count = result["switch_count"] if result else 0
            
            logger.info(f"🔄 Switch count: {switch_count}/{AttendanceLogService.MAX_SWITCHES_PER_DAY}")
            
            if switch_count >= AttendanceLogService.MAX_SWITCHES_PER_DAY:
                cursor.close()
                conn.close()
                return {
                    "success": False,
                    "error": "switch_limit_exceeded", 
                    "message": "Đã vượt quá số lần chuyển đổi trạng thái trong ngày.",
                    "switch_count": switch_count,
                    "max_switches": AttendanceLogService.MAX_SWITCHES_PER_DAY
                }
            
            # ✅ SỬA: CHỈ KIỂM TRA COOLDOWN CHO CHECKIN, KHÔNG KIỂM TRA CHO CHECKOUT
            last_log = None
            if today_count > 0:
                cursor.execute("""
                    SELECT log_time, action FROM attendance_logs
                    WHERE employee_id = %s AND DATE(log_time) = %s
                    AND status = 'SUCCESS'
                    ORDER BY log_time DESC LIMIT 1
                """, (employee_id, today_date))
                last_log = cursor.fetchone()
            
            now = datetime.now()
            if last_log:
                last_time = last_log["log_time"]
                last_action = last_log["action"]
                time_diff = now - last_time
                
                logger.info(f"⏰ Last action: {last_action} at {last_time}, time diff: {time_diff.total_seconds() / 60:.1f} minutes")
                
                # ✅ SỬA: CHỈ KIỂM TRA COOLDOWN NẾU CÙNG ACTION LÀ CHECKIN
                # Cho phép CHECKOUT bất kỳ lúc nào
                if last_action == "CHECKIN" and time_diff < timedelta(minutes=AttendanceLogService.MINUTES_BETWEEN_SAME_ACTION):
                    remaining_seconds = AttendanceLogService.MINUTES_BETWEEN_SAME_ACTION * 60 - time_diff.total_seconds()
                    remaining_minutes = remaining_seconds / 60
                    
                    cursor.close()
                    conn.close()
                    return {
                        "success": False,
                        "error": "cooldown",
                        "remaining_minutes": round(remaining_minutes, 1),
                        "remaining_seconds": round(remaining_seconds, 1),
                        "last_action": last_action,
                        "last_time": last_time.isoformat() if last_time else None,
                        "message": f"Vui lòng chờ {round(remaining_seconds, 1)} giây trước khi điểm danh lại"
                    }
            
            # XỬ LÝ SPOOF_CHECK DATA - PHẦN MỚI
            spoof_status = "REAL"
            spoof_confidence = 1.0
            spoof_method = "NONE"
            spoof_indicators = None
            
            if spoof_check:
                spoof_status = "REAL" if spoof_check.get("is_real", True) else "SPOOF_DETECTED"
                spoof_confidence = spoof_check.get("confidence", 1.0)
                spoof_method = spoof_check.get("method", "unknown")
                spoof_indicators = spoof_check.get("indicators")
                
                logger.info(f"🛡️ Anti-spoofing result: {spoof_status} (confidence: {spoof_confidence:.3f}, method: {spoof_method})")

            # GHI LOG VỚI SIMILARITY_SCORE VÀ SPOOF_CHECK
            similarity_value = None
            if similarity is not None:
                try:
                    similarity_value = round(float(similarity), 4)
                    if similarity_value < 0:
                        similarity_value = 0.0
                    if similarity_value > 1.0:
                        similarity_value = 1.0
                except:
                    similarity_value = None
            
            # CẬP NHẬT QUERY ĐỂ THÊM SPOOF_CHECK FIELDS
            query = """
                INSERT INTO attendance_logs 
                (employee_id, log_time, action, source, status, location, 
                 similarity_score, spoof_status, spoof_confidence, spoof_method, spoof_indicators, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """
            cursor.execute(query, (
                employee_id,
                now,
                "CHECKIN",  # ✅ LUÔN LÀ CHECKIN CHO NHẬN DIỆN KHUÔN MẶT
                source,
                "SUCCESS", 
                location or "Hệ thống nhận diện khuôn mặt",
                similarity_value,
                spoof_status,
                spoof_confidence,
                spoof_method,
                str(spoof_indicators) if spoof_indicators else None,
                now
            ))
            
            log_id = cursor.fetchone()[0]
            conn.commit()
            
            logger.info(f"✅ Điểm danh thành công: {employee_id} | Similarity: {similarity_value} | Anti-spoof: {spoof_status} ({spoof_confidence:.3f}) | Lần thứ {today_count + 1} | Ngày: {today_date}")
            
            return {
                "success": True,
                "log_id": log_id,
                "action": "CHECKIN", 
                "status": "SUCCESS",
                "similarity": similarity_value,
                "spoof_check": {
                    "status": spoof_status,
                    "confidence": spoof_confidence,
                    "method": spoof_method
                },
                "today_count": today_count + 1,
                "today_date": today_date,
                "message": "Điểm danh thành công"
            }
            
        except Exception as e:
            logger.error(f"❌ Lỗi mark_attendance: {e}")
            return {"success": False, "error": str(e)}
        finally:
            try:
                if cursor:
                    cursor.close()
                if conn:
                    conn.close()
            except:
                pass

    # ... (CÁC PHƯƠNG THỨC KHÁC GIỮ NGUYÊN) ...

    @staticmethod
    def force_attendance(employee_id: int, source: str = "MANUAL", location: str = None, 
                        similarity: float = None, spoof_check: dict = None):  # THÊM spoof_check
        """
        Hàm điểm danh bắt buộc - BỎ QUA TẤT CẢ GIỚI HẠN
        Chỉ dùng cho testing hoặc trường hợp khẩn cấp
        """
        conn = None
        cursor = None
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            now = datetime.now()
            today_date = AttendanceLogService._get_today_date()
            
            similarity_value = None
            if similarity is not None:
                try:
                    similarity_value = round(float(similarity), 4)
                except:
                    similarity_value = None
            
            # XỬ LÝ SPOOF_CHECK CHO FORCE ATTENDANCE
            spoof_status = "REAL"
            spoof_confidence = 1.0
            spoof_method = "FORCED"
            
            if spoof_check:
                spoof_status = "REAL" if spoof_check.get("is_real", True) else "SPOOF_DETECTED"
                spoof_confidence = spoof_check.get("confidence", 1.0)
                spoof_method = spoof_check.get("method", "forced")
            
            query = """
                INSERT INTO attendance_logs 
                (employee_id, log_time, action, source, status, location, 
                 similarity_score, spoof_status, spoof_confidence, spoof_method, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """
            cursor.execute(query, (
                employee_id,
                now,
                "CHECKIN",
                source,
                "SUCCESS", 
                location or "Hệ thống điểm danh bắt buộc",
                similarity_value,
                spoof_status,
                spoof_confidence,
                spoof_method,
                now
            ))
            
            log_id = cursor.fetchone()[0]
            conn.commit()
            
            logger.warning(f"⚠️ Điểm danh BẮT BUỘC: {employee_id} | Similarity: {similarity_value} | Anti-spoof: {spoof_status} | Ngày: {today_date}")
            
            return {
                "success": True,
                "log_id": log_id,
                "action": "CHECKIN", 
                "status": "SUCCESS",
                "similarity": similarity_value,
                "spoof_check": {
                    "status": spoof_status,
                    "confidence": spoof_confidence,
                    "method": spoof_method
                },
                "message": "Điểm danh bắt buộc thành công (bỏ qua giới hạn)",
                "forced": True
            }
            
        except Exception as e:
            logger.error(f"❌ Lỗi force_attendance: {e}")
            return {"success": False, "error": str(e)}
        finally:
            try:
                if cursor:
                    cursor.close()
                if conn:
                    conn.close()
            except:
                pass

    @staticmethod
    def reset_daily_limits(employee_id: int = None):
        """
        Reset giới hạn điểm danh (chỉ dùng cho testing)
        """
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            today_date = AttendanceLogService._get_today_date()
            
            if employee_id:
                # Xóa bản ghi của employee cụ thể
                cursor.execute("""
                    DELETE FROM attendance_logs 
                    WHERE employee_id = %s AND DATE(log_time) = %s
                """, (employee_id, today_date))
                message = f"Đã reset điểm danh cho employee {employee_id} ngày {today_date}"
            else:
                # Xóa tất cả bản ghi hôm nay
                cursor.execute("""
                    DELETE FROM attendance_logs 
                    WHERE DATE(log_time) = %s
                """, (today_date,))
                message = f"Đã reset TẤT CẢ điểm danh ngày {today_date}"
            
            conn.commit()
            cursor.close()
            conn.close()
            
            logger.warning(f"🔄 {message}")
            
            return {
                "success": True,
                "message": message
            }
            
        except Exception as e:
            logger.error(f"❌ Lỗi reset_daily_limits: {e}")
            return {"success": False, "error": str(e)}

    @staticmethod
    def get_attendance_history(filters):
        """
        Service lấy lịch sử điểm danh từ bảng attendance_logs
        CẬP NHẬT: Thêm thông tin anti-spoofing vào response
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
            cursor = conn.cursor(cursor_factory=DictCursor)
            
            # Build query - THÊM CÁC TRƯỜNG SPOOF_CHECK
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
                    al.created_at,
                    al.similarity_score,
                    al.spoof_status,
                    al.spoof_confidence,
                    al.spoof_method,
                    al.spoof_indicators
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
            
            # Format records - THÊM THÔNG TIN ANTI-SPOOFING
            formatted_records = []
            for record in records:
                status_mapping_to_frontend = {
                    'SUCCESS': 'present',
                    'FAILED': 'absent', 
                    'LATE': 'late',
                    'EARLY': 'early_leave'
                }
                
                frontend_status = status_mapping_to_frontend.get(record['status'], record['status'])
                
                # Tính confidence từ similarity_score
                confidence = 95.0  # Mặc định
                if record['similarity_score'] is not None:
                    confidence = round(record['similarity_score'] * 100, 2)
                
                # Thông tin anti-spoofing
                anti_spoofing_info = {
                    "status": record['spoof_status'] or "NOT_CHECKED",
                    "confidence": record['spoof_confidence'] or 1.0,
                    "method": record['spoof_method'] or "NONE"
                }
                
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
                    "confidence": confidence,
                    "similarity_score": record['similarity_score'],
                    "anti_spoofing": anti_spoofing_info  # THÊM THÔNG TIN ANTI-SPOOFING
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
            logger.error(f"❌ Lỗi service lấy lịch sử điểm danh: {str(e)}")
            return {
                "success": False,
                "message": str(e)
            }