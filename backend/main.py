"""
Retail Demand Forecasting Platform — FastAPI Backend
Uses pre-trained LightGBM models for multi-horizon, multi-series forecasting.
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from routers import forecast, analytics, health, business, dashboard, data, history, model_perf, reports, explain
from services.forecaster import ForecastingService


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load models on startup."""
    print("🚀 Initializing Database...")
    from database import init_db
    init_db()
    print("✅ Database ready!")
    
    print("🚀 Loading LightGBM forecasting models...")
    service = ForecastingService()
    service.load_models()
    app.state.forecaster = service
    print("✅ Models loaded successfully!")
    yield
    print("🛑 Shutting down...")


app = FastAPI(
    title="Retail Demand Forecasting API",
    description=(
        "Multi-horizon demand forecasting API powered by LightGBM ensemble. "
        "Generates point forecasts and 90% prediction intervals for store-item combinations."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(forecast.router, prefix="/api", tags=["Forecast"])
app.include_router(analytics.router, prefix="/api", tags=["Analytics"])
app.include_router(business.router, prefix="/api/business", tags=["Business"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(data.router, prefix="/api/data", tags=["Data"])
app.include_router(history.router, prefix="/api/history", tags=["History"])
app.include_router(model_perf.router, prefix="/api/model-performance", tags=["Model Performance"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(explain.router)


@app.get("/")
async def root():
    return {
        "message": "Retail Demand Forecasting API",
        "version": "1.0.0",
        "docs": "/docs",
    }
