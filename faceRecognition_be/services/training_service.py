import cv2
import os
import numpy as np
import requests
from PIL import Image
from io import BytesIO
import time
from config.db import get_connection
from psycopg2.extras import RealDictCursor

# Paths
trainer_path = os.path.join(os.path.dirname(__file__), '..', 'utils','trainer', 'trainer.yml')
cascade_path = os.path.join(os.path.dirname(__file__), '..', 'utils', 'haarcascade_frontalface_default.xml')
cascade_path = os.path.abspath(cascade_path)

# Tạo folder nếu chưa có
os.makedirs(os.path.dirname(trainer_path), exist_ok=True)

# Cascade
detector = cv2.CascadeClassifier(cascade_path)
if detector.empty():
    raise FileNotFoundError(f"Cascade file not found: {cascade_path}")

# Recognizer
recognizer = cv2.face.LBPHFaceRecognizer_create()

def train_model():
    """
    Training model từ ảnh trong database (Cloudinary URLs)
    """
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Lấy tất cả ảnh dataset từ database
        cursor.execute("""
            SELECT e.id as employee_id, e.employee_code, e.full_name, fd.image_url, fd.image_order
            FROM employee_face_dataset fd
            JOIN employee_information e ON fd.employee_id = e.id
            WHERE e.status = 'active'
            ORDER BY e.id, fd.image_order
        """)
        
        dataset_records = cursor.fetchall()
        
        if not dataset_records:
            return False, "[ERROR] Không có dữ liệu training trong database!"
        
        faceSamples = []
        ids = []
        download_errors = 0
        face_detection_errors = 0
        processed_count = 0
        
        print(f"📥 Đang tải {len(dataset_records)} ảnh từ Cloudinary...")
        
        # Thống kê theo nhân viên
        employee_stats = {}
        
        for record in dataset_records:
            employee_code = record['employee_code']
            if employee_code not in employee_stats:
                employee_stats[employee_code] = {
                    'name': record['full_name'],
                    'total_images': 0,
                    'success_faces': 0
                }
            employee_stats[employee_code]['total_images'] += 1
        
        for record in dataset_records:
            try:
                employee_code = record['employee_code']
                
                # Download ảnh từ Cloudinary URL với timeout
                response = requests.get(record['image_url'], timeout=15)
                if response.status_code == 200:
                    # Chuyển response thành ảnh OpenCV
                    image_data = BytesIO(response.content)
                    PIL_img = Image.open(image_data).convert('L')  # Grayscale
                    
                    # Resize ảnh để tối ưu performance
                    PIL_img = PIL_img.resize((200, 200), Image.Resampling.LANCZOS)
                    img_numpy = np.array(PIL_img, 'uint8')
                    
                    # Detect faces với parameters tối ưu
                    faces = detector.detectMultiScale(
                        img_numpy,
                        scaleFactor=1.1,
                        minNeighbors=5,
                        minSize=(50, 50),  # Tăng minSize để tránh face quá nhỏ
                        flags=cv2.CASCADE_SCALE_IMAGE
                    )
                    
                    if len(faces) > 0:
                        for (x, y, w, h) in faces:
                            face_region = img_numpy[y:y+h, x:x+w]
                            # ✅ QUAN TRỌNG: Đảm bảo kích thước đồng nhất
                            if face_region.size > 0:
                                face_region = cv2.resize(face_region, (100, 100))
                                faceSamples.append(face_region)
                                ids.append(record['employee_id'])
                                employee_stats[employee_code]['success_faces'] += 1
                        
                        processed_count += 1
                        print(f"✅ {record['employee_code']}_{record['image_order']}: {len(faces)} khuôn mặt")
                    else:
                        print(f"⚠️ {record['employee_code']}_{record['image_order']}: Không detect được khuôn mặt")
                        face_detection_errors += 1
                        
                else:
                    print(f"❌ Lỗi download {record['employee_code']}_{record['image_order']}: HTTP {response.status_code}")
                    download_errors += 1
                    
            except requests.exceptions.Timeout:
                print(f"⏰ Timeout download {record['employee_code']}_{record['image_order']}")
                download_errors += 1
            except Exception as e:
                print(f"❌ Lỗi xử lý {record['employee_code']}_{record['image_order']}: {str(e)}")
                download_errors += 1
                continue
        
        if len(faceSamples) == 0:
            return False, "[ERROR] Không thể detect khuôn mặt nào từ dataset!"
        
        # ✅ SỬA LỖI QUAN TRỌNG: Chuẩn hóa dữ liệu training
        print(f"🎯 Chuẩn bị training với {len(faceSamples)} khuôn mặt...")
        
        # Đảm bảo tất cả faceSamples có cùng kích thước và kiểu dữ liệu
        standardized_faces = []
        valid_ids = []
        
        for i, face in enumerate(faceSamples):
            if face is not None and face.size > 0:
                try:
                    # Resize về kích thước chuẩn
                    face_resized = cv2.resize(face, (100, 100))
                    standardized_faces.append(face_resized)
                    valid_ids.append(ids[i])
                except Exception as e:
                    print(f"⚠️ Lỗi resize face {i}: {str(e)}")
                    continue
        
        if len(standardized_faces) == 0:
            return False, "[ERROR] Không có khuôn mặt hợp lệ sau khi chuẩn hóa!"
        
        # ✅ Tạo numpy array đúng kiểu
        faceSamples_np = np.array(standardized_faces, dtype=np.uint8)
        ids_np = np.array(valid_ids, dtype=np.int32)
        
        print(f"🔧 Dữ liệu training: {faceSamples_np.shape} - IDs: {ids_np.shape}")
        
        # Training với progress
        start_time = time.time()
        print("🧠 Đang training model...")
        
        # Thêm parameters cho LBPH
        recognizer = cv2.face.LBPHFaceRecognizer_create(
            radius=1,
            neighbors=8,
            grid_x=8,
            grid_y=8
        )
        
        recognizer.train(faceSamples_np, ids_np)
        training_time = time.time() - start_time
        
        # Lưu model
        recognizer.write(trainer_path)
        print(f"💾 Đã lưu model: {trainer_path}")
        
        # Thống kê chi tiết theo nhân viên
        unique_employees = len(np.unique(ids_np))
        total_images = len(dataset_records)
        
        message = f"✅ HOÀN TẤT TRAINING\n"
        message += f"👥 Số nhân viên: {unique_employees}\n"
        message += f"📷 Tổng khuôn mặt: {len(faceSamples_np)}\n"
        message += f"🖼️ Ảnh đã xử lý: {processed_count}/{total_images}\n"
        message += f"❌ Lỗi download: {download_errors}\n"
        message += f"⚠️ Không detect được: {face_detection_errors}\n"
        message += f"⏱️ Thời gian training: {training_time:.2f}s\n"
        message += f"💾 Model: {trainer_path}\n\n"
        message += "📊 THỐNG KÊ THEO NHÂN VIÊN:\n"
        
        for emp_code, stats in employee_stats.items():
            success_rate = (stats['success_faces'] / stats['total_images']) * 100
            message += f"   {emp_code} ({stats['name']}): {stats['success_faces']}/{stats['total_images']} khuôn mặt ({success_rate:.1f}%)\n"
        
        return True, message
        
    except Exception as e:
        error_msg = f"[ERROR] Lỗi training: {str(e)}"
        print(error_msg)
        import traceback
        print(f"🔍 Chi tiết lỗi: {traceback.format_exc()}")
        return False, error_msg
    finally:
        cursor.close()
        conn.close()
