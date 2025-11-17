# routes/recognition_socket.py
from flask_socketio import Namespace, emit
import cv2
import numpy as np
import base64
from services.realtime_recognition import recognize_from_frame

class RealtimeRecognitionNamespace(Namespace):
    def on_connect(self):
        print(f"✅ Client connected to realtime namespace: {self.namespace}")
        emit('connection_status', {
            'status': 'connected', 
            'message': 'Connected to realtime recognition service'
        })

    def on_disconnect(self):
        print(f"❌ Client disconnected from realtime namespace: {self.namespace}")

    def on_start_recognition(self, data):
        """Bắt đầu realtime recognition"""
        employee_id = data.get('employee_id')
        print(f"🎥 Starting realtime recognition for employee {employee_id}")
        
        emit('recognition_status', {
            'status': 'started',
            'message': 'Realtime face recognition started',
            'employee_id': employee_id
        })

    def on_stop_recognition(self, data):
        """Dừng realtime recognition"""
        print(f"⏹️ Stopping realtime recognition")
        emit('recognition_status', {
            'status': 'stopped',
            'message': 'Realtime recognition stopped'
        })

    def on_frame(self, data):
        """Xử lý frame từ client - REALTIME"""
        try:
            employee_id = data.get("employee_id")
            image_base64 = data.get("image")
            
            if not image_base64:
                emit('frame_error', {'error': 'No image data'})
                return

            # Remove data URL prefix if present
            if ',' in image_base64:
                image_base64 = image_base64.split(',')[1]
            
            # Decode base64 to image
            img_bytes = base64.b64decode(image_base64)
            np_arr = np.frombuffer(img_bytes, np.uint8)
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

            if frame is None:
                emit('frame_error', {'error': 'Invalid image data'})
                return

            # Nhận diện khuôn mặt
            result = recognize_from_frame(frame, employee_id)
            
            # Gửi kết quả về client
            emit('frame_result', result)
            
            # Gửi kết quả điểm danh nếu thành công
            if result.get('success') and result.get('recognized_count', 0) > 0:
                for face in result.get('recognized_faces', []):
                    if face.get('attendance_status') == 'success':
                        emit('attendance_result', {
                            'employee_id': face['employee_id'],
                            'employee_code': face['employee_code'],
                            'name': face['name'],
                            'confidence': face['confidence'],
                            'timestamp': face['timestamp'],
                            'message': face.get('attendance_message', 'Điểm danh thành công'),
                            'action': face.get('action', 'CHECKIN')
                        })
                        
        except Exception as e:
            print(f"❌ Error processing frame: {str(e)}")
            emit('frame_error', {'error': str(e)})