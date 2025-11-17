import cloudinary
import cloudinary.uploader
import cloudinary.api
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

def delete_employee_dataset(employee_code):
    """
    Xóa toàn bộ dataset của một nhân viên trên Cloudinary
    Tìm theo pattern: EMP001_1, EMP001_2, etc.
    """
    try:
        print(f"🔍 Đang tìm ảnh của {employee_code} trên Cloudinary...")
        
        # TÌM TẤT CẢ ẢNH TRÊN CLOUDINARY
        result = cloudinary.api.resources(
            type="upload",
            max_results=100
        )
        
        resources = result.get('resources', [])
        print(f"📁 Tổng số ảnh trên Cloudinary: {len(resources)}")
        
        # LỌC RA ẢNH CỦA NHÂN VIÊN NÀY
        employee_resources = []
        search_pattern = f"{employee_code}_"
        
        for resource in resources:
            public_id = resource['public_id']
            if search_pattern in public_id:
                employee_resources.append(resource)
                print(f"   ✅ Tìm thấy: {public_id}")
        
        if not employee_resources:
            print(f"⚠️ Không tìm thấy ảnh nào của {employee_code} trên Cloudinary")
            return 0, 0, ["Không tìm thấy ảnh nào"]
        
        print(f"🗑️ Đang xóa {len(employee_resources)} ảnh của {employee_code}...")
        
        success_count = 0
        error_messages = []
        
        # XÓA TỪNG ẢNH
        for resource in employee_resources:
            public_id = resource['public_id']
            
            try:
                result = cloudinary.uploader.destroy(public_id)
                
                if result.get('result') == 'ok':
                    success_count += 1
                    print(f"   ✅ Đã xóa: {public_id}")
                else:
                    error_msg = f"Lỗi: {result.get('result', 'Unknown error')}"
                    error_messages.append(f"{public_id}: {error_msg}")
                    print(f"   ❌ Lỗi xóa {public_id}: {error_msg}")
                    
            except Exception as e:
                error_msg = f"Lỗi xóa: {str(e)}"
                error_messages.append(f"{public_id}: {error_msg}")
                print(f"   ❌ Lỗi xóa {public_id}: {error_msg}")
        
        print(f"✅ Đã xóa {success_count}/{len(employee_resources)} ảnh của {employee_code}")
        return success_count, len(employee_resources), error_messages
        
    except Exception as e:
        error_msg = f"Lỗi xóa dataset: {str(e)}"
        print(f"❌ {error_msg}")
        return 0, 0, [error_msg]

def delete_from_cloudinary_by_public_id(public_id):
    """
    Xóa ảnh trực tiếp bằng public_id
    
    Args:
        public_id: Public ID của ảnh trên Cloudinary
        
    Returns:
        tuple: (success, message)
    """
    try:
        result = cloudinary.uploader.destroy(public_id)
        
        if result.get('result') == 'ok':
            return True, "Xóa thành công"
        else:
            return False, f"Lỗi: {result.get('result', 'Unknown error')}"
            
    except Exception as e:
        return False, f"Lỗi xóa: {str(e)}"

def delete_from_cloudinary(image_url):
    """
    Xóa ảnh từ Cloudinary dựa trên URL
    
    Args:
        image_url: URL của ảnh cần xóa
        
    Returns:
        tuple: (success, message)
    """
    try:
        # Extract public_id từ URL
        # URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234567/public_id.jpg
        parts = image_url.split('/')
        
        # Tìm vị trí của 'upload'
        if 'upload' in parts:
            upload_index = parts.index('upload')
            # Public_id là phần sau 'upload'
            public_id_parts = parts[upload_index + 1:]
            public_id = '/'.join(public_id_parts).split('.')[0]  # Bỏ extension
            
            print(f"🗑️ Đang xóa ảnh từ URL: {public_id}")
            
            # Xóa ảnh
            result = cloudinary.uploader.destroy(public_id)
            
            if result.get('result') == 'ok':
                print(f"✅ Đã xóa ảnh: {public_id}")
                return True, "Xóa thành công"
            else:
                print(f"❌ Không thể xóa ảnh: {result}")
                return False, f"Lỗi: {result.get('result', 'Unknown error')}"
        else:
            return False, "Không tìm thấy public_id trong URL"
            
    except Exception as e:
        error_msg = f"Lỗi xóa Cloudinary: {str(e)}"
        print(f"❌ {error_msg}")
        return False, error_msg

def debug_cloudinary_images(employee_code=None):
    """
    Debug để xem tất cả ảnh đang có trên Cloudinary
    """
    try:
        result = cloudinary.api.resources(
            type="upload",
            max_results=100
        )
        
        resources = result.get('resources', [])
        print(f"📁 Tổng số ảnh trên Cloudinary: {len(resources)}")
        
        if employee_code:
            search_pattern = f"{employee_code}_"
            employee_resources = [r for r in resources if search_pattern in r['public_id']]
            print(f"🔍 Ảnh của {employee_code}: {len(employee_resources)} ảnh")
            
            for i, resource in enumerate(employee_resources):
                print(f"   {i+1}. {resource['public_id']} - {resource['url']}")
        else:
            for i, resource in enumerate(resources):
                print(f"{i+1}. {resource['public_id']} - {resource['url']}")
            
        return resources
        
    except Exception as e:
        print(f"❌ Lỗi debug: {str(e)}")
        return []

def get_cloudinary_usage():
    """
    Lấy thông tin sử dụng Cloudinary
    """
    try:
        result = cloudinary.api.usage()
        return True, result
    except Exception as e:
        return False, f"Lỗi lấy usage: {str(e)}"