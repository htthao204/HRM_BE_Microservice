import os
from flask import Flask
from routes.attendance import recognition_bp

def create_app():
    app = Flask(__name__)
    app.register_blueprint(recognition_bp, url_prefix="/api/recognition")
    return app

if __name__ == "__main__":
    app = create_app()
    # Lấy port từ biến môi trường, default 8080
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=True)


