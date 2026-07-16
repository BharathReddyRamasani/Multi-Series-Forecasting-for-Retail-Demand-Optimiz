"""
Pydantic schemas for request/response validation.
"""
import re
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import date


class ForecastRequest(BaseModel):
    store: int = Field(..., ge=1, le=10, description="Store ID (1-10)")
    item: int = Field(..., ge=1, le=50, description="Item ID (1-50)")
    horizon: int = Field(30, ge=7, le=90, description="Forecast horizon in days")
    model_type: str = Field("lightgbm", description="Type of model to use")
    start_date: Optional[str] = Field(
        None,
        description="Forecast start date (YYYY-MM-DD). Defaults to today.",
    )
    scenario_overrides: Optional[dict] = Field(
        None,
        description="Overrides for What-If Analysis (e.g., {'price_multiplier': 1.1, 'force_holiday': True})"
    )

    @field_validator("start_date")
    @classmethod
    def validate_start_date(cls, v):
        if v is not None:
            if not re.match(r"^\d{4}-\d{2}-\d{2}$", v):
                raise ValueError("start_date must be in YYYY-MM-DD format")
        return v

    model_config = {"json_schema_extra": {"example": {"store": 1, "item": 1, "horizon": 30}}}


class ForecastPoint(BaseModel):
    date: str
    point: float
    lower_95: float
    upper_95: float

class HistoricalPoint(BaseModel):
    date: str
    sales: float


class ForecastResponse(BaseModel):
    store: int
    item: int
    horizon: int
    start_date: str
    forecasts: List[ForecastPoint]
    history: List[HistoricalPoint]
    model_version: str = "1.0.0"
    model_name: str = "LightGBM_Retail_Forecaster"
    
    expected_sales: float = 0
    peak_day: str = ""
    safety_stock: float = 0
    inventory_recommendation: float = 0
    demand_trend: str = "Stable"
    confidence: str = "90%"
    spike_expected: bool = False
    spike_reason: str = ""
    prediction_risk: str = "Low"

    model_config = {"protected_namespaces": ()}


class MetricsResponse(BaseModel):
    rmse: float
    mae: float
    r2: float
    median_ae: float
    mbe: float
    wape: float
    training_time_sec: float
    inference_latency_ms: float
    cv_mean_rmse: float
    cv_mean_mae: float
    cv_mean_mape: float
    cv_mean_smape: float


class FeatureImportanceItem(BaseModel):
    feature: str
    importance: int
    rank: int


class ModelMetadata(BaseModel):
    model_name: str
    version: str
    training_date: str
    dataset_version: str
    random_seed: int
    feature_count: int
    cv_performance: dict

    model_config = {"protected_namespaces": ()}


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    version: str

    model_config = {"protected_namespaces": ()}


class UploadResponse(BaseModel):
    message: str
    rows_received: int
    stores: List[int]
    items: List[int]
    date_range: dict


class StoreItemInfo(BaseModel):
    stores: List[int]
    items: List[int]
    combinations: int

# ── Business & Store Analytics ──

class TopItem(BaseModel):
    item_id: int
    name: str
    revenue: float
    units_sold: int

class StoreDashboardResponse(BaseModel):
    store_id: int
    projected_revenue_30d: float
    projected_volume_30d: int
    yoy_growth: float
    top_items: List[TopItem]
    status: str

# ── Decision / Inventory Analytics ──

class InventoryItem(BaseModel):
    item_id: int
    name: str
    current_stock: int
    forecast_30d: float
    safety_stock: int
    risk_status: str  # "Stockout Risk", "Healthy", "Overstock"
    reorder_rec: int

class InventoryResponse(BaseModel):
    store_id: int
    items: List[InventoryItem]

# ── Explainability (XAI) ──

class ShapValue(BaseModel):
    feature: str
    value: float

class ExplainResponse(BaseModel):
    prediction: float
    base_value: float
    shap_values: List[ShapValue]
    insight_text: str = ""
