from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional

from services.forecaster import ForecastingService
from schemas.models import ExplainResponse

router = APIRouter(prefix="/api/explain", tags=["explainability"])

class ExplainRequest(BaseModel):
    store: int
    item: int
    forecast_date: str
    model_type: Optional[str] = "lightgbm"

@router.post("/", response_model=ExplainResponse)
def explain_prediction(
    req: ExplainRequest,
    request: Request
):
    """Generate SHAP explanations for a given forecast point."""
    forecaster = request.app.state.forecaster
    try:
        explanation = forecaster.explain(
            store=req.store,
            item=req.item,
            forecast_date=req.forecast_date,
            model_type=req.model_type
        )
        return ExplainResponse(**explanation)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
