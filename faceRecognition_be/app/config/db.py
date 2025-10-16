import os
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    if os.getenv("CLOUD_RUN") == "true":
        return mysql.connector.connect(
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME"),
            unix_socket=os.getenv("DB_SOCKET_PATH")
        )
    else:
        return mysql.connector.connect(
            host=os.getenv("DB_HOST"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME"),
            port=int(os.getenv("DB_PORT", 3306))
        )

def test_connection():
    try:
        conn = get_connection()
        print("✅ Database connection established.")
        conn.close()
    except mysql.connector.Error as err:
        print("❌ Unable to connect to the database:", err)

if __name__ == "__main__":
    test_connection()
