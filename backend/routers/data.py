from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from database import get_db_connection

router = APIRouter()

@router.get("/stores")
async def get_stores() -> List[int]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT store_id FROM stores ORDER BY store_id")
    stores = [row[0] for row in cursor.fetchall()]
    conn.close()
    return stores

@router.get("/items")
async def get_items() -> List[int]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT item_id FROM items ORDER BY item_id")
    items = [row[0] for row in cursor.fetchall()]
    conn.close()
    return items

class DatasetInfo(BaseModel):
    rows: int
    columns: int
    missing_values: int
    duplicates: int

@router.get("/dataset-info")
async def get_dataset_info() -> DatasetInfo:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM sales")
    rows = cursor.fetchone()[0]
    conn.close()
    
    return DatasetInfo(
        rows=rows,
        columns=4,
        missing_values=0,
        duplicates=0
    )
