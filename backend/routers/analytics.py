"""Analytics router — model metrics, feature importance, metadata."""
from fastapi import APIRouter, Request, HTTPException
from schemas.models import MetricsResponse, FeatureImportanceItem, ModelMetadata
from typing import List

router = APIRouter()


@router.get("/metrics", response_model=MetricsResponse)
async def get_metrics(request: Request):
    """Return model test and CV performance metrics."""
    forecaster = request.app.state.forecaster
    if not forecaster.is_loaded:
        raise HTTPException(status_code=503, detail="Models not loaded.")

    m = forecaster.metrics
    cv = forecaster.metadata.get("cv_performance", {})
    return MetricsResponse(
        rmse=m["rmse"],
        mae=m["mae"],
        r2=m["r2"],
        median_ae=m["median_ae"],
        mbe=m["mbe"],
        wape=m["wape"],
        training_time_sec=m["training_time_sec"],
        inference_latency_ms=m["inference_latency_ms"],
        cv_mean_rmse=cv.get("mean_rmse", 0),
        cv_mean_mae=cv.get("mean_mae", 0),
        cv_mean_mape=cv.get("mean_mape", 0),
        cv_mean_smape=cv.get("mean_smape", 0),
    )


@router.get("/feature-importance", response_model=List[FeatureImportanceItem])
async def get_feature_importance(request: Request, top_n: int = 20):
    """Return top-N feature importance scores."""
    forecaster = request.app.state.forecaster
    if not forecaster.is_loaded:
        raise HTTPException(status_code=503, detail="Models not loaded.")

    data = forecaster.feature_importance[:top_n]
    return [FeatureImportanceItem(**item) for item in data]


@router.get("/metadata", response_model=ModelMetadata)
async def get_metadata(request: Request):
    """Return model training metadata."""
    forecaster = request.app.state.forecaster
    if not forecaster.is_loaded:
        raise HTTPException(status_code=503, detail="Models not loaded.")

    return ModelMetadata(**forecaster.metadata)


@router.get("/model-summary")
async def get_model_summary(request: Request):
    """Return a comprehensive model summary for the dashboard."""
    forecaster = request.app.state.forecaster
    if not forecaster.is_loaded:
        raise HTTPException(status_code=503, detail="Models not loaded.")

    return {
        "metadata": forecaster.metadata,
        "metrics": forecaster.metrics,
        "top_features": forecaster.feature_importance[:10],
        "models": [
            {"name": "Point Forecast (Median)", "file": "lightgbm_forecaster.joblib"},
            {"name": "Lower Bound (Q5)", "file": "model_low_q05.joblib"},
            {"name": "Upper Bound (Q95)", "file": "model_high_q95.joblib"},
        ],
    }
