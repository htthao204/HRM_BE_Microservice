import os
from flask import Flask
from routes.attendance import recognition_bp
from config.db import test_connection  # import hàm test_connection từ db.py

def create_app():
    app = Flask(__name__)
    app.register_blueprint(recognition_bp, url_prefix="/api/recognition")
    
    # Test kết nối DB ngay khi app start
    test_connection()
    
    return app

if __name__ == "__main__":
    app = create_app()
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=True)
