#!/usr/bin/env python3
"""
Script chạy đánh giá và visualization cho hệ thống nhận diện khuôn mặt
"""

import sys
import os
import random
from datetime import datetime, timedelta

# Thêm thư mục gốc vào path để import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# SỬA: Import từ cùng thư mục (evaluation)
try:
    from evaluation_service import evaluation_service
    print(" Import evaluation_service thành công")
except ImportError as e:
    print(f"❌ Lỗi import evaluation_service: {e}")
    print("🔧 Tạo evaluation_service tạm thời...")
    
    # Tạo class tạm thời nếu import thất bại
    class FaceRecognitionEvaluator:
        def __init__(self):
            self.evaluation_data = []
        
        def add_evaluation_result(self, employee_id, success, similarity, face_count, timestamp=None):
            record = {
                "employee_id": employee_id,
                "success": success,
                "similarity": similarity,
                "face_count": face_count,
                "timestamp": timestamp or datetime.now()
            }
            self.evaluation_data.append(record)
            print(f"📊 Added: {employee_id} - Success: {success} - Similarity: {similarity:.3f}")
        
        def get_basic_metrics(self):
            if not self.evaluation_data:
                return {}
            successes = [r["success"] for r in self.evaluation_data]
            similarities = [r["similarity"] for r in self.evaluation_data]
            return {
                "accuracy": np.mean(successes),
                "avg_similarity": np.mean(similarities),
                "total_records": len(self.evaluation_data),
                "success_count": sum(successes)
            }
    
    evaluation_service = FaceRecognitionEvaluator()

# Import thư viện sau khi xử lý evaluation_service
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

def create_demo_data():
    """Tạo dữ liệu demo cho đánh giá"""
    print("📊 Đang tạo dữ liệu demo...")
    
    employees = ["NV001", "NV002", "NV003", "NV004", "NV005", "NV006"]
    
    # Xóa dữ liệu cũ nếu có
    evaluation_service.evaluation_data = []
    
    # Tạo dữ liệu đánh giá
    for i in range(100):  # 100 records demo
        employee = random.choice(employees)
        
        # Tạo similarity score với phân phối khác nhau
        if employee in ["NV001", "NV002"]:  # Performance tốt
            similarity = random.uniform(0.75, 0.95)
        elif employee in ["NV005", "NV006"]:  # Performance kém
            similarity = random.uniform(0.3, 0.65)
        else:  # Performance trung bình
            similarity = random.uniform(0.5, 0.85)
        
        success = similarity >= 0.6
        face_count = random.choice([1, 1, 1, 2])
        
        # Timestamp ngẫu nhiên
        random_days = random.randint(0, 6)
        random_hours = random.randint(0, 23)
        timestamp = datetime.now() - timedelta(days=random_days, hours=random_hours)
        
        evaluation_service.add_evaluation_result(
            employee_id=employee,
            success=success,
            similarity=similarity,
            face_count=face_count,
            timestamp=timestamp
        )
    
    print(f" Đã tạo {len(evaluation_service.evaluation_data)} records demo")

