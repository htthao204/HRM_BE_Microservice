from flask import Blueprint, jsonify, request
import cv2
import os
from config.db import get_connection
from psycopg2.extras import RealDictCursor
from services.upload.uploadToCloudinary import upload_to_cloudinary
from services.upload.cloudinary_delete import delete_employee_dataset
from services.training_service import train_employee 

face_dataset_bp = Blueprint("face_dataset", __name__)

@face_dataset_bp.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

@face_dataset_bp.route("/capture_face", methods=["POST", "OPTIONS"])
def capture_face_dataset():
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200

    try:
        data = request.json or {}
        face_id = data.get('face_id')
        max_images = data.get('max_images', 30)
        auto_delete_old = data.get('auto_delete_old', True)

        if not face_id:
            return jsonify({"success": False, "message": "Thiếu face_id"}), 400

        print(f"🚀 Bắt đầu chụp dataset cho nhân viên ID: {face_id}")
        success, message = capture_dataset(face_id, max_images, auto_delete_old)

        if success:
            return jsonify({
                "success": True,
                "message": message,
                "data": {
                    "employee_id": face_id,
                    "images_captured": max_images
                }
            })
        else:
            return jsonify({"success": False, "message": message}), 400

    except Exception as e:
        print(f"❌ Lỗi router capture dataset: {str(e)}")
        return jsonify({"success": False, "message": f"Lỗi server: {str(e)}"}), 500

def capture_dataset(face_id, max_images=30, auto_delete_old=True):
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # Lấy thông tin nhân viên
        cursor.execute("SELECT id, employee_code, full_name FROM employee_information WHERE id=%s", (face_id,))
        employee = cursor.fetchone()
        if not employee:
            return False, f"Nhân viên ID {face_id} không tồn tại"

        # Kiểm tra dataset hiện có
        cursor.execute("SELECT COUNT(*) as existing_count FROM employee_face_dataset WHERE employee_id=%s", (face_id,))
        existing_count = cursor.fetchone()['existing_count']

        if existing_count > 0:
            if not auto_delete_old:
                return False, f"❌ Nhân viên {employee['full_name']} đã có {existing_count} ảnh. Set auto_delete_old=True để ghi đè."
            
            print(f"🔄 Xóa dataset cũ ({existing_count} ảnh) của {employee['full_name']}...")
            success_count, total_count, errors = delete_employee_dataset(employee['employee_code'])
            print(f"🗑️ Đã xóa {success_count}/{total_count} ảnh từ Cloudinary")
            cursor.execute("DELETE FROM employee_face_dataset WHERE employee_id=%s", (face_id,))
            conn.commit()
            print("✅ Đã xóa dataset cũ từ database")
        else:
            print(f"🆕 Nhân viên {employee['full_name']} chưa có dataset. Bắt đầu chụp mới...")

        # Bắt đầu capture ảnh
        cam = cv2.VideoCapture(0)
        cam.set(3, 640)
        cam.set(4, 480)

        cascade_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'utils', 'haarcascade_frontalface_default.xml'))
        faceCascade = cv2.CascadeClassifier(cascade_path)
        if faceCascade.empty():
            return False, f"Cascade file không tìm thấy: {cascade_path}"

        count = 0
        success_count = 0
        print(f"🚀 Bắt đầu chụp {max_images} ảnh cho {employee['full_name']}...")

        try:
            while count < max_images:
                ret, img = cam.read()
                if not ret:
                    continue

                img = cv2.flip(img, 1)
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                faces = faceCascade.detectMultiScale(gray, 1.3, 5)

                for (x, y, w, h) in faces:
                    if count >= max_images:
                        break

                    face_region = gray[y:y+h, x:x+w]
                    upload_success, image_url, error_msg = upload_to_cloudinary(face_region, employee['employee_code'], count+1)

                    if upload_success:
                        try:
                            cursor.execute("""
                                INSERT INTO employee_face_dataset (employee_id, image_url, image_order, file_name)
                                VALUES (%s, %s, %s, %s)
                            """, (employee['id'], image_url, count+1, f"{employee['employee_code']}_{count+1}.jpg"))
                            conn.commit()
                            success_count += 1
                            print(f"✅ Upload & lưu ảnh {count+1}/{max_images}")
                        except Exception as db_error:
                            print(f"❌ Lỗi lưu database: {db_error}")
                            conn.rollback()
                    else:
                        print(f"❌ Lỗi upload ảnh {count+1}: {error_msg}")

                    cv2.rectangle(img, (x, y), (x+w, y+h), (255, 0, 0), 2)
                    cv2.putText(img, f"Image: {count+1}/{max_images}", (10, 30),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                    cv2.imshow('Face Capture - Nhấn ESC để thoát', img)

                    count += 1

                if cv2.waitKey(1) & 0xff == 27:
                    break
        finally:
            cam.release()
            cv2.destroyAllWindows()

        # Tự động train incremental cho nhân viên vừa capture
        if success_count > 0:
            print(f"📊 Kết thúc chụp {success_count}/{max_images} ảnh. Đang train model cho nhân viên này...")
            try:
                training_success, training_message = train_employee(face_id)
                if training_success:
                    return True, f"✅ Hoàn tất! Upload {success_count}/{max_images} ảnh & training thành công cho {employee['full_name']}"
                else:
                    return True, f"✅ Upload {success_count}/{max_images} ảnh thành công, nhưng training thất bại: {training_message}"
            except Exception as e:
                return True, f"✅ Upload {success_count}/{max_images} ảnh thành công, lỗi training: {str(e)}"
        else:
            return False, f"❌ Không upload được ảnh nào cho {employee['full_name']}"

    except Exception as e:
        print(f"❌ Lỗi capture_dataset: {str(e)}")
        return False, f"Lỗi: {str(e)}"
    finally:
        cursor.close()
        conn.close()

def get_dataset_info(face_id):
    """
    Lấy thông tin dataset của nhân viên
    """
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cursor.execute("""
            SELECT id, employee_code, full_name, status
            FROM employee_information 
            WHERE id = %s
        """, (face_id,))
        employee = cursor.fetchone()
        if not employee:
            return None

        cursor.execute("""
            SELECT COUNT(id) AS image_count,
                   MAX(created_at) AS last_updated
            FROM employee_face_dataset
            WHERE employee_id=%s
        """, (face_id,))
        dataset_info = cursor.fetchone()

        return {
            'employee_id': employee['id'],
            'employee_code': employee['employee_code'],
            'full_name': employee['full_name'],
            'image_count': dataset_info['image_count'] if dataset_info else 0,
            'last_updated': dataset_info['last_updated'] if dataset_info and dataset_info['last_updated'] else None,
        }

    except Exception as e:
        print(f"❌ Lỗi get_dataset_info: {str(e)}")
        return None
    finally:
        cursor.close()
        conn.close()
