# services/employee_service.py
from config.db import get_connection

def get_all_employees():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)   # dictionary=True => trả về dict thay vì tuple
        cursor.execute("SELECT * FROM employee")  # nhớ kiểm tra tên bảng của bạn là employee hay employees
        employees = cursor.fetchall()
        conn.close()
        return employees
    except Exception as e:
        print(f"Error fetching employees: {e}")
        return []
