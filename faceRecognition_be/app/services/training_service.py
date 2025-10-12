import cv2
import os
import numpy as np
from PIL import Image

# Paths
dataset_path = os.path.join(os.path.dirname(__file__),'..', 'utils', 'dataset')
trainer_path = os.path.join(os.path.dirname(__file__), '..', 'utils','trainer', 'trainer.yml')
cascade_path = os.path.join(os.path.dirname(__file__), '..', 'utils', 'haarcascade_frontalface_default.xml')
cascade_path = os.path.abspath(cascade_path)

# Tạo folder nếu chưa có
os.makedirs(dataset_path, exist_ok=True)
os.makedirs(os.path.dirname(trainer_path), exist_ok=True)

# Cascade
detector = cv2.CascadeClassifier(cascade_path)
if detector.empty():
    raise FileNotFoundError(f"Cascade file not found: {cascade_path}")

# Recognizer
recognizer = cv2.face.LBPHFaceRecognizer_create()

def train_model():
    imagePaths = [os.path.join(dataset_path, f) for f in os.listdir(dataset_path)]
    faceSamples = []
    ids = []

    for imagePath in imagePaths:
        PIL_img = Image.open(imagePath).convert('L')
        img_numpy = np.array(PIL_img, 'uint8')
        id = int(os.path.split(imagePath)[-1].split(".")[1])
        faces = detector.detectMultiScale(img_numpy)
        for (x, y, w, h) in faces:
            faceSamples.append(img_numpy[y:y+h, x:x+w])
            ids.append(id)

    if len(faceSamples) == 0:
        return False, "[ERROR] Không có khuôn mặt nào trong dataset!"

    recognizer.train(faceSamples, np.array(ids))
    recognizer.write(trainer_path)
    return True, f"Hoàn tất training {len(np.unique(ids))} faces. Model saved at {trainer_path}"
