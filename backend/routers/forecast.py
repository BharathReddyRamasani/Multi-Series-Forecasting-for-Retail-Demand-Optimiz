"""Forecast router — single and batch prediction endpoints."""
import io
import pandas as pd
from fastapi import APIRouter, Request, HTTPException, UploadFile, File
from schemas.models import (
    ForecastRequest,
    ForecastResponse,
    UploadResponse,
    StoreItemInfo,
)

router = APIRouter()


@router.post("/forecast", response_model=ForecastResponse)
async def generate_forecast(body: ForecastRequest, request: Request):
    """Generate a multi-horizon demand forecast for a single store-item pair."""
    forecaster = request.app.state.forecaster
    if not forecaster.is_loaded:
        raise HTTPException(status_code=503, detail="Models not loaded yet.")

    try:
        predictions = forecaster.forecast(
            store=body.store,
            item=body.item,
            horizon=body.horizon,
            model_type=body.model_type,
            start_date=body.start_date,
        )
        
        import pandas as pd
        from database import get_db_connection
        conn = get_db_connection()
        cursor = conn.cursor()
        start = body.start_date if body.start_date else "2023-01-01" 
        cursor.execute("SELECT date, sales FROM sales WHERE store=? AND item=? AND date < ? ORDER BY date DESC LIMIT 90", (body.store, body.item, start))
        history_rows = cursor.fetchall()
        
        history = [{"date": row['date'], "sales": row['sales']} for row in reversed(history_rows)]
        
        expected_sales = sum(p['point'] for p in predictions)
        peak_pred = max(predictions, key=lambda x: x['point'])
        peak_day = pd.to_datetime(peak_pred['date']).strftime('%A')
        
        safety_stock = expected_sales * 0.15
        inv_rec = expected_sales + safety_stock
        
        first_half = sum(p['point'] for p in predictions[:max(1, len(predictions)//2)])
        second_half = sum(p['point'] for p in predictions[max(1, len(predictions)//2):])
        if second_half > first_half * 1.05:
            trend = "Increasing"
        elif second_half < first_half * 0.95:
            trend = "Declining"
        else:
            trend = "Stable"
            
        import uuid
        from datetime import datetime
        cursor.execute(
            "INSERT INTO forecast_history (id, timestamp, store_id, item_id, model, horizon, expected_demand) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (str(uuid.uuid4()), datetime.now().isoformat(), body.store, body.item, body.model_type, body.horizon, expected_sales)
        )
        conn.commit()
        conn.close()
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    start = predictions[0]["date"] if predictions else ""
    return ForecastResponse(
        store=body.store,
        item=body.item,
        horizon=body.horizon,
        model_version=body.model_type,
        model_name=body.model_type.upper(),
        start_date=start,
        forecasts=predictions,
        history=history,
        expected_sales=round(expected_sales, 1),
        peak_day=peak_day,
        safety_stock=round(safety_stock, 1),
        inventory_recommendation=round(inv_rec, 1),
        demand_trend=trend,
        confidence="90%"
    )


@router.post("/forecast/batch")
async def batch_forecast(request: Request, body: dict):
    """
    Batch forecast for multiple store-item pairs.
    Body: {"pairs": [[store, item], ...], "horizon": 30, "start_date": "YYYY-MM-DD"}
    """
    forecaster = request.app.state.forecaster
    if not forecaster.is_loaded:
        raise HTTPException(status_code=503, detail="Models not loaded yet.")

    pairs = [tuple(p) for p in body.get("pairs", [])]
    horizon = body.get("horizon", 30)
    start_date = body.get("start_date")

    if not pairs:
        raise HTTPException(status_code=400, detail="No store-item pairs provided.")
    if len(pairs) > 50:
        raise HTTPException(status_code=400, detail="Max 50 pairs per batch request.")

    try:
        results = forecaster.batch_forecast(pairs, horizon, start_date)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"results": results, "pairs_count": len(pairs), "horizon": horizon}


@router.post("/upload", response_model=UploadResponse)
async def upload_data(request: Request, file: UploadFile = File(...)):
    """
    Upload historical sales CSV.
    Expected columns: date, store, item, sales
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")

    contents = await file.read()
    try:
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"CSV parse error: {e}")

    required = {"date", "store", "item", "sales"}
    if not required.issubset(df.columns):
        raise HTTPException(
            status_code=400,
            detail=f"CSV must contain columns: {required}. Got: {list(df.columns)}",
        )

    df["date"] = pd.to_datetime(df["date"])
    df["store"] = df["store"].astype(int)
    df["item"] = df["item"].astype(int)
    df["sales"] = df["sales"].astype(float)

    request.app.state.forecaster.set_custom_data(df)

    return UploadResponse(
        message="Data uploaded successfully.",
        rows_received=len(df),
        stores=sorted(df["store"].unique().tolist()),
        items=sorted(df["item"].unique().tolist()),
        date_range={
            "start": df["date"].min().strftime("%Y-%m-%d"),
            "end": df["date"].max().strftime("%Y-%m-%d"),
        },
    )


@router.get("/stores-items", response_model=StoreItemInfo)
async def get_stores_items(request: Request):
    """Return available store and item IDs."""
    forecaster = request.app.state.forecaster
    info = forecaster.get_available_stores_items()
    return StoreItemInfo(**info)
