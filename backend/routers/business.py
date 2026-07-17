"""Business Analytics router — real store KPIs and inventory risk from DB + forecasts."""
from typing import List, Optional
from fastapi import APIRouter, Request, HTTPException, Depends

from auth import get_current_active_user, User
from database import get_db_connection

router = APIRouter(dependencies=[Depends(get_current_active_user)])

# Assumed average unit price (USD) used only to translate forecast units into a
# revenue estimate. There is no price column in the dataset, so this is an
# explicit, documented assumption rather than fabricated per-SKU pricing.
ASSUMED_UNIT_PRICE = 25.0


def _forecast_store_volume(forecaster, store: int, horizon: int) -> dict:
    """Generate 30-day forecasts for every item in a store and aggregate."""
    info = forecaster.get_available_stores_items()
    items = info.get("items", [])
    total_units = 0.0
    per_item = []
    for item in items:
        try:
            preds = forecaster.forecast(
                store=store, item=item, horizon=horizon,
                model_type="lightgbm", start_date="2023-01-01",
            )
        except Exception:
            continue
        units = sum(p["point"] for p in preds)
        total_units += units
        per_item.append((item, units))
    per_item.sort(key=lambda x: x[1], reverse=True)
    return {"total_units": total_units, "per_item": per_item}


@router.get("/dashboard")
async def get_store_dashboard(store: int, request: Request, horizon: int = 30):
    """Return business metrics for a specific store, derived from real data."""
    forecaster = request.app.state.forecaster
    if not forecaster.is_loaded:
        raise HTTPException(status_code=503, detail="Models not loaded.")

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT COALESCE(SUM(sales),0) FROM sales WHERE store=?", (store,)
        )
        store_total = float(cursor.fetchone()[0] or 0.0)

        cursor.execute(
            "SELECT item, COALESCE(SUM(sales),0) FROM sales WHERE store=? GROUP BY item",
            (store,),
        )
        item_volumes = {int(r[0]): float(r[1]) for r in cursor.fetchall()}

        cursor.execute(
            "SELECT strftime('%Y', date) yr, COALESCE(SUM(sales),0) "
            "FROM sales WHERE store=? GROUP BY yr ORDER BY yr",
            (store,),
        )
        yearly = {r[0]: float(r[1]) for r in cursor.fetchall()}
    finally:
        conn.close()

    # Year-over-year growth from the last two calendar years available.
    years = sorted(yearly.keys())
    yoy_growth = 0.0
    if len(years) >= 2:
        prev, last = yearly[years[-2]], yearly[years[-1]]
        if prev > 0:
            yoy_growth = round((last - prev) / prev * 100.0, 2)

    # Top items by historical units sold.
    top = sorted(item_volumes.items(), key=lambda x: x[1], reverse=True)[:5]
    top_items = [
        {
            "item_id": iid,
            "name": f"SKU {iid}",
            "revenue": round(vol * ASSUMED_UNIT_PRICE, 2),
            "units_sold": int(vol),
        }
        for iid, vol in top
    ]

    # Projected next-`horizon` volume from live forecasts.
    proj = _forecast_store_volume(forecaster, store, horizon)
    projected_volume = int(round(proj["total_units"]))
    projected_revenue = round(projected_volume * ASSUMED_UNIT_PRICE, 2)

    status = "Healthy"
    if projected_volume <= 0:
        status = "Needs Attention"

    return {
        "store_id": store,
        "projected_revenue_30d": projected_revenue,
        "projected_volume_30d": projected_volume,
        "yoy_growth": yoy_growth,
        "top_items": top_items,
        "status": status,
    }


