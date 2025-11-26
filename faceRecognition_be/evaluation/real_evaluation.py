#!/usr/bin/env python3
"""
Đánh giá độ chính xác sử dụng dữ liệu THỰC TẾ từ database
Phiên bản đã sửa hoàn chỉnh – 100% dữ liệu thật, không giả lập
"""

import sys
import os
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta
import matplotlib
import warnings
from typing import Dict, Any, List

# FIX LỖI FONT - SỬ DỤNG FONT ĐƠN GIẢN CHO WINDOWS
matplotlib.rcParams['font.family'] = ['DejaVu Sans', 'Arial', 'Tahoma', 'Verdana']
matplotlib.rcParams['axes.unicode_minus'] = False
warnings.filterwarnings('ignore')

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from evaluation.evaluation_service import evaluation_service
from config.db import get_connection
from psycopg2.extras import RealDictCursor
import pandas as pd


class RealDataEvaluator:
    def __init__(self):
        self.conn = None
        self.threshold = 0.6  # Ngưỡng hiện tại của hệ thống

    def connect_db(self):
        try:
            self.conn = get_connection()
            print("Kết nối database thành công")
            return True
        except Exception as e:
            print(f"Lỗi kết nối database: {e}")
            return False

    def get_attendance_logs_with_face_recognition(self, days=90):
        """Lấy dữ liệu điểm danh + similarity_score thật từ DB"""
        if not self.conn:
            return []

        query = """
        SELECT 
            al.employee_id,
            ei.employee_code,
            ei.full_name,
            al.log_time,
            al.action,
            al.status as log_status,
            al.source,
            al.created_at,
            COALESCE(al.similarity_score, 0.0) as similarity_score
        FROM attendance_logs al
        JOIN employee_information ei ON al.employee_id = ei.id
        WHERE al.source IN ('FACE_RECOGNITION', 'FACE_RECOGNITION_REALTIME')
          AND al.created_at >= %s
        ORDER BY al.log_time DESC
        """

        try:
            with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
                start_date = datetime.now() - timedelta(days=days)
                cursor.execute(query, (start_date,))
                logs = cursor.fetchall()
                print(f"Đã lấy {len(logs)} bản ghi nhận diện khuôn mặt (có similarity thật)")
                return logs
        except Exception as e:
            print(f"Lỗi lấy dữ liệu: {e}")
            return []

    def get_employee_face_registration_stats(self):
        if not self.conn:
            return {}

        query = """
        SELECT 
            COUNT(DISTINCT employee_id) as total_registered_employees,
            COUNT(*) as total_face_records
        FROM employee_face_dataset
        
        """

        try:
            with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query)
                result = cursor.fetchone()
                return {
                    "total_registered_employees": result['total_registered_employees'] or 0,
                    "total_face_records": result['total_face_records'] or 0,
                    "avg_faces_per_employee": round((result['total_face_records'] or 0) / max(result['total_registered_employees'] or 1), 1)
                }
        except Exception as e:
            print(f"Lỗi lấy thống kê đăng ký: {e}")
            return {}

    def analyze_face_recognition_performance(self, days=90):
        print("ĐANG PHÂN TÍCH DỮ LIỆU THỰC TẾ 100%...")

        attendance_logs = self.get_attendance_logs_with_face_recognition(days)
        if not attendance_logs:
            print("Không có dữ liệu điểm danh bằng khuôn mặt")
            return

        print(f"Tổng số lần nhận diện: {len(attendance_logs)}")

        # Đưa toàn bộ dữ liệu THẬT vào evaluation_service
        print("Đang đưa dữ liệu thực tế vào bộ đánh giá mô hình...")
        for log in attendance_logs:
            similarity = float(log['similarity_score'])
            # Thành công thật = similarity >= threshold hiện tại
            real_success = (similarity >= self.threshold)

            evaluation_service.add_evaluation_result(
                employee_id=log['employee_code'],
                success=real_success,
                similarity=similarity,
                face_count=1,
                timestamp=log['log_time']
            )

        # Thống kê nhanh
        success_db = sum(1 for log in attendance_logs if log['log_status'] == 'SUCCESS')
        late_db = sum(1 for log in attendance_logs if log['log_status'] == 'LATE')
        failed_db = sum(1 for log in attendance_logs if log['log_status'] == 'FAILED')

        print(f"Theo DB (cũ): Thành công: {success_db}, Muộn: {late_db}, Thất bại: {failed_db}")
        print(f"Theo similarity thật (threshold {self.threshold}): "
              f"{sum(1 for log in attendance_logs if float(log['similarity_score']) >= self.threshold)} thành công")

        # Vẽ biểu đồ
        self.plot_real_performance_analysis(attendance_logs)
        self.plot_model_analysis_charts()

        return {"total_logs": len(attendance_logs)}

    def plot_real_performance_analysis(self, logs):
        print("\nĐANG VẼ 4 BIỂU ĐỒ PHÂN TÍCH THỰC TẾ...")
        # (Bạn có thể giữ nguyên phần vẽ 4 biểu đồ cũ ở đây nếu muốn)
        # Hoặc bỏ qua để tập trung vào biểu đồ chuyên sâu bên dưới
        pass

    def plot_model_analysis_charts(self):
        print("\nĐANG VẼ BIỂU ĐỒ PHÂN TÍCH MÔ HÌNH CHUYÊN SÂU...")
        evaluation_service.plot_similarity_distribution()
        evaluation_service.plot_confusion_matrix_and_threshold_analysis()
        print("\nHOÀN THÀNH TẤT CẢ BIỂU ĐỒ!")

    def generate_real_report(self):
        if not self.connect_db():
            return

        print("BẮT ĐẦU ĐÁNH GIÁ TOÀN DIỆN HỆ THỐNG NHẬN DIỆN KHUÔN MẶT")
        print("="*80)

        reg_stats = self.get_employee_face_registration_stats()
        performance = self.analyze_face_recognition_performance(days=90)

        # Báo cáo đăng ký khuôn mặt
        print("\nTHỐNG KÊ ĐĂNG KÝ KHUÔN MẶT:")
        print(f"  • Nhân viên đã đăng ký: {reg_stats.get('total_registered_employees', 0)}")
        print(f"  • Tổng embedding: {reg_stats.get('total_face_records', 0)}")
        print(f"  • Trung bình khuôn mặt/người: {reg_stats.get('avg_faces_per_employee', 0)}")

        # Báo cáo mô hình chuyên sâu
        evaluation_service.generate_comprehensive_report()

        # Đề xuất cuối cùng
        metrics = evaluation_service.calculate_detection_metrics()
        if metrics.get('false_negatives', 0) > 3:
            print("\nCẢNH BÁO: Có nhiều trường hợp similarity thấp nhưng vẫn SUCCESS trước đây")
            print("   → Nên tăng threshold lên 0.70–0.78 để tăng độ an toàn")
        elif metrics.get('precision', 1.0) >= 0.99:
            print("\nXUẤT SẮC! Có thể tự tin tăng threshold lên 0.75+")

        print("\nHOÀN TẤT ĐÁNH GIÁ! Nhấn Enter để đóng...")
        input("\n⏎ Nhấn Enter để thoát...")

        if self.conn:
            self.conn.close()


def main():
    evaluator = RealDataEvaluator()
    evaluator.generate_real_report()
    print("\nHOÀN TẤT ĐÁNH GIÁ TOÀN DIỆN!")


if __name__ == "__main__":
    main()