"""Health check router."""
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

@router.get("/gru-info")
async def gru_info():
    import torch
    from pathlib import Path
    try:
        model_path = Path(__file__).parent.parent.parent / "models" / "gru.pt"
        obj = torch.load(model_path, map_location="cpu", weights_only=False)
        if isinstance(obj, dict):
            shapes = {k: list(v.shape) if hasattr(v, 'shape') else str(type(v)) for k, v in obj.items()}
        else:
            shapes = {}
            for name, param in obj.named_parameters():
                shapes[name] = list(param.shape)
        return {"shapes": shapes}
    except Exception as e:
        return {"error": str(e)}