def train_employee(employee_id: int):
    """
    Training thêm cho 1 nhân viên bằng LBPH.update()
    Không cần training lại toàn bộ model.
    """
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # Lấy dataset của nhân viên này
        cursor.execute("""
            SELECT e.id as employee_id, e.employee_code, e.full_name, fd.image_url, fd.image_order
            FROM employee_face_dataset fd
            JOIN employee_information e ON fd.employee_id = e.id
            WHERE e.id = %s AND e.status = 'active'
            ORDER BY fd.image_order
        """, (employee_id,))

        records = cursor.fetchall()

        if not records:
            return False, f"❌ Không có ảnh dataset cho nhân viên ID = {employee_id}"

        print(f"📥 Đang tải {len(records)} ảnh của nhân viên {records[0]['employee_code']}...")

        faceSamples = []
        ids = []

        for record in records:
            try:
                # Download ảnh
                response = requests.get(record['image_url'], timeout=15)
                if response.status_code != 200:
                    print(f"❌ Lỗi download ảnh {record['image_order']}")
                    continue

                img = Image.open(BytesIO(response.content)).convert('L')
                img = img.resize((200, 200), Image.Resampling.LANCZOS)
                img_np = np.array(img, 'uint8')

                # Detect face
                faces = detector.detectMultiScale(
                    img_np, 
                    scaleFactor=1.1,
                    minNeighbors=5,
                    minSize=(50, 50)
                )

                if len(faces) == 0:
                    print(f"⚠️ Ảnh {record['image_order']} không detect được mặt")
                    continue

                for (x, y, w, h) in faces:
                    face = img_np[y:y+h, x:x+w]
                    face = cv2.resize(face, (100, 100))
                    faceSamples.append(face)
                    ids.append(record['employee_id'])

                print(f"✅ {record['image_order']} -> {len(faces)} khuôn mặt")

            except Exception as e:
                print(f"❌ Lỗi xử lý ảnh: {str(e)}")
                continue

        if len(faceSamples) == 0:
            return False, f"❌ Không có khuôn mặt hợp lệ để training cho nhân viên {employee_id}"

        # Chuẩn hóa dữ liệu
        faceSamples_np = np.array(faceSamples, dtype=np.uint8)
        ids_np = np.array(ids, dtype=np.int32)

        print(f"🔧 Đang update model với {len(faceSamples_np)} khuôn mặt...")

        # Load model cũ
        recognizer = cv2.face.LBPHFaceRecognizer_create()
        
        if os.path.exists(trainer_path):
            recognizer.read(trainer_path)
            print("📂 Model hiện tại đã được load")
        else:
            print("⚠️ Model chưa có — sẽ train mới hoàn toàn")
            recognizer = cv2.face.LBPHFaceRecognizer_create(
                radius=1, neighbors=8, grid_x=8, grid_y=8
            )

        # Incremental update
        recognizer.update(faceSamples_np, ids_np)

        # Save model
        recognizer.write(trainer_path)

        return True, f"""
        ✅ Đã training thêm cho nhân viên:
        👤 {records[0]['employee_code']} - {records[0]['full_name']}
        📷 Số khuôn mặt: {len(faceSamples_np)}
        💾 Model đã cập nhật: {trainer_path}
        """

    except Exception as e:
        return False, f"❌ Lỗi training 1 nhân viên: {str(e)}"

    finally:
        cursor.close()
        conn.close()

