# face_recognize_window.py
import os
import glob
import time
import cv2
import numpy as np
from insightface.app import FaceAnalysis

# --------- CẤU HÌNH ---------
KNOWN_FACES_DIR = "known_faces"   # thư mục chứa folder từng người: known_faces/Alice/*.jpg
CAMERA_INDEX = 0                  # thay nếu cần (0,1,...)
SIMILARITY_THRESHOLD = 0.50       # ngưỡng cosine similarity để coi là match (tune: 0.45-0.6)
DET_SIZE = (640, 640)             # kích thước detect (tăng nếu cần độ chính xác)
# ----------------------------

def load_face_db(app):
    """
    Duyệt KNOWN_FACES_DIR, tính embedding trung bình cho mỗi người.
    Trả về dict: {name: embedding (np.array)}
    """
    db = {}
    for person_dir in sorted(os.listdir(KNOWN_FACES_DIR) if os.path.exists(KNOWN_FACES_DIR) else []):
        full_dir = os.path.join(KNOWN_FACES_DIR, person_dir)
        if not os.path.isdir(full_dir):
            continue
        embeddings = []
        for img_path in glob.glob(os.path.join(full_dir, "*")):
            img = cv2.imread(img_path)
            if img is None:
                print(f"[WARN] Không đọc được ảnh: {img_path}")
                continue
            # InsightFace expects BGR images (OpenCV) and will handle conversion internally
            faces = app.get(img)
            if not faces:
                print(f"[WARN] Không phát hiện mặt trong {img_path}")
                continue
            # lấy embedding của face đầu tiên
            emb = faces[0].embedding  # vector 512-d (tùy model)
            embeddings.append(emb)
        if embeddings:
            avg = np.mean(np.stack(embeddings, axis=0), axis=0)
            # chuẩn hóa để so sánh cosine dễ hơn
            avg = avg / np.linalg.norm(avg)
            db[person_dir] = avg
            print(f"[DB] Đã thêm {person_dir} ({len(embeddings)} ảnh)")
        else:
            print(f"[DB] Bỏ qua {person_dir} (không có embedding)")
    return db

def cosine_similarity(a, b):
    # a, b: 1D numpy arrays (assumes normalized)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

def recognize_in_frame(app, frame, db):
    """
    Trả về list các kết quả: dict {bbox, score, name, sim}
    bbox = [x1,y1,x2,y2]
    """
    results = []
    faces = app.get(frame)
    for f in faces:
        # f.bbox is [x1, y1, x2, y2]; f.det_score maybe
        bbox = [int(round(x)) for x in f.bbox]
        det_score = float(getattr(f, "det_score", 0.0))
        emb = f.embedding
        # normalize
        if np.linalg.norm(emb) > 0:
            emb = emb / np.linalg.norm(emb)
        best_name = "Unknown"
        best_sim = 0.0
        for name, db_emb in db.items():
            sim = cosine_similarity(emb, db_emb)
            if sim > best_sim:
                best_sim = sim
                best_name = name
        if best_sim < SIMILARITY_THRESHOLD:
            best_name = "Unknown"
        results.append({
            "bbox": bbox,
            "det_score": det_score,
            "name": best_name,
            "sim": best_sim
        })
    return results

def draw_results(frame, results):
    for r in results:
        x1,y1,x2,y2 = r["bbox"]
        name = r["name"]
        sim = r["sim"]
        # vẽ rectangle
        cv2.rectangle(frame, (x1,y1), (x2,y2), (0,255,0), 2)
        # label text
        label = f"{name} ({sim:.2f})" if name != "Unknown" else "Unknown"
        # text background
        (w,h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
        cv2.rectangle(frame, (x1, y1 - 22), (x1 + w, y1), (0,255,0), -1)
        cv2.putText(frame, label, (x1, y1 - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0,0,0), 2)

def main():
    print("[INFO] Khởi tạo model insightface...")
    app = FaceAnalysis(name="antelope")   # 'antelope' là model khá nhẹ và tốt cho detect+reid
    # ctx_id = 0 là GPU; nếu muốn chắc chạy trên CPU dùng ctx_id = -1
    # để chạy trên CPU: app.prepare(ctx_id=-1, det_size=DET_SIZE)
    try:
        app.prepare(ctx_id=0, det_size=DET_SIZE)  # thử GPU (nếu không có sẽ lỗi -> bạn có thể đổi -1)
    except Exception as e:
        print("[WARN] Không khởi động GPU model, thử CPU. Lỗi:", e)
        app.prepare(ctx_id=-1, det_size=DET_SIZE)

    print("[INFO] Tạo database khuôn mặt từ", KNOWN_FACES_DIR)
    db = load_face_db(app)

    # Mở camera
    cap = cv2.VideoCapture(CAMERA_INDEX, cv2.CAP_DSHOW)  # CV feature for Windows to reduce lag
    if not cap.isOpened():
        print("[ERROR] Không mở được camera index", CAMERA_INDEX)
        return

    # Tạo cửa sổ OpenCV (Window)
    win_name = "Face Recognition - InsightFace (Press 'q' to quit)"
    cv2.namedWindow(win_name, cv2.WINDOW_NORMAL)
    cv2.resizeWindow(win_name, 960, 540)

    last_fps_time = time.time()
    frame_count = 0

    print("[INFO] Bắt đầu nhận diện. Nhấn 'q' để thoát.")
    while True:
        ret, frame = cap.read()
        if not ret:
            print("[WARN] Không đọc được frame từ camera.")
            break

        frame_count += 1
        results = recognize_in_frame(app, frame, db)
        draw_results(frame, results)

        # calculate fps every 30 frames
        if frame_count % 30 == 0:
            now = time.time()
            fps = 30.0 / (now - last_fps_time) if now - last_fps_time > 0 else 0.0
            last_fps_time = now
            cv2.putText(frame, f"FPS: {fps:.1f}", (10,30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,255,0), 2)

        cv2.imshow(win_name, frame)
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
        # nếu muốn chụp ảnh register nhanh: nhấn 'r' để chụp và lưu (nếu cần)
        if key == ord('r'):
            ts = int(time.time())
            fname = f"capture_{ts}.jpg"
            cv2.imwrite(fname, frame)
            print("[INFO] Saved", fname)

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