@router.get("/inventory")
async def get_store_inventory(
    store: int, request: Request, horizon: int = 30,
    safety_factor: float = 0.15,
):
    """Return inventory risk and reorder recommendations from real forecasts."""
    forecaster = request.app.state.forecaster
    if not forecaster.is_loaded:
        raise HTTPException(status_code=503, detail="Models not loaded.")

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT item, COALESCE(AVG(sales),0) FROM sales WHERE store=? GROUP BY item",
            (store,),
        )
        avg_rows = {int(r[0]): float(r[1]) for r in cursor.fetchall()}
    finally:
        conn.close()

    items = []
    for item in avg_rows:
        try:
            preds = forecaster.forecast(
                store=store, item=item, horizon=horizon,
                model_type="lightgbm", start_date="2023-01-01",
            )
        except Exception:
            continue
        forecast_units = sum(p["point"] for p in preds)
        # Current stock proxy: last 30 days of actual average demand (real data).
        current_stock = int(round(avg_rows[item] * horizon))
        safety_stock = int(round(forecast_units * safety_factor))
        target_stock = int(round(forecast_units + safety_stock))

        if current_stock < forecast_units * 0.5:
            risk_status = "Stockout Risk"
        elif current_stock > forecast_units * 2.0:
            risk_status = "Overstock"
        else:
            risk_status = "Healthy"

        reorder_rec = max(0, target_stock - current_stock)
        if risk_status == "Overstock":
            reorder_rec = 0

        items.append(
            {
                "item_id": item,
                "name": f"SKU {item}",
                "current_stock": current_stock,
                "forecast_30d": round(forecast_units, 2),
                "safety_stock": safety_stock,
                "risk_status": risk_status,
                "reorder_rec": reorder_rec,
            }
        )

    items.sort(
        key=lambda x: (
            x["risk_status"] != "Stockout Risk",
            x["risk_status"] == "Healthy",
            -x["reorder_rec"],
        )
    )
    return {"store_id": store, "items": items}


@router.get("/insights")
async def get_store_insights(store: int, request: Request):
    """Return data-driven business insights for a store."""
    forecaster = request.app.state.forecaster
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT date, sales FROM sales WHERE store=? ORDER BY date", (store,)
        )
        rows = cursor.fetchall()
    finally:
        conn.close()

    if not rows:
        return {
            "store_id": store,
            "insights": ["No sales history available for this store."],
            "recommendation": "Load sales data to generate insights.",
        }

    sales = [float(r[1]) for r in rows]
    dates = [r[0] for r in rows]
    n = len(sales)
    half = n // 2
    first_avg = sum(sales[:half]) / max(1, half)
    second_avg = sum(sales[half:]) / max(1, n - half)
    growth = ((second_avg - first_avg) / first_avg * 100.0) if first_avg else 0.0
    direction = "increasing" if growth > 0 else "decreasing"

    # Peak / slow weekday from historical sales.
    from collections import defaultdict
    import datetime as _dt
    wd = defaultdict(float)
    for d, s in zip(dates, sales):
        try:
            wd[_dt.datetime.strptime(d, "%Y-%m-%d").weekday()] += s
        except Exception:
            pass
    if wd:
        peak_wd = max(wd, key=wd.get)
        slow_wd = min(wd, key=wd.get)
        names = ["Monday", "Tuesday", "Wednesday", "Thursday",
                 "Friday", "Saturday", "Sunday"]
        peak = names[peak_wd]
        slow = names[slow_wd]
    else:
        peak, slow = "Friday", "Monday"

    # Simple risk heuristic: coefficient of variation of recent demand.
    recent = sales[-min(30, n):]
    mean_r = sum(recent) / len(recent)
    var_r = sum((x - mean_r) ** 2 for x in recent) / len(recent)
    cv = (var_r ** 0.5) / mean_r if mean_r else 0.0
    risk = "HIGH" if cv > 0.5 else ("MEDIUM" if cv > 0.25 else "LOW")
    rec = f"Increase safety stock by {int(min(50, cv*100))}%" if risk != "LOW" else "Maintain current levels"

    return {
        "store_id": store,
        "insights": [
            f"Demand {direction} {abs(round(growth, 1))}% over the observed period",
            f"Inventory risk {risk} (demand volatility CV={round(cv, 2)})",
            f"Peak day {peak}",
            f"Slow day {slow}",
        ],
        "recommendation": rec,
    }
