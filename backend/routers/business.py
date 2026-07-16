"""Business Analytics router — mocks store KPIs and inventory risks based on forecasts."""
import random
from fastapi import APIRouter, Request, HTTPException
from schemas.models import StoreDashboardResponse, TopItem, InventoryResponse, InventoryItem

router = APIRouter()

@router.get("/dashboard", response_model=StoreDashboardResponse)
async def get_store_dashboard(store: int, request: Request):
    """Return business metrics for a specific store."""
    forecaster = request.app.state.forecaster
    if not forecaster.is_loaded:
        raise HTTPException(status_code=503, detail="Models not loaded.")

    # Mock business data generation based on the store ID to keep it consistent
    random.seed(store * 100)
    
    # Generate mock top items
    top_items = []
    for i in range(1, 6):
        item_id = random.randint(1, 50)
        volume = random.randint(500, 3000)
        price = round(random.uniform(10.0, 150.0), 2)
        top_items.append(
            TopItem(
                item_id=item_id,
                name=f"Premium SKU {item_id}",
                revenue=round(volume * price, 2),
                units_sold=volume,
            )
        )
    
    # Sort by revenue
    top_items.sort(key=lambda x: x.revenue, reverse=True)

    base_vol = random.randint(20000, 80000)
    base_rev = base_vol * random.uniform(30.0, 80.0)

    return StoreDashboardResponse(
        store_id=store,
        projected_revenue_30d=round(base_rev, 2),
        projected_volume_30d=base_vol,
        yoy_growth=round(random.uniform(-5.0, 15.0), 2),
        top_items=top_items,
        status="Healthy" if random.random() > 0.1 else "Needs Attention"
    )

@router.get("/inventory", response_model=InventoryResponse)
async def get_store_inventory(store: int, request: Request, horizon: int = 30):
    """Return inventory risk and reorder recommendations."""
    forecaster = request.app.state.forecaster
    if not forecaster.is_loaded:
        raise HTTPException(status_code=503, detail="Models not loaded.")

    random.seed(store * 200 + horizon)
    
    items = []
    # Pick a random subset of 10 items for the inventory action list
    sampled_items = random.sample(range(1, 51), 10)
    
    for item_id in sampled_items:
        # Scale demand based on horizon length
        base_daily_demand = random.uniform(3.0, 60.0)
        forecast = round(base_daily_demand * horizon, 2)
        
        # Create an inventory situation
        situation = random.choice(["Stockout Risk", "Healthy", "Overstock"])
        if situation == "Stockout Risk":
            current_stock = int(forecast * random.uniform(0.1, 0.4))
        elif situation == "Overstock":
            current_stock = int(forecast * random.uniform(2.5, 5.0))
        else:
            current_stock = int(forecast * random.uniform(0.8, 1.5))
            
        safety_stock = int(forecast * 0.2)
        
        # Calculate reorder recommendation
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
        
    # Sort with Stockout Risks first
    items.sort(key=lambda x: (x.risk_status != "Stockout Risk", x.risk_status == "Healthy", -x.reorder_rec))

    return InventoryResponse(
        store_id=store,
        items=items
    )
