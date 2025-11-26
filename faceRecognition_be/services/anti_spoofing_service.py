# services/anti_spoofing_service.py
import cv2
import numpy as np
import logging

logger = logging.getLogger(__name__)

class AntiSpoofingService:
    def __init__(self):
        self.initialized = True
        logger.info("✅ Anti-spoofing service initialized")
    
    # services/anti_spoofing_service.py
    def detect_spoof_simple(self, image, face_bbox):
        x1, y1, x2, y2 = map(int, face_bbox)
        
        try:
            # Crop khuôn mặt
            face_roi = image[y1:y2, x1:x2]
            if face_roi.size == 0:
                return {"is_real": False, "confidence": 0.0, "method": "empty_face"}
            
            # Phân tích texture (Laplacian Variance)
            gray_face = cv2.cvtColor(face_roi, cv2.COLOR_RGB2GRAY)
            laplacian_var = cv2.Laplacian(gray_face, cv2.CV_64F).var()
            
            # Phân tích màu sắc
            hsv_face = cv2.cvtColor(face_roi, cv2.COLOR_RGB2HSV)
            saturation = hsv_face[:, :, 1].mean()
            
            # Phân tích độ sáng
            brightness = gray_face.mean()
            
            # Phân tích kích thước
            face_area = (x2 - x1) * (y2 - y1)
            img_area = image.shape[0] * image.shape[1]
            area_ratio = face_area / img_area
            
            # DEBUG: In tất cả các chỉ số
            print(f"📊 ANTI-SPOOFING INDICATORS:")
            print(f"   - Laplacian Variance: {laplacian_var:.2f} (threshold: >80 = real)")
            print(f"   - Saturation: {saturation:.2f} (threshold: 30-70 = normal)")
            print(f"   - Brightness: {brightness:.2f} (threshold: 30-220 = normal)") 
            print(f"   - Area Ratio: {area_ratio:.3f} (threshold: 0.02-0.5 = normal)")
            
            # Đánh giá kết quả
            is_real, confidence, reasons = self._evaluate_spoof_indicators(
                laplacian_var, saturation, brightness, area_ratio
            )
            
            print(f"📊 EVALUATION: is_real={is_real}, confidence={confidence:.3f}, reasons={reasons}")
            
            return {
                "is_real": bool(is_real),
                "confidence": float(confidence),
                "method": "heuristic",
                "reasons": reasons,
                "indicators": {
                    "laplacian_variance": float(laplacian_var),
                    "saturation": float(saturation),
                    "brightness": float(brightness),
                    "area_ratio": float(area_ratio)
                }
            }
            
        except Exception as e:
            print(f"❌ Anti-spoofing error: {e}")
            return {"is_real": True, "confidence": 0.5, "method": "error", "error": str(e)}
    
    def _evaluate_spoof_indicators(self, laplacian_var, saturation, brightness, area_ratio):
        """
        Đánh giá các chỉ số spoofing
        """
        # Ngưỡng heuristic (có thể điều chỉnh theo testing)
        texture_threshold = 80    # Laplacian variance - ảnh thật có texture cao
        saturation_threshold = 30 # Saturation - da người có saturation trung bình
        brightness_min = 30       # Độ sáng tối thiểu
        brightness_max = 220      # Độ sáng tối đa
        area_min = 0.02           # Khuôn mặt quá nhỏ có thể là ảnh
        area_max = 0.5            # Khuôn mặt quá to có thể là video chiếu
        
        reasons = []
        score = 0
        
        # Kiểm tra texture
        if laplacian_var > texture_threshold:
            score += 1
            reasons.append("texture_clear")
        else:
            reasons.append("texture_blurry")
        
        # Kiểm tra saturation
        if saturation_threshold - 10 <= saturation <= saturation_threshold + 40:
            score += 1
            reasons.append("saturation_normal")
        else:
            reasons.append("saturation_abnormal")
        
        # Kiểm tra độ sáng
        if brightness_min <= brightness <= brightness_max:
            score += 1
            reasons.append("brightness_normal")
        else:
            reasons.append("brightness_abnormal")
        
        # Kiểm tra kích thước
        if area_min <= area_ratio <= area_max:
            score += 1
            reasons.append("size_normal")
        else:
            reasons.append("size_abnormal")
        
        # Tính confidence dựa trên số điều kiện thỏa mãn
        confidence = score / 4.0
        
        # Nếu thỏa mãn ít nhất 3/4 điều kiện -> real
        is_real = score >= 3
        
        return is_real, confidence, reasons

# Singleton instance
anti_spoofing_service = AntiSpoofingService()