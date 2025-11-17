from datetime import datetime, timedelta
from config.db import get_connection

class AttendanceService:
    @staticmethod
    def get_employee_attendance_summary(employee_id, year, month):
        """
        Lấy tổng quan điểm danh của nhân viên theo tháng
        """
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            # Tính ngày đầu tháng và cuối tháng
            start_date = f"{year}-{month:02d}-01"
            end_date = (datetime(year, month, 1) + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            end_date = end_date.strftime('%Y-%m-%d')
            
            # Lấy tổng số ngày làm việc
            total_working_days = AttendanceService._get_working_days_count(start_date, end_date)
            
            # Lấy dữ liệu điểm danh
            cursor.execute("""
                SELECT 
                    date,
                    status,
                    checkin_time,
                    checkout_time,
                    actual_hours,
                    late_minutes,
                    early_minutes
                FROM attendances
                WHERE employee_id = %s 
                    AND YEAR(date) = %s 
                    AND MONTH(date) = %s
                ORDER BY date
            """, (employee_id, year, month))
            
            records = cursor.fetchall()
            
            # Tính toán thống kê
            summary = {
                'total_working_days': total_working_days,
                'present_days': 0,
                'absent_days': 0,
                'late_days': 0,
                'total_hours': 0,
                'total_late_minutes': 0,
                'total_early_minutes': 0
            }
            
            daily_records = []
            for record in records:
                date, status, checkin_time, checkout_time, actual_hours, late_minutes, early_minutes = record
                
                if status == 'present':
                    summary['present_days'] += 1
                elif status == 'absent':
                    summary['absent_days'] += 1
                elif status == 'late':
                    summary['late_days'] += 1
                    summary['present_days'] += 1
                
                if actual_hours:
                    summary['total_hours'] += float(actual_hours)
                
                if late_minutes:
                    summary['total_late_minutes'] += late_minutes
                
                if early_minutes:
                    summary['total_early_minutes'] += early_minutes
                
                daily_records.append({
                    "date": date.isoformat(),
                    "status": status,
                    "check_in": checkin_time.isoformat() if checkin_time else None,
                    "check_out": checkout_time.isoformat() if checkout_time else None,
                    "actual_hours": float(actual_hours) if actual_hours else 0,
                    "late_minutes": late_minutes or 0,
                    "early_minutes": early_minutes or 0
                })
            
            # Tính phần trăm
            summary['attendance_rate'] = round(
                (summary['present_days'] / total_working_days * 100) if total_working_days > 0 else 0, 
                2
            )
            
            cursor.close()
            conn.close()
            
            return {
                'success': True,
                'summary': summary,
                'daily_records': daily_records
            }
            
        except Exception as e:
            print(f"❌ Lỗi service get_employee_attendance_summary: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def get_monthly_calendar(employee_id, year, month):
        """
        Lấy lịch chấm công hàng tháng
        """
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            # Tạo lịch cho tháng
            calendar = []
            current_date = datetime(year, month, 1)
            last_day = (current_date.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)
            
            # Lấy ngày lễ
            holidays = AttendanceService._get_holidays(year, month)
            
            while current_date.month == month:
                date_str = current_date.strftime('%Y-%m-%d')
                is_weekend = current_date.weekday() >= 5
                is_holiday = current_date.date() in holidays
                
                # Lấy thông tin điểm danh
                attendance_data = AttendanceService._get_daily_attendance(employee_id, current_date.date())
                
                calendar.append({
                    "date": date_str,
                    "day_of_week": current_date.strftime('%A'),
                    "is_weekend": is_weekend,
                    "is_holiday": is_holiday,
                    **attendance_data
                })
                
                current_date += timedelta(days=1)
            
            # Tính tổng hợp
            summary = AttendanceService._calculate_monthly_summary(calendar)
            
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
    def checkin_employee(employee_id, location='Văn phòng'):
        """
        Check-in cho nhân viên
        """
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            today = datetime.now().strftime('%Y-%m-%d')
            current_time = datetime.now()
            
            # Kiểm tra đã check-in chưa
            cursor.execute("""
                SELECT id FROM attendances 
                WHERE employee_id = %s AND date = %s AND checkin_time IS NOT NULL
            """, (employee_id, today))
            
            if cursor.fetchone():
                return {
                    'success': False,
                    'error': 'Đã check-in hôm nay'
                }
            
            # Xác định trạng thái
            checkin_status = 'present'
            late_minutes = 0
            
            standard_checkin = current_time.replace(hour=8, minute=0, second=0, microsecond=0)
            if current_time > standard_checkin + timedelta(minutes=15):
                checkin_status = 'late'
                late_minutes = int((current_time - standard_checkin).total_seconds() / 60)
            
            # Tạo bản ghi điểm danh
            cursor.execute("""
                INSERT INTO attendances 
                    (employee_id, date, checkin_time, status, location, late_minutes)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE 
                    checkin_time = VALUES(checkin_time),
                    status = VALUES(status),
                    location = VALUES(location),
                    late_minutes = VALUES(late_minutes),
                    updated_at = CURRENT_TIMESTAMP
            """, (employee_id, today, current_time, checkin_status, location, late_minutes))
            
            conn.commit()
            
            cursor.close()
            conn.close()
            
            return {
                'success': True,
                'checkin_time': current_time.isoformat(),
                'status': checkin_status,
                'late_minutes': late_minutes
            }
            
        except Exception as e:
            print(f"❌ Lỗi service checkin_employee: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def checkout_employee(employee_id):
        """
        Check-out cho nhân viên
        """
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            today = datetime.now().strftime('%Y-%m-%d')
            checkout_time = datetime.now()
            
            # Lấy thông tin check-in
            cursor.execute("""
                SELECT id, checkin_time FROM attendances 
                WHERE employee_id = %s AND date = %s AND checkin_time IS NOT NULL
            """, (employee_id, today))
            
            attendance = cursor.fetchone()
            
            if not attendance:
                return {
                    'success': False,
                    'error': 'Chưa check-in hôm nay'
                }
            
            attendance_id, checkin_time = attendance
            
            # Kiểm tra đã check-out chưa
            cursor.execute("""
                SELECT checkout_time FROM attendances 
                WHERE id = %s AND checkout_time IS NOT NULL
            """, (attendance_id,))
            
            if cursor.fetchone():
                return {
                    'success': False,
                    'error': 'Đã check-out hôm nay'
                }
            
            # Tính giờ làm việc
            work_duration = checkout_time - checkin_time
            actual_hours = work_duration.total_seconds() / 3600
            
            # Tính về sớm (nếu có)
            early_minutes = 0
            standard_checkout = checkout_time.replace(hour=17, minute=0, second=0, microsecond=0)
            if checkout_time < standard_checkout - timedelta(minutes=15):
                early_minutes = int((standard_checkout - checkout_time).total_seconds() / 60)
            
            # Cập nhật check-out
            cursor.execute("""
                UPDATE attendances 
                SET checkout_time = %s, 
                    actual_hours = %s,
                    early_minutes = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (checkout_time, actual_hours, early_minutes, attendance_id))
            
            conn.commit()
            
            cursor.close()
            conn.close()
            
            return {
                'success': True,
                'checkout_time': checkout_time.isoformat(),
                'actual_hours': round(actual_hours, 2),
                'early_minutes': early_minutes,
                'work_duration': str(work_duration).split('.')[0]
            }
            
        except Exception as e:
            print(f"❌ Lỗi service checkout_employee: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    # ========== PRIVATE METHODS ==========
    
    @staticmethod
    def _get_working_days_count(start_date, end_date):
        """Đếm số ngày làm việc trong khoảng thời gian"""
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT COUNT(*) 
            FROM (
                SELECT DATE(%s) + INTERVAL seq DAY as work_date
                FROM (
                    SELECT @row := @row + 1 as seq
                    FROM (SELECT 0 UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3) a,
                         (SELECT 0 UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3) b,
                         (SELECT 0 UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3) c,
                         (SELECT @row := -1) r
                ) seq
                WHERE DATE(%s) + INTERVAL seq DAY <= DATE(%s)
            ) dates
            WHERE DAYOFWEEK(dates.work_date) NOT IN (1, 7)
        """, (start_date, start_date, end_date))
        
        count = cursor.fetchone()[0] or 0
        cursor.close()
        conn.close()
        
        return count
    
    @staticmethod
    def _get_holidays(year, month):
        """Lấy danh sách ngày lễ"""
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT holiday_date, name 
            FROM holidays 
            WHERE YEAR(holiday_date) = %s AND MONTH(holiday_date) = %s
        """, (year, month))
        
        holidays = {row[0]: row[1] for row in cursor.fetchall()}
        cursor.close()
        conn.close()
        
        return holidays
    
    @staticmethod
    def _get_daily_attendance(employee_id, date):
        """Lấy thông tin điểm danh theo ngày"""
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
    
    @staticmethod
    def _calculate_monthly_summary(calendar):
        """Tính tổng hợp hàng tháng"""
        total_days = len(calendar)
        working_days = len([d for d in calendar if not d['is_weekend'] and not d['is_holiday']])
        present_days = len([d for d in calendar if d['status'] == 'present'])
        absent_days = len([d for d in calendar if d['status'] == 'absent'])
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
            "absent_days": absent_days,
            "holidays": holidays_count,
            "weekends": weekends_count,
            "total_hours": round(total_hours, 2),
            "total_late_minutes": total_late_minutes,
            "total_early_minutes": total_early_minutes,
            "attendance_rate": attendance_rate
        }