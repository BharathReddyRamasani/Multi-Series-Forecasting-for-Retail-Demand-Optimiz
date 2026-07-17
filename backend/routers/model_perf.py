from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List, Optional
from pathlib import Path

router = APIRouter()

MODELS_DIR = Path(__file__).parent.parent.parent / "models"
V2_DIR = MODELS_DIR / "v2"

class ModelComparison(BaseModel):
    model: str
    rmse: float
    mae: float
    mape: float
    training_time: float
    prediction_time: float

class ModelPerfResponse(BaseModel):
    model_used: str
    training_time: str
    features_used: int
    rmse: float
    mae: float
    mape: float
    r2: float
    rmsle: float
    comparison: List[ModelComparison]

    model_config = {"protected_namespaces": ()}

def _read_metrics(model_key: str) -> Optional[dict]:
    for base in [V2_DIR, MODELS_DIR]:
        path = base / model_key / f"{model_key}_metrics.csv"
        if path.exists():
            try:
                import csv
                with open(path, newline="") as f:
                    reader = csv.DictReader(f)
                    metrics = {}
                    for row in reader:
                        metrics[row["Metric"].lower()] = float(row["Value"])
                    return metrics
            except Exception:
                pass
    return None

def _get_all_comparisons() -> List[ModelComparison]:
    comparisons = []
    model_names = {"lightgbm": "LightGBM", "xgboost": "XGBoost", "randomforest": "RandomForest"}
    for key in ["lightgbm", "xgboost", "randomforest"]:
        m = _read_metrics(key)
        if m:
            comparisons.append(ModelComparison(
                model=model_names.get(key, key),
                rmse=m.get("rmse", 0),
                mae=m.get("mae", 0),
                mape=m.get("mape", 0),
                training_time=m.get("training_time_sec", 0),
                prediction_time=m.get("inference_latency_ms", 0),
            ))
    return comparisons

def _get_lgb_metrics() -> dict:
    m = _read_metrics("lightgbm")
    if m:
        return m
    return {}

@router.get("/")
async def get_model_performance() -> ModelPerfResponse:
    metrics = _get_lgb_metrics()
    comparison = _get_all_comparisons()
    return ModelPerfResponse(
        model_used="LightGBM",
        training_time=f"{metrics.get('training_time_sec', 0)}s",
        features_used=64,
        rmse=metrics.get("rmse", 0),
        mae=metrics.get("mae", 0),
        mape=metrics.get("mape", 0),
        r2=metrics.get("r2", 0),
        rmsle=metrics.get("rmsle", 0),
        comparison=comparison,
    )

@router.get("/importance")
async def get_feature_importance(model: str = Query("lightgbm")):
    import csv
    key_map = {"lightgbm": "lightgbm", "xgboost": "xgboost", "randomforest": "randomforest", "rf": "randomforest"}
    key = key_map.get(model, "lightgbm")
    for base in [V2_DIR, MODELS_DIR]:
        path = base / key / f"{key}_feature_importance.csv"
        if path.exists():
            break
    try:
        with open(path, newline="") as f:
            reader = csv.DictReader(f)
            items = [{"feature": r["Feature"], "importance": float(r["Importance"])} for r in reader if r.get("Feature")]
        items.sort(key=lambda x: x["importance"], reverse=True)
        for i, it in enumerate(items):
            it["rank"] = i + 1
        return items
    except Exception as e:
        return {"error": str(e)}
