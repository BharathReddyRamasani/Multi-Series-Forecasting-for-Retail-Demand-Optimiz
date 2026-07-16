import sqlite3
import pandas as pd
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'forecast.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    from setup_db import setup_database
    setup_database()
