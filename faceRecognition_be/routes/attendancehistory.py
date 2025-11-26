from flask import Blueprint, jsonify, request
import os
from datetime import datetime, timedelta
from config.db import get_connection
from services.recognition_service import run_recognition
from services.dataset_service import capture_dataset, get_dataset_info
from services.training_service import train_model
from services.upload.cloudinary_delete import delete_employee_dataset, get_cloudinary_usage
from services.recognize_from_image import recognize_from_image

recognition_bp = Blueprint("recognition", __name__)

# CORS handling cho toàn bộ blueprint
@recognition_bp.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

@recognition_bp.route("/attendance", methods=["GET", "OPTIONS"])
def start_recognition_api():
    """Khởi động nhận diện khuôn mặt để điểm danh"""
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200
        
    try:
        result = run_recognition()
        return jsonify({"success": True, "data": result})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@recognition_bp.route("/capture_face", methods=["POST", "OPTIONS"])
def capture_face_api():
    """Chụp dataset khuôn mặt cho nhân viên"""
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200
        
    data = request.json
    face_id = data.get("employee_id")
    auto_delete = data.get("auto_delete_old", True)
    
    if not face_id:
        return jsonify({"success": False, "message": "Thiếu employee_id"}), 400

    try:
        success, msg = capture_dataset(face_id, auto_delete_old=auto_delete)
        if not success:
            return jsonify({"success": False, "message": msg}), 500

        train_success, train_msg = train_model()

        if train_success:
            return jsonify({
                "success": True,
                "message": f"{msg}. Mô hình đã được train lại thành công!"
            })
        else:
            return jsonify({
                "success": False,
                "message": f"{msg}. Nhưng huấn luyện thất bại: {train_msg}"
            }), 500

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@recognition_bp.route("/train", methods=["POST", "OPTIONS"])
def train_api():
    """Huấn luyện lại mô hình nhận diện"""
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200
        
    try:
        success, msg = train_model()
        return jsonify({"success": success, "message": msg})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@recognition_bp.route("/dataset_info/<int:employee_id>", methods=["GET", "OPTIONS"])
def get_dataset_info_api(employee_id):
    """Lấy thông tin dataset của nhân viên"""
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200
        
    try:
        info = get_dataset_info(employee_id)
        if info:
            return jsonify({
                "success": True,
                "data": {
                    "employee_id": employee_id,
                    "employee_code": info['employee_code'],
                    "full_name": info['full_name'],
                    "image_count": info['image_count'] or 0,
                    "last_updated": info['last_updated'],
                    "has_dataset": info['image_count'] > 0
                }
            })
        else:
            return jsonify({"success": False, "message": "Không tìm thấy nhân viên"}), 404
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@recognition_bp.route("/delete_dataset/<employee_code>", methods=["DELETE", "OPTIONS"])
def delete_dataset_api(employee_code):
    """Xóa toàn bộ dataset của nhân viên"""
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200
        
    try:
        success_count, total_count, errors = delete_employee_dataset(employee_code)
        
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "DELETE FROM employee_face_dataset WHERE employee_id IN (SELECT id FROM employee_information WHERE employee_code = %s)", 
            (employee_code,)
        )
        conn.commit()
        cursor.close()
        conn.close()
        
        if errors and success_count == 0:
            return jsonify({
                "success": False,
                "message": f"Không thể xóa dataset của {employee_code}",
                "errors": errors
            }), 500
        
        return jsonify({
            "success": True,
            "message": f" Đã xóa {success_count} ảnh từ Cloudinary và database cho {employee_code}",
            "deleted_count": success_count,
            "errors": errors if errors else None
        })
        
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@recognition_bp.route("/cloudinary_usage", methods=["GET", "OPTIONS"])
def get_cloudinary_usage_api():
    """Lấy thông tin sử dụng Cloudinary"""
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200
        
    try:
        success, usage_info = get_cloudinary_usage()
        if success:
            return jsonify({
                "success": True,
                "data": {
                    "usage": usage_info.get('usage', {}),
                    "limit": usage_info.get('limit', {}),
                    "plan": usage_info.get('plan', {})
                }
            })
        else:
            return jsonify({"success": False, "message": usage_info}), 500
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@recognition_bp.route("/capture_with_options", methods=["POST", "OPTIONS"])
def capture_with_options_api():
    """Chụp ảnh với các tùy chọn nâng cao"""
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200
        
    data = request.json
    face_id = data.get("employee_id")
    max_images = data.get("max_images", 30)
    auto_delete = data.get("auto_delete_old", True)
    quality = data.get("quality", 80)
    
    if not face_id:
        return jsonify({"success": False, "message": "Thiếu employee_id"}), 400

    try:
        info = get_dataset_info(face_id)
        if info and info['image_count'] > 0 and not auto_delete:
            return jsonify({
                "success": False,
                "message": f"⚠️ Nhân viên {info['full_name']} đã có {info['image_count']} ảnh. Set auto_delete_old=true để ghi đè.",
                "existing_images": info['image_count']
            }), 400

        success, msg = capture_dataset(face_id, max_images=max_images, auto_delete_old=auto_delete)
        if not success:
            return jsonify({"success": False, "message": msg}), 500

        return jsonify({
            "success": True,
            "message": msg,
            "auto_trained": False
        })

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@recognition_bp.route("/health", methods=["GET", "OPTIONS"])
def health_check():
    """Health check endpoint"""
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200
        
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.close()
        conn.close()
        
        cascade_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'utils', 'haarcascade_frontalface_default.xml'))
        cascade_exists = os.path.exists(cascade_path)
        
        return jsonify({
            "success": True,
            "service": "face-recognition",
            "status": "healthy",
            "database": "connected",
            "cascade_file": "exists" if cascade_exists else "missing",
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "service": "face-recognition", 
            "status": "unhealthy",
            "error": str(e)
        }), 500

