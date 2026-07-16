from fastapi import APIRouter, Request
from schemas.models import HealthResponse

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
async def health_check(request: Request):
    forecaster = getattr(request.app.state, "forecaster", None)
    return HealthResponse(
        status="healthy",
        model_loaded=forecaster is not None and forecaster.is_loaded,
        version="1.0.0",
    )
