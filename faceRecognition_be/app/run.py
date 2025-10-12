from flask import Flask
from routes.attendance import recognition_bp

def create_app():
    app = Flask(__name__)

    # Đăng ký blueprint
    app.register_blueprint(recognition_bp, url_prefix="/api/recognition")

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)
