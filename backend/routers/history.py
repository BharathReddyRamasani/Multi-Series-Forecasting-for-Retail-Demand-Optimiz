"""Historic prediction endpoint.

Provides actual vs. predicted sales for a store‑item pair over a configurable
historical window (default 30 days). Results are cached in a lightweight SQLite
file (`prediction_history.db`) to keep response times low.

Query parameters:
- ``store`` (int, required)
- ``item`` (int, required)
- ``days`` (int, optional, default 30) – size of the window
- ``sigma`` (float, optional, default 2) – outlier‑detection multiplier (exposed for UI)
"""

from fastapi import APIRouter, HTTPException, Query, Request
from typing import List, Dict, Any, Optional
import os
import sqlite3
from datetime import datetime, timedelta

# Import the forecaster service
from services.forecaster import ForecastingService
from database import get_db_connection

router = APIRouter(tags=["History"])

# Path to the SQLite cache file (stored next to the DB)
CACHE_DB_PATH = os.path.join(os.path.dirname(__file__), "..", "prediction_history.db")

def _init_cache_db():
    conn = sqlite3.connect(CACHE_DB_PATH)
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS prediction_history (
            store_id INTEGER,
            item_id INTEGER,
            date TEXT,
            actual REAL,
            predicted REAL,
            PRIMARY KEY (store_id, item_id, date)
        )
        """
    )
    conn.commit()
    conn.close()

# Ensure the cache table exists at import time
_init_cache_db()

@router.get("/prediction")
def get_prediction(
    request: Request,
    store: int = Query(..., description="Store ID"),
    item: int = Query(..., description="Item ID"),
    days: int = Query(30, description="Number of past days to return"),
    sigma: float = Query(2.0, description="Outlier sigma multiplier (default 2)")
) -> Dict[str, Any]:
    """Return a list of ``{date, actual, predicted, error, error_pct}`` rows.

    The endpoint first tries to satisfy the request from the SQLite cache. If
    cached rows for the requested window are missing, it recomputes the missing
    predictions using the existing Forecaster service and stores them for future
    requests.
    """
    # Normalise the window – end date is today (inclusive), start date is ``days`` days ago.
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=days - 1)  # inclusive range of ``days`` entries

    conn = sqlite3.connect(CACHE_DB_PATH)
    cur = conn.cursor()

    # Try to fetch cached rows for the requested window.
    cur.execute(
        "SELECT date, actual, predicted FROM prediction_history WHERE store_id=? AND item_id=? AND date BETWEEN ? AND ? ORDER BY date",
        (store, item, start_date.isoformat(), end_date.isoformat()),
    )
    cached_rows = cur.fetchall()
    cached_dates = {row[0] for row in cached_rows}

    # Determine which dates are missing from the cache.
    all_dates = [(start_date + timedelta(days=i)).isoformat() for i in range(days)]
    missing_dates = [d for d in all_dates if d not in cached_dates]

    forecaster = request.app.state.forecaster
    new_rows: List[tuple] = []

    for d in missing_dates:
        # Forecast for a single day: horizon=1, start_date = d
        try:
            forecast = forecaster.forecast(
                store=store,
                item=item,
                horizon=1,
                model_type="lightgbm",  # use the default model
                start_date=d,
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Forecast generation failed: {e}")
        predicted = forecast[0]["point"] if forecast else None

        # Pull the actual sales for the same date from the DB.
        db_conn = get_db_connection()
        cur_actual = db_conn.execute(
            "SELECT sales FROM sales WHERE store=? AND item=? AND date=?",
            (store, item, d),
        )
        actual_row = cur_actual.fetchone()
        db_conn.close()
        actual = actual_row[0] if actual_row else None

        # If we lack actual data (e.g., future dates), skip insertion.
        if actual is None or predicted is None:
            continue

        error = predicted - actual
        error_pct = (error / actual) * 100 if actual != 0 else None
        new_rows.append((store, item, d, actual, predicted))
        # Insert into cache.
        cur.execute(
            "INSERT OR REPLACE INTO prediction_history (store_id, item_id, date, actual, predicted) VALUES (?,?,?,?,?)",
            (store, item, d, actual, predicted),
        )
    conn.commit()

    # Combine cached and newly generated rows, sorted by date.
    cur.execute(
        "SELECT date, actual, predicted FROM prediction_history WHERE store_id=? AND item_id=? AND date BETWEEN ? AND ? ORDER BY date",
        (store, item, start_date.isoformat(), end_date.isoformat()),
    )
    all_rows = cur.fetchall()
    conn.close()

    # Build enriched output rows with error metrics.
    enriched: List[Dict[str, Any]] = []
    mae_sum = 0.0
    mape_sum = 0.0
    count = 0
    for date_str, actual_val, pred_val in all_rows:
        if actual_val is None or pred_val is None:
            continue
        err = pred_val - actual_val
        err_pct = (err / actual_val) * 100 if actual_val != 0 else None
        mae_sum += abs(err)
        if actual_val != 0:
            mape_sum += abs(err) / actual_val * 100
        count += 1
        enriched.append(
            {
                "date": date_str,
                "actual": actual_val,
                "predicted": pred_val,
                "error": err,
                "error_pct": err_pct,
            }
        )

    mae = mae_sum / count if count else None
    mape = mape_sum / count if count else None

    return {"rows": enriched, "mae": mae, "mape": mape, "sigma": sigma}
