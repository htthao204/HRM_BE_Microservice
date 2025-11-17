from config.db import get_connection
from psycopg2.extras import RealDictCursor

def get_all_employees():
    try:
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT * FROM employee_information")
        employees = cursor.fetchall()
        conn.close()
        return employees
    except Exception as e:
        print(f"Error fetching employees: {e}")
        return []