def plot_simple_evaluation():
    """Vẽ biểu đồ đánh giá đơn giản"""
    if not evaluation_service.evaluation_data:
        print("❌ Không có dữ liệu để vẽ biểu đồ")
        return
    
    metrics = evaluation_service.get_basic_metrics()
    print(f"📊 KẾT QUẢ ĐÁNH GIÁ:")
    print(f"   • Độ chính xác: {metrics.get('accuracy', 0):.1%}")
    print(f"   • Similarity trung bình: {metrics.get('avg_similarity', 0):.3f}")
    print(f"   • Tổng số mẫu: {metrics.get('total_records', 0)}")
    
    # Phân tách dữ liệu
    successes = [r["similarity"] for r in evaluation_service.evaluation_data if r["success"]]
    failures = [r["similarity"] for r in evaluation_service.evaluation_data if not r["success"]]
    
    # Vẽ biểu đồ phân phối similarity
    plt.figure(figsize=(12, 6))
    
    plt.subplot(1, 2, 1)
    if successes:
        plt.hist(successes, bins=20, alpha=0.7, label='Thành công', color='green')
    if failures:
        plt.hist(failures, bins=20, alpha=0.7, label='Thất bại', color='red')
    plt.axvline(x=0.6, color='black', linestyle='--', label='Ngưỡng (0.6)')
    plt.xlabel('Similarity Score')
    plt.ylabel('Số lượng')
    plt.title('PHÂN PHỐI SIMILARITY SCORES')
    plt.legend()
    plt.grid(True, alpha=0.3)
    
    # Vẽ biểu đồ accuracy theo employee
    plt.subplot(1, 2, 2)
    employee_stats = {}
    for record in evaluation_service.evaluation_data:
        emp_id = record["employee_id"]
        if emp_id not in employee_stats:
            employee_stats[emp_id] = {"successes": 0, "total": 0}
        employee_stats[emp_id]["total"] += 1
        if record["success"]:
            employee_stats[emp_id]["successes"] += 1
    
    employees = list(employee_stats.keys())
    accuracies = [employee_stats[emp]["successes"] / employee_stats[emp]["total"] for emp in employees]
    
    colors = ['green' if acc >= 0.8 else 'orange' if acc >= 0.6 else 'red' for acc in accuracies]
    bars = plt.bar(employees, accuracies, color=colors, alpha=0.7)
    
    plt.axhline(y=0.8, color='blue', linestyle='--', alpha=0.7, label='Tốt (80%)')
    plt.xlabel('Nhân viên')
    plt.ylabel('Accuracy')
    plt.title('ĐỘ CHÍNH XÁC THEO NHÂN VIÊN')
    plt.xticks(rotation=45)
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.ylim(0, 1)
    
    # Thêm giá trị trên bars
    for bar, acc in zip(bars, accuracies):
        height = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2., height + 0.01,
                f'{acc:.1%}', ha='center', va='bottom', fontsize=9)
    
    plt.tight_layout()
    plt.show()
    
    return metrics

def demonstrate_evaluation():
    """Demo đánh giá hệ thống"""
    print("🎯 BẮT ĐẦU ĐÁNH GIÁ HỆ THỐNG NHẬN DIỆN KHUÔN MẶT")
    print("=" * 50)
    
    # Kiểm tra AttendanceLogService
    try:
        from services.attendance_log_service import AttendanceLogService
        if hasattr(AttendanceLogService, 'evaluation_log') and AttendanceLogService.evaluation_log:
            print(f"📂 Đang sử dụng {len(AttendanceLogService.evaluation_log)} records từ evaluation_log...")
            for log in AttendanceLogService.evaluation_log:
                evaluation_service.add_evaluation_result(
                    employee_id=log.get("employee_id", "unknown"),
                    success=log.get("success", False),
                    similarity=log.get("similarity", 0),
                    face_count=log.get("face_count", 0),
                    timestamp=log.get("timestamp", datetime.now())
                )
        else:
            create_demo_data()
    except ImportError:
        print("⚠️ Không tìm thấy AttendanceLogService, sử dụng dữ liệu demo")
        create_demo_data()
    
    # Chạy đánh giá
    if evaluation_service.evaluation_data:
        metrics = plot_simple_evaluation()
        
        # In báo cáo đơn giản
        print("\n📋 BÁO CÁO ĐÁNH GIÁ:")
        print(f"   • Tổng số lần nhận diện: {metrics.get('total_records', 0)}")
        print(f"   • Thành công: {metrics.get('success_count', 0)}")
        print(f"   • Thất bại: {metrics.get('total_records', 0) - metrics.get('success_count', 0)}")
        print(f"   • Độ chính xác hệ thống: {metrics.get('accuracy', 0):.1%}")
        
        if metrics.get('accuracy', 0) >= 0.9:
            print("   🏆 ĐÁNH GIÁ: HỆ THỐNG HOẠT ĐỘNG RẤT TỐT")
        elif metrics.get('accuracy', 0) >= 0.8:
            print("    ĐÁNH GIÁ: HỆ THỐNG HOẠT ĐỘNG TỐT")
        elif metrics.get('accuracy', 0) >= 0.7:
            print("   ⚠️  ĐÁNH GIÁ: HỆ THỐNG CẦN CẢI THIỆN")
        else:
            print("   ❌ ĐÁNH GIÁ: HỆ THỐNG CẦN ĐIỀU CHỈNH")
    else:
        print("❌ Không có dữ liệu để đánh giá")
    
    print("=" * 50)
    print("🎉 HOÀN THÀNH ĐÁNH GIÁ HỆ THỐNG!")

if __name__ == "__main__":
    # Thiết lập style cho biểu đồ
    plt.style.use('default')
    plt.rcParams['font.family'] = 'DejaVu Sans'
    plt.rcParams['figure.figsize'] = (10, 6)
    
    demonstrate_evaluation()
    
    # Giữ cửa sổ mở
    input("\n🖱️  Nhấn Enter để kết thúc...")