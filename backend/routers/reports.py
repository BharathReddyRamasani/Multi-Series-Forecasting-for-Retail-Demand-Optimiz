from fastapi import APIRouter

router = APIRouter()

@router.get("/generate")
async def generate_report(type: str = "pdf"):
    return {"url": f"https://example.com/reports/demand_forecast_report.{type}", "message": f"Generated {type.upper()} report successfully."}
