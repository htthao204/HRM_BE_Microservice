from datetime import datetime, timedelta
from config.db import get_connection

def log_attendance(employee_id, action="CHECKIN", source="FACE_RECOGNITION", status="SUCCESS"):
    """
    Ghi log điểm danh nếu đã quá 5 phút kể từ lần log gần nhất.
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    now = datetime.now()
    now_str = now.strftime("%Y-%m-%d %H:%M:%S")

    #  Kiểm tra log gần nhất trong ngày
    cursor.execute("""
        SELECT log_time FROM attendance_logs
        WHERE employee_id = %s AND DATE(log_time) = CURDATE()
        ORDER BY log_time DESC
        LIMIT 1
    """, (employee_id,))
    last_log = cursor.fetchone()

    should_log = False
    if not last_log:
        should_log = True
    else:
        last_time = last_log["log_time"]
        # So sánh khoảng cách thời gian
        if now - last_time >= timedelta(minutes=5):
            should_log = True

    if should_log:
        query = """
            INSERT INTO attendance_logs (employee_id, log_time, action, source, status)
            VALUES (%s, %s, %s, %s, %s)
        """
        cursor.execute(query, (employee_id, now_str, action, source, status))
        conn.commit()
        print(f" Log thành công cho nhân viên {employee_id} lúc {now_str}")
    else:
        print(f"⏸ Bỏ qua log (chưa đủ 5 phút cho {employee_id})")

    cursor.close()
    conn.close()


def mark_attendance(employee_id):
    """
    Ghi điểm danh tổng hợp vào bảng attendances.
    - Nếu chưa có hôm nay → tạo mới (start_time)
    - Nếu đã có → cập nhật end_time bằng log mới nhất
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    now = datetime.now()
    today = now.date()

    #  Kiểm tra có attendance hôm nay chưa
    cursor.execute("""
        SELECT * FROM attendances
        WHERE employee_id = %s AND date = %s
    """, (employee_id, today))
    record = cursor.fetchone()

    if not record:
        #  Chưa có → tạo bản ghi mới
        cursor.execute("""
            INSERT INTO attendances (employee_id, date, start_time, start_status)
            VALUES (%s, %s, %s, 'NORMAL')
        """, (employee_id, today, now))
        conn.commit()
        print(f"Tạo attendance mới cho {employee_id} lúc {now}")
    else:
        #  Cập nhật end_time = thời điểm hiện tại
        cursor.execute("""
            UPDATE attendances
            SET end_time = %s,
                end_status = 'NORMAL',
                working_hours = TIMESTAMPDIFF(MINUTE, start_time, %s)/60
            WHERE id = %s
        """, (now, now, record["id"]))
        conn.commit()
        print(f"Cập nhật end_time cho {employee_id} lúc {now}")

    cursor.close()
    conn.close()

    # Sau khi xử lý attendance → ghi log (nếu đủ 5 phút)
    log_attendance(employee_id)
