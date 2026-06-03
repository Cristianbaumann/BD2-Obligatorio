import mysql.connector
from core.config import settings


def get_connection():
    return mysql.connector.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        database=settings.DB_NAME,
    )


def get_db():
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()
