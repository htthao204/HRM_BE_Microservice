# services/face_registration_service.py

import insightface
from insightface.app import FaceAnalysis
import cv2
import numpy as np
import requests
from psycopg2.extras import RealDictCursor
from config.db import get_connection
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)

class FaceRegistrationService:
    def __init__(self, similarity_threshold: float = 0.6):
        # Khởi tạo InsightFace app (load 1 lần)
        self.app = FaceAnalysis(allowed_modules=['detection', 'recognition'])
        self.app.prepare(ctx_id=-1)
        self.min_face_size = 100
        self.max_face_size = 800
        self.similarity_threshold = similarity_threshold

    # ---------------------- IMAGE UTILS ----------------------
    def download_image(self, image_url: str):
        try:
            resp = requests.get(image_url, timeout=7)
            if resp.status_code != 200:
                return None
            img_array = np.asarray(bytearray(resp.content), dtype=np.uint8)
            img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
            return img
        except Exception as e:
            logging.error(f"Error downloading image: {e}")
            return None

    def validate_image_quality(self, img: np.ndarray):
        gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
        brightness = np.mean(gray)
        if brightness < 40: return False, "Image too dark"
        if brightness > 220: return False, "Image too bright"
        contrast = gray.std()
        if contrast < 30: return False, "Low contrast"
        lap_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        if lap_var < 50: return False, "Image too blurry"
        h, w = img.shape[:2]
        if h < self.min_face_size or w < self.min_face_size: return False, "Image too small"
        if h > self.max_face_size or w > self.max_face_size: return False, "Image too large"
        return True, "GOOD"

    # ---------------------- REGISTRATION ----------------------
    def register_employee_face_from_file(self, file, employee_id: str):
        """Đăng ký 1 ảnh"""
        try:
            img = cv2.imdecode(np.frombuffer(file.read(), np.uint8), cv2.IMREAD_COLOR)
            if img is None: return {"success": False, "error": "Cannot decode image"}
            rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

            valid, msg = self.validate_image_quality(rgb_img)
            if not valid: return {"success": False, "error": f"Poor image quality: {msg}"}

            faces = self.app.get(rgb_img)
            if len(faces) == 0: return {"success": False, "error": "No face detected"}

            face = max(faces, key=lambda x: (x.bbox[2]-x.bbox[0])*(x.bbox[3]-x.bbox[1]))
            emb = face.normed_embedding
            if np.isnan(emb).any() or np.all(emb == 0): return {"success": False, "error": "Poor face embedding quality"}

            # Save DB
            conn = get_connection()
            cur = conn.cursor()
            cur.execute("UPDATE employee_face_data SET is_active=FALSE WHERE employee_id=%s", (employee_id,))
            cur.execute(
                "INSERT INTO employee_face_data (employee_id, face_encoding, is_active, image_quality) VALUES (%s,%s,TRUE,%s)",
                (employee_id, emb.tobytes(), msg)
            )
            conn.commit()
            cur.close()
            conn.close()
            return {"success": True, "message": "Face registration successful!", "image_quality": msg}
        except Exception as e:
            logging.error(f"Registration error {employee_id}: {e}")
            return {"success": False, "error": str(e)}

    def register_employee_faces_from_files(self, files, employee_id: str):
        """Đăng ký nhiều ảnh cùng lúc"""
        results = []
        for f in files:
            res = self.register_employee_face_from_file(f, employee_id)
            results.append({"filename": getattr(f, 'filename', 'unknown'), **res})
        success_count = sum(1 for r in results if r.get("success"))
        return {
            "success": success_count > 0,
            "message": f"Processed {success_count}/{len(files)} images successfully",
            "results": results,
            "total_images": len(files),
            "successful_uploads": success_count
        }

    def batch_register_from_dataset(self, employee_id: str):
        """Đăng ký từ dataset"""
        try:
            conn = get_connection()
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT image_url FROM employee_face_dataset WHERE employee_id=%s", (employee_id,))
            images = cur.fetchall()
            cur.close()
            conn.close()
            if not images: return {"success": False, "error": "No images found"}

            embeddings = []
            for img in images:
                data = self.download_image(img['image_url'])
                if data is None: continue
                rgb = cv2.cvtColor(data, cv2.COLOR_BGR2RGB)
                valid, _ = self.validate_image_quality(rgb)
                if not valid: continue
                faces = self.app.get(rgb)
                if not faces: continue
                face = max(faces, key=lambda x: (x.bbox[2]-x.bbox[0])*(x.bbox[3]-x.bbox[1]))
                embeddings.append(face.normed_embedding)

            if not embeddings: return {"success": False, "error": "Cannot extract any embedding"}

            arr = np.stack(embeddings)
            mean_emb = np.mean(arr, axis=0)
            dists = np.linalg.norm(arr - mean_emb, axis=1)
            filtered = arr[dists < np.percentile(dists, 90)]
            avg_emb = np.mean(filtered, axis=0)

            conn = get_connection()
            cur = conn.cursor()
            cur.execute("UPDATE employee_face_data SET is_active=FALSE WHERE employee_id=%s", (employee_id,))
            cur.execute(
                "INSERT INTO employee_face_data (employee_id, face_encoding, is_active) VALUES (%s,%s,TRUE)",
                (employee_id, avg_emb.tobytes())
            )
            conn.commit()
            cur.close()
            conn.close()
            return {"success": True, "message": "Batch registration successful using InsightFace"}
        except Exception as e:
            logging.error(f"Batch registration error: {e}")
            return {"success": False, "error": str(e)}

    # ---------------------- VERIFY ----------------------
    def verify_face(self, employee_id: str, image_url: str):
        try:
            img = self.download_image(image_url)
            if img is None: return {"success": False, "error": "Cannot download image"}
            rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            faces = self.app.get(rgb)
            if not faces: return {"success": False, "error": "No face detected"}
            face = max(faces, key=lambda x: (x.bbox[2]-x.bbox[0])*(x.bbox[3]-x.bbox[1]))
            emb = face.normed_embedding

            conn = get_connection()
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT face_encoding FROM employee_face_data WHERE employee_id=%s AND is_active=TRUE", (employee_id,))
            result = cur.fetchone()
            cur.close()
            conn.close()
            if not result: return {"success": False, "error": "No registered face found"}

            db_emb = np.frombuffer(result['face_encoding'], dtype=np.float32)
            sim = np.dot(emb, db_emb)/(np.linalg.norm(emb)*np.linalg.norm(db_emb))
            return {"success": True, "verified": sim >= self.similarity_threshold, "similarity": float(sim)}
        except Exception as e:
            logging.error(f"Verify error: {e}")
            return {"success": False, "error": str(e)}

    # ---------------------- STATUS & DATASET ----------------------
    def get_registration_status(self, employee_id: str):
        try:
            conn = get_connection()
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("""
                SELECT id, created_at AS registered_at, updated_at AS last_updated, is_active
                FROM employee_face_data
                WHERE employee_id=%s AND is_active=TRUE ORDER BY created_at DESC LIMIT 1
            """, (employee_id,))
            face_data = cur.fetchone()
            cur.execute("SELECT COUNT(*) as total_records FROM employee_face_data WHERE employee_id=%s", (employee_id,))
            total = cur.fetchone()['total_records']
            cur.close()
            conn.close()
            if face_data:
                return {"success": True, "is_registered": True,
                        "registered_at": face_data['registered_at'].isoformat() if face_data['registered_at'] else None,
                        "last_updated": face_data['last_updated'].isoformat() if face_data['last_updated'] else None,
                        "total_records": total,
                        "is_active": face_data['is_active']}
            return {"success": True, "is_registered": False, "registered_at": None, "last_updated": None,
                    "total_records": total, "is_active": False}
        except Exception as e:
            logging.error(f"Status error: {e}")
            return {"success": False, "error": str(e)}

    def get_dataset_info(self, employee_id: str):
        try:
            conn = get_connection()
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("""
                SELECT COUNT(*) as image_count,
                       COUNT(CASE WHEN face_detected=TRUE THEN 1 END) as detected_faces,
                       COUNT(CASE WHEN face_detected=FALSE THEN 1 END) as failed_detection,
                       MAX(created_at) as last_updated
                FROM employee_face_dataset
                WHERE employee_id=%s
            """, (employee_id,))
            info = cur.fetchone()
            cur.execute("SELECT COUNT(*) as has_dataset FROM employee_face_data WHERE employee_id=%s AND is_active=TRUE", (employee_id,))
            has_ds = cur.fetchone()['has_dataset'] > 0
            cur.close()
            conn.close()
            return {"success": True, "has_dataset": has_ds,
                    "image_count": info['image_count'],
                    "detected_faces": info['detected_faces'],
                    "failed_detection": info['failed_detection'],
                    "last_updated": info['last_updated'].isoformat() if info['last_updated'] else None}
        except Exception as e:
            logging.error(f"Dataset info error: {e}")
            return {"success": False, "error": str(e)}


# Khởi tạo singleton
face_registration_service = FaceRegistrationService()
