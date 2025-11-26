# evaluation/evaluation_service.py
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
import logging
from typing import Dict, List
from sklearn.metrics import confusion_matrix

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FaceRecognitionEvaluator:
    def __init__(self):
        self.evaluation_data = []
        self.threshold = 0.6  # Ngưỡng hiện tại của hệ thống

    def add_evaluation_result(self, employee_id: str, success: bool, similarity: float,
                              face_count: int = 1, timestamp: datetime = None):
        """Thêm một lần nhận diện vào bộ dữ liệu đánh giá"""
        if timestamp is None:
            timestamp = datetime.now()

        record = {
            "employee_id": employee_id,
            "success": success,           # Đây là kết quả THỰC TẾ khi điểm danh (có vào được hay không)
            "similarity": similarity,     # Similarity do InsightFace tính ra
            "face_count": face_count,
            "timestamp": timestamp
        }
        self.evaluation_data.append(record)
        logger.info(f"Đã thêm evaluation record: {employee_id} - Success: {success} - Similarity: {similarity:.4f}")

    def get_basic_metrics(self) -> Dict:
        if not self.evaluation_data:
            return {}

        successes = [r["success"] for r in self.evaluation_data]
        similarities = [r["similarity"] for r in self.evaluation_data]

        return {
            "accuracy": np.mean(successes),
            "avg_similarity": np.mean(similarities),
            "total_records": len(self.evaluation_data),
            "success_count": int(np.sum(successes)),
            "failure_count": int(len(successes) - np.sum(successes))
        }

    # ===================================================================
    # 1. METRICS THỰC TẾ DỰA TRÊN SIMILARITY + THRESHOLD
    # ===================================================================
    def calculate_detection_metrics(self) -> Dict:
        """Tính Precision, Recall, F1 dựa trên similarity thật + threshold hiện tại"""
        if not self.evaluation_data:
            return {}

        tp = fp = fn = tn = 0
        for r in self.evaluation_data:
            actual_positive = r["success"]                    # Thực tế có điểm danh được không
            predicted_positive = r["similarity"] >= self.threshold

            if actual_positive and predicted_positive:
                tp += 1
            elif not actual_positive and predicted_positive:
                fp += 1
            elif actual_positive and not predicted_positive:
                fn += 1
            else:
                tn += 1

        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0

        return {
            "precision": precision,
            "recall": recall,
            "f1_score": f1,
            "true_positives": tp,
            "false_positives": fp,
            "false_negatives": fn,
            "true_negatives": tn,
            "threshold_used": self.threshold
        }

    # ===================================================================
    # 2. BIỂU ĐỒ CHUẨN 100% DỮ LIỆU THẬT
    # ===================================================================
    def plot_similarity_distribution(self):
        if not self.evaluation_data:
            return

        successes = [r["similarity"] for r in self.evaluation_data if r["success"]]
        failures = [r["similarity"] for r in self.evaluation_data if not r["success"]]

        plt.figure(figsize=(14, 6))

        # Histogram
        plt.subplot(1, 2, 1)
        if successes:
            plt.hist(successes, bins=25, alpha=0.7, label='Thành công (Real)', color='green', density=True)
        if failures:
            plt.hist(failures, bins=25, alpha=0.7, label='Thất bại (Real)', color='red', density=True)
        plt.axvline(x=self.threshold, color='black', linestyle='--', linewidth=2, label=f'Threshold = {self.threshold}')
        plt.xlabel('Similarity Score')
        plt.ylabel('Mật độ')
        plt.title('Phân phối Similarity Score ')
        plt.legend()
        plt.grid(True, alpha=0.3)

        # Boxplot
        plt.subplot(1, 2, 2)
        data = []
        labels = []
        if successes:
            data.append(successes)
            labels.append("Thành công")
        if failures:
            data.append(failures)
            labels.append("Thất bại")
        if data:
            plt.boxplot(data, labels=labels)
            plt.axhline(y=self.threshold, color='black', linestyle='--', label=f'Threshold {self.threshold}')
            plt.ylabel('Similarity Score')
            plt.title('Boxplot Similarity')
            plt.legend()
            plt.grid(True, alpha=0.3)

        plt.tight_layout()
        plt.show()

        return {
            "success_mean": np.mean(successes) if successes else 0,
            "failure_mean": np.mean(failures) if failures else 0,
            "success_std": np.std(successes) if successes else 0
        }

    def plot_confusion_matrix_and_threshold_analysis(self):
        if not self.evaluation_data:
            return

        y_true = [r["success"] for r in self.evaluation_data]
        y_pred_current = [r["similarity"] >= self.threshold for r in self.evaluation_data]

        # Confusion Matrix
        cm = confusion_matrix(y_true, y_pred_current)

        plt.figure(figsize=(16, 5))

        plt.subplot(1, 3, 1)
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                    xticklabels=['Dự đoán FAIL', 'Dự đoán SUCCESS'],
                    yticklabels=['Thực tế FAIL', 'Thực tế SUCCESS'])
        plt.title(f'Confusion Matrix (Threshold = {self.threshold})')
        plt.ylabel('Thực tế')
        plt.xlabel('Dự đoán')

        # Precision-Recall Curve
        plt.subplot(1, 3, 2)
        thresholds = np.linspace(0.3, 0.95, 100)
        precisions, recalls = [], []
        for t in thresholds:
            pred = [r["similarity"] >= t for r in self.evaluation_data]
            tp = sum(a and b for a, b in zip(y_true, pred))
            fp = sum((not a) and b for a, b in zip(y_true, pred))
            fn = sum(a and (not b) for a, b in zip(y_true, pred))
            precision = tp / (tp + fp) if (tp + fp) > 0 else 0
            recall = tp / (tp + fn) if (tp + fn) > 0 else 0
            precisions.append(precision)
            recalls.append(recall)

        plt.plot(recalls, precisions, 'bo-', linewidth=2, markersize=3)
        plt.xlabel('Recall')
        plt.ylabel('Precision')
        plt.title('Precision-Recall Curve')
        plt.grid(True, alpha=0.3)

        # Accuracy vs Threshold
        plt.subplot(1, 3, 3)
        accuracies = []
        for t in thresholds:
            pred = [r["similarity"] >= t for r in self.evaluation_data]
            acc = np.mean([a == b for a, b in zip(y_true, pred)])
            accuracies.append(acc)

        best_thresh = thresholds[np.argmax(accuracies)]
        plt.plot(thresholds, accuracies, 'ro-', linewidth=2, label='Accuracy')
        plt.axvline(x=self.threshold, color='black', linestyle='--', label=f'Hiện tại ({self.threshold})')
        plt.axvline(x=best_thresh, color='green', linestyle='-', label=f'Tối ưu ({best_thresh:.3f})')
        plt.xlabel('Similarity Threshold')
        plt.ylabel('Accuracy')
        plt.title('Accuracy theo Threshold')
        plt.legend()
        plt.grid(True, alpha=0.3)

        plt.tight_layout()
        plt.show()

        print(f"\nTHRESHOLD TỐI ƯU (theo Accuracy cao nhất): {best_thresh:.3f}")
        print(f"Accuracy tại threshold tối ưu: {max(accuracies):.3f}")

    # ===================================================================
    # 3. BÁO CÁO HOÀN CHỈNH
    # ===================================================================
    def generate_comprehensive_report(self):
        print("\n" + "="*70)
        print("BÁO CÁO ĐÁNH GIÁ MÔ HÌNH NHẬN DIỆN KHUÔN MẶT (100% DỮ LIỆU THỰC TẾ)")
        print("="*70)

        basic = self.get_basic_metrics()
        detection = self.calculate_detection_metrics()

        if basic:
            print(f"\nMETRICS CƠ BẢN:")
            print(f"   • Accuracy (thực tế điểm danh): {basic['accuracy']:.3%}")
            print(f"   • Avg Similarity: {basic['avg_similarity']:.3f}")
            print(f"   • Tổng lần nhận diện: {basic['total_records']}")
            print(f"   • Thành công / Thất bại: {basic['success_count']} / {basic['failure_count']}")

        if detection:
            print(f"\nMETRICS THEO THRESHOLD {self.threshold}:")
            print(f"   • Precision : {detection['precision']:.3%}")
            print(f"   • Recall    : {detection['recall']:.3%}")
            print(f"   • F1-Score  : {detection['f1_score']:.3%}")
            print(f"   • False Negatives (nên cải thiện): {detection['false_negatives']}")
            print(f"   • False Positives (rủi ro bảo mật): {detection['false_positives']}")

        print(f"\nĐỀ XUẤT:")
        if detection['false_negatives'] > 5 or detection['recall'] < 0.95:
            print("   Cần thu thập thêm ảnh khó (nghiêng, đeo kính, ánh sáng xấu)")
            print("   Hoặc giảm nhẹ threshold xuống ~0.55–0.58")
        elif detection['false_positives'] > 0:
            print("   Nên tăng threshold lên 0.70–0.78 để loại bỏ FP")
        else:
            print("   MÔ HÌNH ĐANG HOẠT ĐỘNG XUẤT SẮC! Có thể tăng threshold lên 0.75+")

        print("="*70)


# ==================== GLOBAL INSTANCE ====================
evaluation_service = FaceRecognitionEvaluator()