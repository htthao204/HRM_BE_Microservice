# services/cloudinary_uploader.py
import cv2
import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME", "dzdknv8bw"),
    api_key=os.getenv("CLOUDINARY_API_KEY", "918515121718777"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET", "HVkR8QdPMj4dagPorfWLXYjYsLs"),
    secure=True
)

def upload_to_cloudinary(face_image, employee_code, image_number):
    """
    Upload ảnh khuôn mặt lên Cloudinary
    
    Args:
        face_image: Ảnh khuôn mặt (numpy array từ OpenCV)
        employee_code: Mã nhân viên (VD: NV001)
        image_number: Số thứ tự ảnh (1-30)
        
    Returns:
        tuple: (success, image_url, error_message)
    """
    try:
        # Encode ảnh thành JPEG binary
        success, encoded_image = cv2.imencode('.jpg', face_image)
        if not success:
            return False, None, "Không thể encode ảnh"
        
        image_binary = encoded_image.tobytes()
        
        # Tạo public_id cho Cloudinary
        public_id = f"face-dataset/{employee_code}_{image_number}"
        
        print(f"📤 Uploading {employee_code}_{image_number}.jpg to Cloudinary...")
        
        # Upload lên Cloudinary
        upload_result = cloudinary.uploader.upload(
            image_binary,
            public_id=public_id,
            folder="face-dataset",
            overwrite=True,
            resource_type="image"
        )
        
        # Lấy URL từ kết quả
        image_url = upload_result['secure_url']  # HTTPS URL
        
        print(f" Upload thành công: {employee_code}_{image_number}.jpg")
        print(f"   URL: {image_url}")
        
        return True, image_url, None
        
    except Exception as e:
        error_msg = f"Lỗi upload Cloudinary: {str(e)}"
        print(f"❌ {error_msg}")
        return False, None, error_msg