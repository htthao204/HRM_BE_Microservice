# # config/db.py
# import mysql.connector

# def get_connection():
#     return mysql.connector.connect(
#         host="localhost",
#         user="htt150704",
#         password="123456",
#         database="hrm_db"
#     )
import mysql.connector

def get_connection():
    return mysql.connector.connect(
        host="mysql_db",  
        user="root",
        password="123456",
        database="HRM_db"
    )
