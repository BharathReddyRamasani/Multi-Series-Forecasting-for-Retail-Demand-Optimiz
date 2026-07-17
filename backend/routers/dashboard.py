from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
import csv
from pathlib import Path
from database import get_db_connection

router = APIRouter()

MODELS_DIR = Path(__file__).resolve().parent.parent.parent / "models" / "v2"


def _read_wape(model_key: str) -> Optional[float]:
    """Read WAPE (real test metric) for a model; return as fraction or None."""
    try:
        with open(MODELS_DIR / model_key / f"{model_key}_metrics.csv", newline="") as f:
            for row in csv.DictReader(f):
                if row["Metric"].lower() == "wape":
                    return float(row["Value"]) / 100.0
    except Exception:
        return None
    return None


class DashboardResponse(BaseModel):
    total_stores: int
    total_items: int
    total_sales: int
    avg_daily_sales: float
    forecast_accuracy: str
    best_selling_store: int
    best_selling_item: int
    sales_trend: List[dict]

@router.get("/")
async def get_dashboard_data() -> DashboardResponse:
    conn = get_db_connection()
    try:
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM stores")
        total_stores = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM items")
        total_items = cursor.fetchone()[0]

        cursor.execute("SELECT SUM(sales) FROM sales")
        total_sales = cursor.fetchone()[0]

        cursor.execute("SELECT AVG(sales) FROM sales")
        avg_daily_sales = cursor.fetchone()[0]

        # Real forecast accuracy derived from the model's test WAPE.
        wape = _read_wape("lightgbm") or _read_wape("randomforest")
        if wape is not None:
            forecast_accuracy = f"{round((1.0 - wape) * 100, 1)}%"
        else:
            forecast_accuracy = "N/A"

        cursor.execute("SELECT store, SUM(sales) as s FROM sales GROUP BY store ORDER BY s DESC LIMIT 1")
        best_selling_store = cursor.fetchone()[0]

        cursor.execute("SELECT item, SUM(sales) as s FROM sales GROUP BY item ORDER BY s DESC LIMIT 1")
        best_selling_item = cursor.fetchone()[0]

        cursor.execute("SELECT strftime('%Y', date) as year, SUM(sales) as sales FROM sales GROUP BY year ORDER BY year")
        sales_trend = [{"year": row[0], "sales": row[1]} for row in cursor.fetchall()]
    finally:
        conn.close()

    return DashboardResponse(
        total_stores=total_stores,
        total_items=total_items,
        total_sales=int(total_sales) if total_sales else 0,
        avg_daily_sales=round(avg_daily_sales, 1) if avg_daily_sales else 0.0,
        forecast_accuracy=forecast_accuracy,
        best_selling_store=best_selling_store,
        best_selling_item=best_selling_item,
        sales_trend=sales_trend
    )
