# services/attendance_calendar_service.py
from datetime import datetime, timedelta
from config.db import get_connection

class AttendanceCalendarService:
    @staticmethod
    def get_monthly_calendar(employee_id, year, month):
        """
        Lấy lịch chấm công hàng tháng - TỰ ĐỘNG TỔNG HỢP từ log
        """
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            # 🟢 QUAN TRỌNG: Tổng hợp lại dữ liệu từ log trước khi lấy calendar
            start_date = f"{year}-{month:02d}-01"
            end_date = (datetime(year, month, 28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)
            end_date_str = end_date.strftime('%Y-%m-%d')
            
            # Gọi function tổng hợp attendance từ log
            cursor.execute("""
                SELECT * FROM recalculate_attendance_period(%s, %s, %s)
            """, (start_date, end_date_str, employee_id))
            
            # Lấy và xử lý kết quả (không cần dùng nhưng cần fetch để hoàn thành query)
            results = cursor.fetchall()
            print(f" Đã tổng hợp {len(results)} ngày cho nhân viên {employee_id}")
            
            # Commit để đảm bảo dữ liệu được cập nhật
            conn.commit()
            
            # Tiếp tục lấy calendar như bình thường
            calendar = []
            current_date = datetime(year, month, 1)
            last_day = (current_date.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)
            
            # Lấy ngày lễ
            holidays = AttendanceCalendarService._get_holidays(year, month)
            
            while current_date.month == month:
                date_str = current_date.strftime('%Y-%m-%d')
                is_weekend = current_date.weekday() >= 5
                is_holiday = current_date.date() in holidays
                
                # Lấy thông tin điểm danh (đã được tổng hợp)
                attendance_data = AttendanceCalendarService._get_daily_attendance(employee_id, current_date.date())
                
                calendar.append({
                    "date": date_str,
                    "day_of_week": current_date.strftime('%A'),
                    "is_weekend": is_weekend,
                    "is_holiday": is_holiday,
                    **attendance_data
                })
                
                current_date += timedelta(days=1)
            
            # Tính tổng hợp
            summary = AttendanceCalendarService._calculate_monthly_summary(calendar)
            
            cursor.close()
            conn.close()
            
            return {
                'success': True,
                'calendar': calendar,
                'summary': summary
            }
            
        except Exception as e:
            print(f"❌ Lỗi service get_monthly_calendar: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }

    @staticmethod
    def _get_holidays(year, month):
        """Lấy danh sách ngày lễ"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT holiday_date, name
                FROM holidays
                WHERE EXTRACT(YEAR FROM holiday_date) = %s
                  AND EXTRACT(MONTH FROM holiday_date) = %s
            """, (year, month))

            holidays = {row[0]: row[1] for row in cursor.fetchall()}
            cursor.close()
            conn.close()
            
            return holidays
        except Exception as e:
            print(f"❌ Lỗi lấy ngày lễ: {str(e)}")
            return {}

    @staticmethod
    def _get_daily_attendance(employee_id, date):
        """Lấy thông tin điểm danh theo ngày từ bảng attendances (đã tổng hợp)"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT 
                    status,
                    checkin_time,
                    checkout_time,
                    actual_hours,
                    late_minutes,
                    early_minutes,
                    notes
                FROM attendances
                WHERE employee_id = %s AND date = %s
            """, (employee_id, date))
            
            data = cursor.fetchone()
            cursor.close()
            conn.close()
            
            if data:
                status, checkin_time, checkout_time, actual_hours, late_minutes, early_minutes, notes = data
                return {
                    "status": status,
                    "check_in": checkin_time.isoformat() if checkin_time else None,
                    "check_out": checkout_time.isoformat() if checkout_time else None,
                    "actual_hours": float(actual_hours) if actual_hours else 0,
                    "late_minutes": late_minutes or 0,
                    "early_minutes": early_minutes or 0,
                    "notes": notes
                }
            else:
                return {
                    "status": "absent",
                    "check_in": None,
                    "check_out": None,
                    "actual_hours": 0,
                    "late_minutes": 0,
                    "early_minutes": 0,
                    "notes": None
                }
        except Exception as e:
            print(f"❌ Lỗi lấy daily attendance: {str(e)}")
            return {
                "status": "error",
                "check_in": None,
                "check_out": None,
                "actual_hours": 0,
                "late_minutes": 0,
                "early_minutes": 0,
                "notes": f"Lỗi: {str(e)}"
            }

    @staticmethod
    def _calculate_monthly_summary(calendar):
        """Tính tổng hợp hàng tháng"""
        try:
            total_days = len(calendar)
            working_days = len([d for d in calendar if not d['is_weekend'] and not d['is_holiday']])
            present_days = len([d for d in calendar if d['status'] == 'present'])
            late_days = len([d for d in calendar if d['status'] == 'late'])
            absent_days = len([d for d in calendar if d['status'] == 'absent'])
            half_days = len([d for d in calendar if d['status'] == 'half_day'])
            holidays_count = len([d for d in calendar if d['is_holiday']])
            weekends_count = len([d for d in calendar if d['is_weekend']])
            total_hours = sum([d['actual_hours'] for d in calendar])
            total_late_minutes = sum([d['late_minutes'] for d in calendar])
            total_early_minutes = sum([d['early_minutes'] for d in calendar])
            
            attendance_rate = round((present_days / working_days * 100) if working_days > 0 else 0, 2)
            
            return {
                "total_days": total_days,
                "working_days": working_days,
                "present_days": present_days,
                "late_days": late_days,
                "absent_days": absent_days,
                "half_days": half_days,
                "holidays": holidays_count,
                "weekends": weekends_count,
                "total_hours": round(total_hours, 2),
                "total_late_minutes": total_late_minutes,
                "total_early_minutes": total_early_minutes,
                "attendance_rate": attendance_rate
            }
        except Exception as e:
            print(f"❌ Lỗi tính monthly summary: {str(e)}")
            return {
                "total_days": 0,
                "working_days": 0,
                "present_days": 0,
                "late_days": 0,
                "absent_days": 0,
                "half_days": 0,
                "holidays": 0,
                "weekends": 0,
                "total_hours": 0,
                "total_late_minutes": 0,
                "total_early_minutes": 0,
                "attendance_rate": 0
            }

    @staticmethod
    def get_attendance_details(employee_id, date):
        """
        Lấy chi tiết điểm danh theo ngày (bao gồm cả log raw)
        """
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            # 🟢 Tổng hợp lại cho ngày cụ thể trước
            cursor.execute("""
                SELECT * FROM recalculate_attendance_period(%s, %s, %s)
            """, (date, date, employee_id))
            
            # Lấy kết quả tổng hợp (không cần dùng nhưng cần fetch)
            aggregation_results = cursor.fetchall()
            
            # Lấy dữ liệu đã tổng hợp
            cursor.execute("""
                SELECT 
                    status,
                    checkin_time,
                    checkout_time,
                    actual_hours,
                    late_minutes,
                    early_minutes,
                    notes,
                    work_shift_id
                FROM attendances
                WHERE employee_id = %s AND date = %s
            """, (employee_id, date))
            
            attendance_data = cursor.fetchone()
            
            # Lấy log raw để debug
            cursor.execute("""
                SELECT 
                    log_time,
                    action,
                    source,
                    status,
                    location
                FROM attendance_logs
                WHERE employee_id = %s AND DATE(log_time) = %s
                ORDER BY log_time
            """, (employee_id, date))
            
            raw_logs = cursor.fetchall()
            
            # Lấy thông tin ca làm việc
            work_shift_info = None
            if attendance_data and attendance_data[7]:  # work_shift_id
                cursor.execute("""
                    SELECT name, start_time, end_time
                    FROM work_shifts
                    WHERE id = %s
                """, (attendance_data[7],))
                work_shift_info = cursor.fetchone()
            
            conn.commit()
            cursor.close()
            conn.close()
            
            # Format dữ liệu
            result = {
                'success': True,
                'date': date,
                'employee_id': employee_id
            }
            
            if attendance_data:
                status, checkin_time, checkout_time, actual_hours, late_minutes, early_minutes, notes, work_shift_id = attendance_data
                result.update({
                    "status": status,
                    "check_in": checkin_time.isoformat() if checkin_time else None,
                    "check_out": checkout_time.isoformat() if checkout_time else None,
                    "actual_hours": float(actual_hours) if actual_hours else 0,
                    "late_minutes": late_minutes or 0,
                    "early_minutes": early_minutes or 0,
                    "notes": notes,
                    "work_shift": {
                        "id": work_shift_id,
                        "name": work_shift_info[0] if work_shift_info else None,
                        "start_time": work_shift_info[1].isoformat() if work_shift_info and work_shift_info[1] else None,
                        "end_time": work_shift_info[2].isoformat() if work_shift_info and work_shift_info[2] else None
                    } if work_shift_info else None
                })
            else:
                result.update({
                    "status": "absent",
                    "check_in": None,
                    "check_out": None,
                    "actual_hours": 0,
                    "late_minutes": 0,
                    "early_minutes": 0,
                    "notes": None,
                    "work_shift": None
                })
            
            # Thêm log raw
            result['raw_logs'] = [
                {
                    "log_time": log[0].isoformat(),
                    "action": log[1],
                    "source": log[2],
                    "status": log[3],
                    "location": log[4]
                }
                for log in raw_logs
            ]
            
            return result
            
        except Exception as e:
            print(f"❌ Lỗi get_attendance_details: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }

    @staticmethod
    def recalculate_employee_attendance(employee_id, start_date, end_date):
        """
        Tổng hợp lại attendance cho nhân viên trong khoảng thời gian
        """
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT * FROM recalculate_attendance_period(%s, %s, %s)
            """, (start_date, end_date, employee_id))
            
            results = cursor.fetchall()
            conn.commit()
            
            cursor.close()
            conn.close()
            
            # Format kết quả để dễ đọc
            formatted_results = []
            for row in results:
                formatted_results.append({
                    'employee_id': row[0],
                    'attendance_date': row[1].isoformat() if row[1] else None,
                    'status': row[2],
                    'actual_hours': float(row[3]) if row[3] else 0
                })
            
            return {
                'success': True,
                'message': f'Đã tổng hợp lại attendance cho nhân viên {employee_id} từ {start_date} đến {end_date}',
                'affected_days': len(results),
                'results': formatted_results
            }
            
        except Exception as e:
            print(f"❌ Lỗi recalculate_employee_attendance: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }