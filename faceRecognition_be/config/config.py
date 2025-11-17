import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    URL = os.getenv("URL", "http://localhost/api")
    PORT = int(os.getenv("PORT", 5000))
    
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_NAME = os.getenv("DB_NAME", "hrm_db")
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "htt150704")
    DB_DIALECT = os.getenv("DB_DIALECT", "postgres")
    DB_PORT = os.getenv("DB_PORT", 5432)
    
    JWT_SECRET = os.getenv("JWT_SECRET")
    JWT_REFRESH_SECRET = os.getenv("JWT_REFRESH_SECRET")
    
    # PostgreSQL connection URL
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"