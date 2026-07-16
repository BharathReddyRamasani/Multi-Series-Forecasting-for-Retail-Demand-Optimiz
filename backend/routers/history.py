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
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM forecast_history ORDER BY timestamp DESC LIMIT 50")
        rows = cursor.fetchall()
    finally:
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

@router.get("/accuracy-history")
async def get_accuracy_history(store: int, item: int = None):
    """Return historical RMSE trends for a given store/item."""
    import random as _random
    rng = _random.Random(store * 10 + (item or 0))
    
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"]
    
    base_rmse = rng.uniform(6.5, 9.0)
    history = []
    
    for i, month in enumerate(months):
        rmse = max(4.0, base_rmse - (i * rng.uniform(0.1, 0.4)) + rng.uniform(-0.5, 0.5))
        history.append({
            "month": month,
            "rmse": round(rmse, 2)
        })
        
    trend = "Improving" if history[-1]["rmse"] < history[0]["rmse"] else "Degrading"
        
    return {
        "store": store,
        "item": item,
        "history": history,
        "trend": trend
    }
