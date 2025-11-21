import sys
import os
import cv2
import numpy as np
import time

# ==== FIX LỖI KHÔNG TÌM THẤY services ====
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

from services.face_recognition_service import face_recognition_service

CAMERA_INDEX = 0  # Camera mặc định
SIM_THRESHOLD = face_recognition_service.similarity_threshold


def main():
    print("🎥 Mở camera realtime để xem InsightFace hoạt động...")

    cap = cv2.VideoCapture(CAMERA_INDEX, cv2.CAP_DSHOW)

    if not cap.isOpened():
        print("❌ Không mở được camera.")
        return

    cv2.namedWindow("InsightFace Realtime Monitor", cv2.WINDOW_NORMAL)
    cv2.resizeWindow("InsightFace Realtime Monitor", 900, 600)

    while True:
        ret, frame = cap.read()
        if not ret:
            print("⚠ Không đọc được frame")
            break

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # Detect face
        faces = face_recognition_service.app.get(rgb)

        if not faces:
            cv2.putText(frame, "No face detected",
                        (20, 40),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        1.0,
                        (0, 0, 255),
                        2)
        else:
            for face in faces:
                x1, y1, x2, y2 = map(int, face.bbox)
                emb = face.embedding

                best_name = "Unknown"
                best_sim = 0.0

                # Kiểm tra có embeddings trong DB chưa
                if len(face_recognition_service.embeddings) == 0:
                    cv2.putText(frame, "No embeddings loaded (DB empty)",
                                (20, 70),
                                cv2.FONT_HERSHEY_SIMPLEX,
                                0.8,
                                (0, 0, 255), 2)
                else:
                    # So sánh cosine similarity
                    for emp_id, known_emb in face_recognition_service.embeddings.items():
                        sim = np.dot(emb, known_emb) / (
                            np.linalg.norm(emb) * np.linalg.norm(known_emb)
                        )
                        if sim > best_sim:
                            best_sim = sim
                            best_name = emp_id

                # Vẽ bounding box
                color = (0, 255, 0) if best_sim >= SIM_THRESHOLD else (0, 0, 255)
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)

                # Label
                label = f"{best_name} ({best_sim:.2f})"
                cv2.putText(frame, label, (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

        cv2.imshow("InsightFace Realtime Monitor", frame)

        # Nhấn Q để thoát
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
