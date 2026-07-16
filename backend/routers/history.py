from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from database import get_db_connection

router = APIRouter()

class ForecastJob(BaseModel):
    id: str
    date: str
    store: int
    item: int
    model: str
    horizon: int
    expected_demand: float

@router.get("/")
async def get_history() -> List[ForecastJob]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM forecast_history ORDER BY timestamp DESC LIMIT 50")
    rows = cursor.fetchall()
    conn.close()
    
    return [
        ForecastJob(
            id=row['id'],
            date=row['timestamp'],
            store=row['store_id'],
            item=row['item_id'],
            model=row['model'],
            horizon=row['horizon'],
            expected_demand=row['expected_demand']
        )
        for row in rows
    ]
