import cv2
import os
import time
import sys
from config.db import get_connection
from psycopg2.extras import RealDictCursor
from services.upload.uploadToCloudinary import upload_to_cloudinary
from services.upload.cloudinary_delete import delete_employee_dataset
from services.training_service import train_employee

def capture_dataset(face_id, max_images=30, auto_delete_old=True):
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute("SELECT id, employee_code, full_name FROM employee_information WHERE id=%s", (face_id,))
    employee = cursor.fetchone()
    
    if not employee:
        conn.close()
        return False, f"Nhân viên ID {face_id} không tồn tại"

    # Kiểm tra dataset hiện có
    cursor.execute("SELECT COUNT(*) as existing_count FROM employee_face_dataset WHERE employee_id = %s", (face_id,))
    existing_count = cursor.fetchone()['existing_count']
    
    if existing_count > 0:
        if not auto_delete_old:
            conn.close()
            return False, f"❌ Nhân viên {employee['full_name']} đã có {existing_count} ảnh. Set auto_delete_old=True để ghi đè."
        
        print(f"🔄 Nhân viên {employee['full_name']} đã có {existing_count} ảnh. Đang xóa dataset cũ...")
        
        # Xóa dataset cũ từ Cloudinary
        success_count_del, total_count_del, errors = delete_employee_dataset(employee['employee_code'])
        print(f"🗑️ Đã xóa {success_count_del}/{total_count_del} ảnh từ Cloudinary")
        
        # Xóa từ database
        cursor.execute("DELETE FROM employee_face_dataset WHERE employee_id = %s", (face_id,))
        conn.commit()
        print(" Đã xóa dataset cũ từ database")
    
    else:
        print(f"🆕 Nhân viên {employee['full_name']} chưa có dataset. Bắt đầu chụp ảnh mới...")

    # Bắt đầu chụp ảnh mới
    cam = cv2.VideoCapture(0)
    cam.set(3, 640)
    cam.set(4, 480)

    cascade_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'utils', 'haarcascade_frontalface_default.xml'))
    faceCascade = cv2.CascadeClassifier(cascade_path)
    if faceCascade.empty():
        conn.close()
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
            faces = faceCascade.detectMultiScale(gray, 1.3, 5, minSize=(100, 100))

            for (x, y, w, h) in faces:
                if count >= max_images:
                    break
                    
                face_region = gray[y:y+h, x:x+w]
                
                if face_region.size == 0 or w < 50 or h < 50:
                    continue
                
                # Upload lên Cloudinary
                upload_success, image_url, error_msg = upload_to_cloudinary(
                    face_region, employee['employee_code'], count + 1
                )
                
                if upload_success:
                    try:
                        cursor.execute("""
                            INSERT INTO employee_face_dataset 
                            (employee_id, image_url, image_order, file_name)
                            VALUES (%s, %s, %s, %s)
                        """, (employee['id'], image_url, count + 1, f"{employee['employee_code']}_{count+1}.jpg"))
                        conn.commit()
                        success_count += 1
                        print(f" Đã upload và lưu ảnh {count + 1}/{max_images}")
                    except Exception as db_error:
                        print(f"❌ Lỗi lưu database: {db_error}")
                        conn.rollback()
                else:
                    print(f"❌ Lỗi upload ảnh {count + 1}: {error_msg}")
                
                cv2.rectangle(img, (x, y), (x+w, y+h), (255, 0, 0), 2)
                cv2.putText(img, f"Image: {count+1}/{max_images}", (10, 30), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                cv2.imshow('Face Capture - Nhấn ESC để thoát', img)
                
                count += 1
                time.sleep(0.3)

            k = cv2.waitKey(1) & 0xff
            if k == 27:
                break

    except Exception as e:
        print(f"❌ Lỗi trong quá trình chụp: {str(e)}")
        return False, f"Lỗi: {str(e)}"
        
    finally:
        cam.release()
        cv2.destroyAllWindows()
        conn.close()

    # Training sau khi chụp xong
  
    train_ok, train_msg = False, "Chưa training"

    if success_count > 0:
        try:
            # Gọi incremental training cho nhân viên hiện tại
            train_ok, train_msg = train_employee(face_id)
        except Exception as e:
            train_ok = False
            train_msg = f"Lỗi training: {str(e)}"

    if success_count == 0:
        return False, "❌ Không có ảnh hợp lệ để training."
    else:
        if train_ok:
            return True, f" Hoàn tất! Đã upload {success_count}/{max_images} ảnh và training model thành công cho nhân viên này!"
        else:
            return True, f" Đã upload {success_count}/{max_images} ảnh nhưng training cho nhân viên này lỗi: {train_msg}"

