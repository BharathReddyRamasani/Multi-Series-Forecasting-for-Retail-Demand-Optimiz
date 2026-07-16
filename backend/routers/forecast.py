"""Forecast router — single and batch prediction endpoints."""
import io
import logging
import uuid
import pandas as pd
from datetime import datetime
from fastapi import APIRouter, Request, HTTPException, UploadFile, File
from schemas.models import (
    ForecastRequest,
    ForecastResponse,
    UploadResponse,
    StoreItemInfo,
)

logger = logging.getLogger(__name__)
router = APIRouter()




@router.post("/forecast", response_model=ForecastResponse)
async def generate_forecast(body: ForecastRequest, request: Request):
    """Generate a multi-horizon demand forecast for a single store-item pair."""
    forecaster = request.app.state.forecaster
    if not forecaster.is_loaded:
        raise HTTPException(status_code=503, detail="Models not loaded yet.")

    try:
        model_to_use = body.model_type
        if model_to_use == "auto":
            model_to_use = "lightgbm"
            
        predictions = forecaster.forecast(
            store=body.store,
            item=body.item,
            horizon=body.horizon,
            model_type=model_to_use,
            start_date=body.start_date,
            scenario_overrides=getattr(body, "scenario_overrides", None)
        )
        
        from database import get_db_connection
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            start = body.start_date if body.start_date else "2023-01-01" 
            cursor.execute("SELECT date, sales FROM sales WHERE store=? AND item=? AND date < ? ORDER BY date DESC LIMIT 90", (body.store, body.item, start))
            history_rows = cursor.fetchall()
            
            history = [{"date": row['date'], "sales": row['sales']} for row in reversed(history_rows)]
            
            expected_sales = sum(p['point'] for p in predictions)
            peak_pred = max(predictions, key=lambda x: x['point']) if predictions else {"date": "2023-01-01", "point": 0}
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
                
            history_mean = sum(row['sales'] for row in history) / len(history) if history else 0
            history_std = (sum((row['sales'] - history_mean)**2 for row in history) / max(1, len(history)))**0.5 if history else 0
            
            spike_expected = False
            spike_reason = ""
            if peak_pred['point'] > history_mean + 1.5 * history_std and history_std > 0 and peak_pred['point'] > history_mean * 1.2:
                spike_expected = True
                spike_reason = f"Peak demand ({round(peak_pred['point'])}) exceeds historical average ({round(history_mean)}) significantly."
                
            spreads = [(p['upper_95'] - p['lower_95']) / max(0.1, p['point']) for p in predictions]
            avg_spread = sum(spreads) / len(spreads) if spreads else 0
            if avg_spread < 0.2:
                confidence_score = "94%"
                prediction_risk = "Low"
            elif avg_spread < 0.4:
                confidence_score = "85%"
                prediction_risk = "Medium"
            else:
                confidence_score = "72%"
                prediction_risk = "High"
                
            job_id = uuid.uuid4().hex
            timestamp = datetime.now().isoformat()
            
            try:
                cursor.execute(
                    """
                    INSERT INTO forecast_history 
                    (id, timestamp, store_id, item_id, model, horizon, expected_demand)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (job_id, timestamp, body.store, body.item, model_to_use, body.horizon, expected_sales)
                )
                conn.commit()
            except Exception as insert_err:
                logger.warning("Failed to save forecast history: %s", insert_err)
        finally:
            conn.close()
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Forecast generation failed: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Forecast generation failed: {str(e)}")

    start = predictions[0]["date"] if predictions else ""
    return ForecastResponse(
        store=body.store,
        item=body.item,
        horizon=body.horizon,
        model_version=model_to_use,
        model_name=model_to_use.upper() if model_to_use != "lightgbm" else "LightGBM",
        start_date=start,
        forecasts=predictions,
        history=history,
        expected_sales=round(expected_sales, 1),
        peak_day=peak_day,
        safety_stock=round(safety_stock, 1),
        inventory_recommendation=round(inv_rec, 1),
        demand_trend=trend,
        confidence=confidence_score,
        spike_expected=spike_expected,
        spike_reason=spike_reason,
        prediction_risk=prediction_risk
    )


@router.post("/simulate", response_model=ForecastResponse)
async def simulate_forecast(body: ForecastRequest, request: Request):
    """Generate a What-If forecast based on scenario overrides."""
    return await generate_forecast(body, request)


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

    MAX_UPLOAD_SIZE = 50 * 1024 * 1024  # 50MB
    contents = await file.read()
    if len(contents) > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum upload size is 50MB.")
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
