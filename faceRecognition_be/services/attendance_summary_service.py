# services/attendance_summary_service.py
from datetime import datetime, timedelta
from config.db import get_connection

class AttendanceSummaryService:
    @staticmethod
    def get_employee_attendance_summary(employee_id, year, month):
        """
        Lấy tổng quan điểm danh của nhân viên theo tháng từ bảng attendances
        """
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            # Tính ngày đầu tháng và cuối tháng
            start_date = f"{year}-{month:02d}-01"
            end_date = (datetime(year, month, 1) + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            end_date = end_date.strftime('%Y-%m-%d')
            
            # Lấy tổng số ngày làm việc (PostgreSQL)
            total_working_days = AttendanceSummaryService._get_working_days_count(start_date, end_date)
            
            # Lấy dữ liệu điểm danh từ bảng attendances
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
                    AND date >= %s 
                    AND date <= %s
                ORDER BY date
            """, (employee_id, start_date, end_date))
            
            records = cursor.fetchall()
            
            # Tính toán thống kê
            summary = {
                'employee_id': employee_id,
                'year': year,
                'month': month,
                'total_working_days': total_working_days,
                'present_days': 0,
                'absent_days': 0,
                'late_days': 0,
                'half_days': 0,
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
                elif status == 'half_day':
                    summary['half_days'] += 1
                    summary['present_days'] += 0.5
                
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
    def _get_working_days_count(start_date, end_date):
        """Đếm số ngày làm việc trong khoảng thời gian (PostgreSQL version)"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            # PostgreSQL: sử dụng generate_series và EXTRACT(DOW FROM date)
            cursor.execute("""
                SELECT COUNT(*) 
                FROM generate_series(
                    %s::date, 
                    %s::date, 
                    '1 day'::interval
                ) as work_date
                WHERE EXTRACT(DOW FROM work_date) NOT IN (0, 6)  -- 0=Chủ nhật, 6=Thứ 7
            """, (start_date, end_date))
            
            count = cursor.fetchone()[0] or 0
            cursor.close()
            conn.close()
            
            return count
        except Exception as e:
            print(f"❌ Lỗi đếm ngày làm việc: {str(e)}")
            return 22  # Fallback: mặc định 22 ngày làm việc

    @staticmethod
    def checkin_employee(employee_id, location='Văn phòng'):
        """
        Check-in cho nhân viên vào bảng attendances (PostgreSQL version)
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
            
            # PostgreSQL: sử dụng ON CONFLICT thay vì ON DUPLICATE KEY UPDATE
            cursor.execute("""
                INSERT INTO attendances 
                    (employee_id, date, checkin_time, status, location, late_minutes)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (employee_id, date) 
                DO UPDATE SET 
                    checkin_time = EXCLUDED.checkin_time,
                    status = EXCLUDED.status,
                    location = EXCLUDED.location,
                    late_minutes = EXCLUDED.late_minutes,
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
        Check-out cho nhân viên từ bảng attendances
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