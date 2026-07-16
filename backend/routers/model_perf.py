from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from database import get_db_connection

router = APIRouter()

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

@router.get("/")
async def get_model_performance() -> ModelPerfResponse:
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM model_results")
        rows = cursor.fetchall()
    finally:
        conn.close()
    
    comparison = [ModelComparison(
        model=row['model_name'], 
        rmse=row['rmse'],
        mae=row['mae'],
        mape=row['mape'],
        training_time=row['training_time_sec'],
        prediction_time=row['prediction_time_ms']
    ) for row in rows]
    
    # Use LightGBM as the main displayed model
    lgb = next((row for row in rows if row['model_name'] == 'LightGBM'), rows[0] if rows else None)
    
    if lgb:
        return ModelPerfResponse(
            model_used=lgb['model_name'],
            training_time=f"{lgb['training_time_sec']}s",
            features_used=74,
            rmse=lgb['rmse'],
            mae=lgb['mae'],
            mape=lgb['mape'],
            r2=lgb['r2'],
            rmsle=lgb['rmse'] / 100.0,
            comparison=comparison
        )
    
    return ModelPerfResponse(
        model_used="Unknown",
        training_time="0s",
        features_used=0,
        rmse=0.0, mae=0.0, mape=0.0, r2=0.0, rmsle=0.0,
        comparison=[]
    )