@recognition_bp.route("/recognize_from_image", methods=["POST", "OPTIONS"])
def recognize_from_image_api():
    """Nhận diện khuôn mặt từ ảnh upload"""
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200
        
    try:
        if 'image' not in request.files:
            return jsonify({
                "success": False,
                "error": "Không tìm thấy file ảnh"
            }), 400

        file = request.files['image']
        if file.filename == '':
            return jsonify({
                "success": False,
                "error": "Không có file được chọn"
            }), 400

        allowed_extensions = {'jpg', 'jpeg', 'png', 'bmp'}
        if '.' in file.filename and file.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
            return jsonify({
                "success": False,
                "error": "Định dạng file không hỗ trợ. Chỉ chấp nhận JPG, JPEG, PNG, BMP"
            }), 400

        employee_id = request.form.get('employee_id')
        image_data = file.read()
        
        if len(image_data) > 5 * 1024 * 1024:
            return jsonify({
                "success": False,
                "error": "File ảnh quá lớn. Kích thước tối đa là 5MB"
            }), 400

        print(f"🖼️ Nhận ảnh từ {file.filename}, kích thước: {len(image_data)} bytes")
        
        result = recognize_from_image(image_data, employee_id)
        
        return jsonify({
            "success": result["success"],
            "data": result,
            "message": "Nhận diện khuôn mặt thành công" if result["success"] else result.get("error", "Lỗi nhận diện")
        })

    except Exception as e:
        print(f"❌ Lỗi endpoint nhận diện từ ảnh: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Lỗi server: {str(e)}"
        }), 500

