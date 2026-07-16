"""Business Analytics router — mocks store KPIs and inventory risks based on forecasts."""
import random as _random
from fastapi import APIRouter, Request, HTTPException
from schemas.models import StoreDashboardResponse, TopItem, InventoryResponse, InventoryItem

router = APIRouter()

@router.get("/dashboard", response_model=StoreDashboardResponse)
async def get_store_dashboard(store: int, request: Request):
    """Return business metrics for a specific store."""
    forecaster = request.app.state.forecaster
    if not forecaster.is_loaded:
        raise HTTPException(status_code=503, detail="Models not loaded.")

    rng = _random.Random(store * 100)
    
    top_items = []
    for i in range(1, 6):
        item_id = rng.randint(1, 50)
        volume = rng.randint(500, 3000)
        price = round(rng.uniform(10.0, 150.0), 2)
        top_items.append(
            TopItem(
                item_id=item_id,
                name=f"Premium SKU {item_id}",
                revenue=round(volume * price, 2),
                units_sold=volume,
            )
        )
    
    top_items.sort(key=lambda x: x.revenue, reverse=True)

    base_vol = rng.randint(20000, 80000)
    base_rev = base_vol * rng.uniform(30.0, 80.0)

    return StoreDashboardResponse(
        store_id=store,
        projected_revenue_30d=round(base_rev, 2),
        projected_volume_30d=base_vol,
        yoy_growth=round(rng.uniform(-5.0, 15.0), 2),
        top_items=top_items,
        status="Healthy" if rng.random() > 0.1 else "Needs Attention"
    )

@router.get("/inventory", response_model=InventoryResponse)
async def get_store_inventory(store: int, request: Request, horizon: int = 30):
    """Return inventory risk and reorder recommendations."""
    forecaster = request.app.state.forecaster
    if not forecaster.is_loaded:
        raise HTTPException(status_code=503, detail="Models not loaded.")

    rng = _random.Random(store * 200 + horizon)
    
    items = []
    sampled_items = rng.sample(range(1, 51), 10)
    
    for item_id in sampled_items:
        base_daily_demand = rng.uniform(3.0, 60.0)
        forecast = round(base_daily_demand * horizon, 2)
        
        situation = rng.choice(["Stockout Risk", "Healthy", "Overstock"])
        if situation == "Stockout Risk":
            current_stock = int(forecast * rng.uniform(0.1, 0.4))
        elif situation == "Overstock":
            current_stock = int(forecast * rng.uniform(2.5, 5.0))
        else:
            current_stock = int(forecast * rng.uniform(0.8, 1.5))
            
        safety_stock = int(forecast * 0.2)
        
        target_stock = forecast + safety_stock
        reorder_rec = max(0, int(target_stock - current_stock))
        if situation == "Overstock":
            reorder_rec = 0

        items.append(
            InventoryItem(
                item_id=item_id,
                name=f"Premium SKU {item_id}",
                current_stock=current_stock,
                forecast_30d=forecast,
                safety_stock=safety_stock,
                risk_status=situation,
                reorder_rec=reorder_rec,
            )
        )
        
    items.sort(key=lambda x: (x.risk_status != "Stockout Risk", x.risk_status == "Healthy", -x.reorder_rec))

    return InventoryResponse(
        store_id=store,
        items=items
    )

@router.get("/insights")
async def get_store_insights(store: int):
    """Return text-based business insights for a store."""
    rng = _random.Random(store * 300)
    
    growth = round(rng.uniform(-5.0, 15.0), 1)
    dir_str = "increasing" if growth > 0 else "decreasing"
    
    peak_days = ["Friday", "Saturday", "Sunday"]
    slow_days = ["Monday", "Tuesday", "Wednesday"]
    
    peak = rng.choice(peak_days)
    slow = rng.choice(slow_days)
    
    risk = "HIGH" if rng.random() > 0.7 else ("MEDIUM" if rng.random() > 0.4 else "LOW")
    rec = f"Increase stock by {rng.randint(10, 25)}%" if risk != "LOW" else "Maintain current levels"
    
    return {
        "store_id": store,
        "insights": [
            f"Demand {dir_str} {abs(growth)}% this month",
            f"Inventory risk {risk}",
            f"Peak day {peak}",
            f"Slow day {slow}"
        ],
        "recommendation": rec
    }