def get_training_status():
    """
    Kiểm tra trạng thái training model
    """
    try:
        if not os.path.exists(trainer_path):
            return False, "Model chưa được training"
        
        # Kiểm tra model có load được không
        recognizer = cv2.face.LBPHFaceRecognizer_create()
        recognizer.read(trainer_path)
        
        file_size = os.path.getsize(trainer_path)
        modified_time = time.ctime(os.path.getmtime(trainer_path))
        
        return True, f"✅ Model đã sẵn sàng\n📏 Kích thước: {file_size} bytes\n⏰ Cập nhật: {modified_time}"
    
    except Exception as e:
        return False, f"❌ Model bị lỗi: {str(e)}"

def debug_training_data():
    """
    Debug dữ liệu training
    """
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cursor.execute("SELECT COUNT(*) as total FROM employee_face_dataset")
        total = cursor.fetchone()['total']
        
        cursor.execute("""
            SELECT e.employee_code, e.full_name, COUNT(fd.id) as image_count
            FROM employee_information e
            LEFT JOIN employee_face_dataset fd ON e.id = fd.employee_id
            WHERE e.status = 'active'
            GROUP BY e.id, e.employee_code, e.full_name
            HAVING COUNT(fd.id) > 0
        """)
        
        stats = cursor.fetchall()
        
        print(f"🔍 DEBUG TRAINING DATA:")
        print(f"📊 Tổng ảnh trong database: {total}")
        for stat in stats:
            print(f"   {stat['employee_code']} - {stat['full_name']}: {stat['image_count']} ảnh")
            
        return total > 0
        
    except Exception as e:
        print(f"❌ Lỗi debug: {str(e)}")
        return False
    finally:
        cursor.close()
        conn.close()

# Test training
if __name__ == "__main__":
    print("🧪 Testing training...")
    
    # Kiểm tra trạng thái hiện tại
    status, message = get_training_status()
    print(f"📋 Trạng thái model: {message}")
    
    # Debug trước
    has_data = debug_training_data()
    if not has_data:
        print("❌ Không có dữ liệu training!")
        exit()
    
    # Training
    success, message = train_model()
    print(message)

