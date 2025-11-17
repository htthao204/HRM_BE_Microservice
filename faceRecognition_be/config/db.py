import psycopg2
from psycopg2.extras import RealDictCursor

def get_connection():
    return psycopg2.connect(
        host="localhost",
        database="hrm_db",
        user="postgres",
        password="htt150704",
        port="5432"
    )