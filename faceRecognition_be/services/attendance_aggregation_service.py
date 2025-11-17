# services/attendance_aggregation_service.py
from config.db import get_connection

class AttendanceAggregationService:
    @staticmethod
    def aggregate_all_employees(start_date, end_date):
        """
        Tổng hợp attendance cho tất cả nhân viên
        """
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT * FROM recalculate_attendance_period(%s, %s, NULL)
            """, (start_date, end_date))
            
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
                'message': f'Đã tổng hợp attendance cho tất cả nhân viên từ {start_date} đến {end_date}',
                'affected_records': len(results),
                'results': formatted_results
            }
            
        except Exception as e:
            print(f"❌ Lỗi aggregate_all_employees: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }

    @staticmethod
    @staticmethod
    def trigger_daily_aggregation():
        """
        Tổng hợp attendance cho ngày hiện tại (chạy tự động hàng ngày)
        """
        try:
            from datetime import date
            today = date.today().isoformat()
            
            conn = get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT * FROM recalculate_attendance_period(%s, %s, NULL)
            """, (today, today))
            
            results = cursor.fetchall()
            conn.commit()
            
            cursor.close()
            conn.close()
            
            # Format kết quả
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
                'message': f'Đã tổng hợp attendance cho ngày {today}',
                'affected_records': len(results),
                'results': formatted_results
            }
            
        except Exception as e:
            print(f"❌ Lỗi trigger_daily_aggregation: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }

    @staticmethod
    def aggregate_for_employee(employee_id, start_date, end_date):
        """
        Tổng hợp attendance cho một nhân viên cụ thể
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
            
            # Format kết quả
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
                'message': f'Đã tổng hợp attendance cho nhân viên {employee_id} từ {start_date} đến {end_date}',
                'affected_records': len(results),
                'results': formatted_results
            }
            
        except Exception as e:
            print(f"❌ Lỗi aggregate_for_employee: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }