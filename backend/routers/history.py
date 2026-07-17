from fastapi import APIRouter, Request, HTTPException
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
async def get_accuracy_history(store: int, item: int = None, request: Request = None):
    """Return real per-month backtest RMSE for a store-item (2022)."""
    forecaster = request.app.state.forecaster
    if not forecaster.is_loaded:
        raise HTTPException(status_code=503, detail="Models not loaded.")

    target_item = item if item else 1
    history = forecaster.monthly_backtest(store, target_item, year=2022)
    trend = "Stable"
    if len(history) >= 2:
        if history[-1]["rmse"] < history[0]["rmse"] - 0.5:
            trend = "Improving"
        elif history[-1]["rmse"] > history[0]["rmse"] + 0.5:
            trend = "Degrading"

    return {
        "store": store,
        "item": item,
        "history": history,
        "trend": trend,
    }