@recognition_bp.route("/employee_dataset_status", methods=["GET", "OPTIONS"])
def get_all_employee_dataset_status():
    """Lấy trạng thái dataset của tất cả nhân viên"""
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200
        
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                ei.id as employee_id,
                ei.employee_code,
                ei.full_name,
                d.name as department_name,
                COUNT(efd.id) as image_count,
                MAX(efd.created_at) as last_updated
            FROM employee_information ei
            LEFT JOIN employee_face_dataset efd ON ei.id = efd.employee_id
            LEFT JOIN departments d ON ei.department_id = d.id
            WHERE ei.deleted_at IS NULL
            GROUP BY ei.id, ei.employee_code, ei.full_name, d.name
            ORDER BY ei.full_name
        """)
        
        employees = cursor.fetchall()
        cursor.close()
        conn.close()
        
        result = []
        for emp in employees:
            result.append({
                "employee_id": emp[0],
                "employee_code": emp[1],
                "full_name": emp[2],
                "department": emp[3],
                "image_count": emp[4] or 0,
                "last_updated": emp[5].isoformat() if emp[5] else None,
                "has_dataset": (emp[4] or 0) > 0,
                "status": "Có dataset" if (emp[4] or 0) > 0 else "Chưa có dataset"
            })
        
        return jsonify({
            "success": True,
            "data": result,
            "total_employees": len(result),
            "with_dataset": len([e for e in result if e['has_dataset']]),
            "without_dataset": len([e for e in result if not e['has_dataset']])
        })
        
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@recognition_bp.route("/recognition_stats", methods=["GET", "OPTIONS"])
def get_recognition_stats():
    """Lấy thống kê về hệ thống nhận diện"""
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200
        
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM employee_information WHERE deleted_at IS NULL")
        total_employees = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(DISTINCT employee_id) FROM employee_face_dataset")
        employees_with_dataset = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM employee_face_dataset")
        total_images = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM attendance_logs WHERE DATE(log_time) = CURRENT_DATE")
        today_recognition = cursor.fetchone()[0]
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "success": True,
            "data": {
                "total_employees": total_employees,
                "employees_with_dataset": employees_with_dataset,
                "employees_without_dataset": total_employees - employees_with_dataset,
                "dataset_coverage": f"{(employees_with_dataset/total_employees*100):.1f}%" if total_employees > 0 else "0%",
                "total_dataset_images": total_images,
                "avg_images_per_employee": total_images // employees_with_dataset if employees_with_dataset > 0 else 0,
                "recognitions_today": today_recognition
            }
        })
        
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@recognition_bp.route("/attendance/employee/<int:employee_id>", methods=["POST", "OPTIONS"])
def get_employee_attendance(employee_id):
    """Lấy lịch sử điểm danh của nhân viên cụ thể"""
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200
        
    try:
        # Tạo request context giả để gọi hàm get_attendance_history
        from flask import Request
        import json
        
        filters = request.json or {}
        filters['employee_id'] = employee_id
        
        # Gọi trực tiếp logic thay vì hàm get_attendance_history
        return _get_attendance_history_with_filters(filters)
        
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

def _get_attendance_history_with_filters(filters):
    """Hàm helper để xử lý lấy lịch sử điểm danh với filters"""
    try:        
        employee_id = filters.get('employee_id')
        employee_code = filters.get('employee_code')
        start_date = filters.get('start_date')
        end_date = filters.get('end_date')
        date = filters.get('date')
        page = filters.get('page', 1)
        page_size = filters.get('page_size', 20)
        status = filters.get('status')
        
        # Tính offset
        offset = (page - 1) * page_size
        
        conn = get_connection()
        cursor = conn.cursor()
        
        # Build query với bộ lọc
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
        
        # Add pagination and ordering
        query += " ORDER BY al.log_time DESC LIMIT %s OFFSET %s"
        params.extend([page_size, offset])
        
        cursor.execute(query, params)
        records = cursor.fetchall()
        
        # Format response
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
        
        # Calculate summary
        summary_query = """
            SELECT 
                COUNT(DISTINCT DATE(log_time)) as total_days,
                SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) as present_count,
                SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as absent_count,
                SUM(CASE WHEN status = 'LATE' THEN 1 ELSE 0 END) as late_count,
                SUM(CASE WHEN status = 'EARLY' THEN 1 ELSE 0 END) as early_count
            FROM attendance_logs al
            JOIN employee_information ei ON al.employee_id = ei.id
            WHERE 1=1
        """
        summary_params = params[:-2] if len(params) > 2 else []
        
        cursor.execute(summary_query, summary_params)
        summary_result = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        total_pages = (total_count + page_size - 1) // page_size
        
        return jsonify({
            "success": True,
            "data": {
                "records": formatted_records,
                "total_count": total_count,
                "page": page,
                "page_size": page_size,
                "total_pages": total_pages,
                "summary": {
                    "total_days": summary_result[0] or 0,
                    "present_days": summary_result[1] or 0,
                    "absent_days": summary_result[2] or 0,
                    "late_days": summary_result[3] or 0,
                    "early_days": summary_result[4] or 0,
                    "average_confidence": 95.0
                }
            },
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"❌ Lỗi khi lấy lịch sử điểm danh: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

# Sửa hàm gốc để dùng helper function
@recognition_bp.route("/attendance/history", methods=["POST", "OPTIONS"])
def get_attendance_history():
    """Lấy lịch sử điểm danh với bộ lọc"""
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200
        
    try:
        filters = request.json or {}
        return _get_attendance_history_with_filters(filters)
        
    except Exception as e:
        print(f"❌ Lỗi khi lấy lịch sử điểm danh: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

@recognition_bp.route("/attendance/summary/<int:employee_id>/<int:year>/<int:month>", methods=["GET", "OPTIONS"])
def get_attendance_summary(employee_id, year, month):
    """Lấy thống kê điểm danh theo tháng"""
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200
        
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Lấy thông tin nhân viên
        cursor.execute("""
            SELECT employee_code, full_name 
            FROM employee_information 
            WHERE id = %s AND deleted_at IS NULL
        """, (employee_id,))
        employee = cursor.fetchone()
        
        if not employee:
            return jsonify({"success": False, "message": "Không tìm thấy nhân viên"}), 404
        
        # Tính ngày đầu tháng và cuối tháng
        start_date = f"{year}-{month:02d}-01"
        if month == 12:
            end_date = f"{year+1}-01-01"
        else:
            end_date = f"{year}-{month+1:02d}-01"
        
        # Lấy tổng số ngày làm việc trong tháng (trừ cuối tuần)
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
                WHERE DATE(%s) + INTERVAL seq DAY < DATE(%s)
            ) dates
            WHERE DAYOFWEEK(dates.work_date) NOT IN (1, 7)
        """, (start_date, start_date, end_date))
        
        total_working_days = cursor.fetchone()[0] or 0
        
        # Lấy dữ liệu điểm danh trong tháng - SỬA QUERY CHO KHỚP SCHEMA
        cursor.execute("""
            SELECT 
                DATE(log_time) as date,
                status,
                TIME(MIN(log_time)) as check_in,
                TIME(MAX(log_time)) as check_out
            FROM attendance_logs
            WHERE employee_id = %s 
                AND YEAR(log_time) = %s 
                AND MONTH(log_time) = %s
            GROUP BY DATE(log_time), status
            ORDER BY date
        """, (employee_id, year, month))
        
        daily_records = cursor.fetchall()
        
        # Tính toán thống kê với status mapping
        present_days = 0
        absent_days = 0
        late_days = 0
        early_days = 0
        
        formatted_daily = []
        for record in daily_records:
            db_status = record[1]
            # Map status từ database sang frontend
            if db_status == 'SUCCESS':
                frontend_status = 'present'
                present_days += 1
            elif db_status == 'FAILED':
                frontend_status = 'absent'
                absent_days += 1
            elif db_status == 'LATE':
                frontend_status = 'late'
                late_days += 1
                present_days += 1  # Vẫn tính là có mặt nhưng trễ
            elif db_status == 'EARLY':
                frontend_status = 'early_leave'
                early_days += 1
                present_days += 1  # Vẫn tính là có mặt nhưng về sớm
            else:
                frontend_status = db_status
            
            formatted_daily.append({
                "date": record[0].isoformat(),
                "status": frontend_status,
                "check_in": str(record[2]) if record[2] else None,
                "check_out": str(record[3]) if record[3] else None,
                "confidence": 95.0  # Giá trị mặc định
            })
        
        # Tính phần trăm điểm danh
        attendance_rate = (present_days / total_working_days * 100) if total_working_days > 0 else 0
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "success": True,
            "data": {
                "employee_id": employee_id,
                "employee_code": employee[0],
                "name": employee[1],
                "year": year,
                "month": month,
                "total_working_days": total_working_days,
                "present_days": present_days,
                "absent_days": absent_days,
                "late_days": late_days,
                "early_days": early_days,
                "attendance_rate": round(attendance_rate, 2),
                "average_confidence": 95.0,  # Giá trị mặc định
                "daily_records": formatted_daily
            }
        })
        
    except Exception as e:
        print(f"❌ Lỗi khi lấy thống kê điểm danh: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

@recognition_bp.route("/attendance/monthly/<int:employee_id>/<int:year>/<int:month>", methods=["GET", "OPTIONS"])
def get_monthly_attendance(employee_id, year, month):
    """Lấy bảng chấm công hàng tháng"""
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200
        
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Lấy thông tin nhân viên
        cursor.execute("""
            SELECT employee_code, full_name 
            FROM employee_information 
            WHERE id = %s AND deleted_at IS NULL
        """, (employee_id,))
        employee = cursor.fetchone()
        
        if not employee:
            return jsonify({"success": False, "message": "Không tìm thấy nhân viên"}), 404
        
        # Tính ngày đầu tháng và cuối tháng
        start_date = f"{year}-{month:02d}-01"
        if month == 12:
            end_date = f"{year+1}-01-01"
        else:
            end_date = f"{year}-{month+1:02d}-01"
        
        # Tạo lịch cho tháng
        calendar = []
        current_date = datetime(year, month, 1)
        
        holidays = []  # Có thể bổ sung danh sách ngày lễ
        
        while current_date.month == month:
            day_of_week = current_date.strftime('%A')
            is_weekend = current_date.weekday() >= 5  # 5=Saturday, 6=Sunday
            is_holiday = current_date.date() in holidays
            
            # Lấy thông tin điểm danh cho ngày này - SỬA QUERY CHO KHỚP SCHEMA
            cursor.execute("""
                SELECT 
                    status,
                    TIME(MIN(log_time)) as check_in,
                    TIME(MAX(log_time)) as check_out
                FROM attendance_logs
                WHERE employee_id = %s AND DATE(log_time) = %s
                GROUP BY status
            """, (employee_id, current_date.date()))
            
            attendance_data = cursor.fetchone()
            
            if attendance_data:
                db_status = attendance_data[0]
                # Map status từ database sang frontend
                status_mapping = {
                    'SUCCESS': 'present',
                    'FAILED': 'absent',
                    'LATE': 'late',
                    'EARLY': 'early_leave'
                }
                status = status_mapping.get(db_status, db_status)
                check_in = attendance_data[1]
                check_out = attendance_data[2]
            else:
                if is_weekend:
                    status = 'weekend'
                elif is_holiday:
                    status = 'holiday'
                else:
                    status = 'absent'
                check_in = None
                check_out = None
            
            calendar.append({
                "date": current_date.date().isoformat(),
                "day_of_week": day_of_week,
                "is_weekend": is_weekend,
                "is_holiday": is_holiday,
                "check_in": str(check_in) if check_in else None,
                "check_out": str(check_out) if check_out else None,
                "status": status,
                "confidence": 95.0  # Giá trị mặc định
            })
            
            current_date += timedelta(days=1)
        
        # Tính tổng hợp
        total_days = len(calendar)
        working_days = len([d for d in calendar if not d['is_weekend'] and not d['is_holiday']])
        present_days = len([d for d in calendar if d['status'] == 'present'])
        absent_days = len([d for d in calendar if d['status'] == 'absent'])
        holidays_count = len([d for d in calendar if d['is_holiday']])
        weekends_count = len([d for d in calendar if d['is_weekend']])
        
        attendance_rate = (present_days / working_days * 100) if working_days > 0 else 0
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "success": True,
            "data": {
                "employee_id": employee_id,
                "employee_code": employee[0],
                "name": employee[1],
                "year": year,
                "month": month,
                "calendar": calendar,
                "summary": {
                    "total_days": total_days,
                    "working_days": working_days,
                    "present_days": present_days,
                    "absent_days": absent_days,
                    "holidays": holidays_count,
                    "weekends": weekends_count,
                    "attendance_rate": round(attendance_rate, 2)
                }
            }
        })
        
    except Exception as e:
        print(f"❌ Lỗi khi lấy bảng chấm công: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

@recognition_bp.route("/attendance/export", methods=["POST", "OPTIONS"])
def export_attendance_report():
    """Xuất báo cáo điểm danh"""
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200
        
    try:
        filters = request.json or {}
        
        # Sử dụng hàm lấy lịch sử điểm danh hiện có
        history_response = get_attendance_history()
        
        if history_response[1] != 200:  # Nếu có lỗi
            return history_response
        
        history_data = history_response.get_json()
        
        # Format dữ liệu cho báo cáo
        report_data = {
            "exported_at": datetime.now().isoformat(),
            "filters": filters,
            "summary": history_data['data']['summary'],
            "records": history_data['data']['records'],
            "total_records": history_data['data']['total_count']
        }
        
        return jsonify({
            "success": True,
            "data": report_data,
            "message": "Báo cáo đã được tạo thành công"
        })
        
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@recognition_bp.route("/attendance/recent", methods=["GET", "OPTIONS"])
def get_recent_attendance():
    """Lấy lịch sử điểm danh gần đây (cho dashboard)"""
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200
        
    try:
        limit = request.args.get('limit', 10, type=int)
        
        conn = get_connection()
        cursor = conn.cursor()
        
        # SỬA QUERY CHO KHỚP SCHEMA THỰC TẾ
        cursor.execute("""
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
                al.source
            FROM attendance_logs al
            JOIN employee_information ei ON al.employee_id = ei.id
            ORDER BY al.log_time DESC
            LIMIT %s
        """, (limit,))
        
        records = cursor.fetchall()
        
        # Format response với status mapping
        formatted_records = []
        for record in records:
            status_mapping = {
                'SUCCESS': 'present',
                'FAILED': 'absent', 
                'LATE': 'late',
                'EARLY': 'early_leave'
            }
            
            formatted_records.append({
                "id": record[0],
                "employee_id": record[1],
                "employee_code": record[2],
                "name": record[3],
                "timestamp": record[4].isoformat(),
                "date": record[5].isoformat(),
                "time": str(record[6]),
                "action": record[7],
                "status": status_mapping.get(record[8], record[8]),
                "location": record[9],
                "device_id": record[10],
                "source": record[11],
                "confidence": 95.0  # Giá trị mặc định
            })
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "success": True,
            "data": {
                "records": formatted_records,
                "total_count": len(formatted_records)
            },
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500