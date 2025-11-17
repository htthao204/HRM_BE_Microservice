# app.py
from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
from routes.recognition_socket import RealtimeRecognitionNamespace
from routes.attendance_calendar_router import attendance_calendar_bp
from routes.attendance_log_router import attendance_log_bp
from routes.attendance_summary_router import attendance_summary_bp
from routes.recognition_router import recognition_bp
from routes.dataset_router import face_dataset_bp
from routes.face_training_router import face_training_bp

def create_app():
    app = Flask(__name__)
    
    # CORS
    CORS(
        app,
        origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
        supports_credentials=True,
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"]
    )

    # REGISTER BLUEPRINTS
    app.register_blueprint(recognition_bp, url_prefix="/api/recognition/attendance")
    app.register_blueprint(attendance_log_bp, url_prefix="/api/recognition/attendance")
    app.register_blueprint(attendance_summary_bp, url_prefix="/api/recognition/attendance")
    app.register_blueprint(attendance_calendar_bp, url_prefix="/api/recognition/attendance")
    app.register_blueprint(face_dataset_bp, url_prefix="/api/recognition/attendance")
    app.register_blueprint(face_training_bp, url_prefix="/api/recognition/attendance")

    @app.route("/")
    def home():
        return {"status": "running", "service": "face-recognition-api"}

    @app.route("/health")
    def health_check():
        return {"status": "healthy", "service": "face-recognition"}

    @app.route("/health/python")
    def health_check_python():
        return {
            "success": True,
            "service": "face-recognition",
            "status": "healthy",
            "timestamp": "2024-01-01T00:00:00Z"
        }

    return app

# --- INIT APP & SOCKET ---
app = create_app()
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="eventlet")

# Register Socket.IO namespace
socketio.on_namespace(RealtimeRecognitionNamespace("/realtime"))

# --- RUN SERVER ---
if __name__ == "__main__":
    print("🚀 Starting Flask Face Recognition API with SocketIO on port 5002...")
    print("📡 Available endpoints:")
    print("   - http://localhost:5002/api/recognition/attendance")
    print("   - http://localhost:5002/api/recognition/dataset_info/<id>")
    print("   - http://localhost:5002/api/recognition/attendance/history")
    print("   - http://localhost:5002/api/recognition/attendance/summary")
    print("   - http://localhost:5002/api/recognition/attendance/calendar")
    print("   - http://localhost:5002/health")
    print("🔌 Socket.IO namespace: /realtime")
    socketio.run(app, host="0.0.0.0", port=5002, debug=True)