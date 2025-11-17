from flask import Flask
from flask_cors import CORS
from be_microservice.faceRecognition_be.routes.attendancehistory import recognition_bp

def create_app():
    app = Flask(__name__)

    # Bật CORS để Gateway có thể gọi đến
    CORS(app, resources={r"/*": {"origins": "*"}})

    # Đăng ký blueprint
    app.register_blueprint(recognition_bp, url_prefix="/api/recognition")

    @app.route("/health")
    def health_check():
        return {"status": "ok", "service": "flask-recognition"}

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5002, debug=True)