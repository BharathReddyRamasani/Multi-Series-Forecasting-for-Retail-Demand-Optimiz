"""
Retail Demand Forecasting Platform — FastAPI Backend
Uses pre-trained LightGBM models for multi-horizon, multi-series forecasting.
Production-ready with authentication, observability, and performance optimizations.
"""
import os
import logging
import sys
import time
import uuid
from datetime import datetime
from typing import Dict, Any
from contextlib import asynccontextmanager
from prometheus_client import Counter, Histogram, Gauge
import structlog
from datetime import datetime, timedelta
from fastapi import FastAPI, Request, Response, HTTPException, Depends, status, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

# Ensure local modules can be imported when running via gunicorn backend.main:app
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import routers and services
try:
    from routers import forecast, analytics, health, business, dashboard, data, history, model_perf, reports, explain, auth
    from services.forecaster import ForecastingService
    from database import init_db
    from auth import (
        authenticate_user,
        create_access_token,
        create_refresh_token,
        get_current_active_user,
        get_current_admin_user,
        get_current_analyst_user,
        get_current_user,
        get_user,
        verify_token,
        SECRET_KEY,
        ALGORITHM,
        User,
        Token
    )
    from jose import JWTError, jwt
    # Import Prometheus client for metrics
    from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
    import psutil
    routers_loaded = True
except Exception as e:
    print(f"FATAL STARTUP ERROR: {e}")
    import traceback
    traceback.print_exc()
    routers_loaded = False
    _startup_e = e
    _startup_traceback = traceback.format_exc()

# Global variables for startup errors
startup_error = None
startup_traceback = None

if not routers_loaded:
    startup_error = str(_startup_e)
    startup_traceback = _startup_traceback

# Prometheus metrics
REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP Requests',
    ['method', 'endpoint', 'status_code']
)
REQUEST_DURATION = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint']
)
ACTIVE_REQUESTS = Gauge(
    'http_active_requests',
    'Number of active HTTP requests'
)
MODEL_LOAD_STATUS = Gauge(
    'model_load_status',
    'Model load status (1=loaded, 0=not loaded)'
)
PREDICTION_COUNT = Counter(
    'prediction_requests_total',
    'Total prediction requests',
    ['model_type', 'status']
)
PREDICTION_LATENCY = Histogram(
    'prediction_duration_seconds',
    'Prediction request duration in seconds',
    ['model_type']
)


# Configure structured logging
def setup_logging():
    """Configure structured logging for production."""
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()

    # Configure structlog
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer() if log_level != "DEBUG" else structlog.dev.ConsoleRenderer()
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=False,
    )

    # Configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, log_level),
    )


# Initialize logger
setup_logging()
logger = structlog.get_logger()


# Security
security = HTTPBearer(auto_error=False)


# Authentication dependency reused by protected routers
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """Get the current authenticated user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        token_data = verify_token(token)
        user = get_user(token_data.username)
        if user is None:
            raise credentials_exception
        return User(**user.dict())
    except Exception:
        raise credentials_exception


# Middleware for request ID and timing
class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        # Increment active requests
        ACTIVE_REQUESTS.inc()

        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time

        # Decrement active requests
        ACTIVE_REQUESTS.dec()

        # Record metrics
        REQUEST_COUNT.labels(
            method=request.method,
            endpoint=request.url.path,
            status_code=response.status_code
        ).inc()

        REQUEST_DURATION.labels(
            method=request.method,
            endpoint=request.url.path
        ).observe(process_time)

        # Add headers
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = str(process_time)

        # Log request
        logger.info(
            "request_completed",
            method=request.method,
            url=str(request.url),
            status_code=response.status_code,
            request_id=request_id,
            process_time=process_time,
        )

        return response


# Rate limiting middleware (simple in-memory implementation)
class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp, calls_per_minute: int = 60):
        super().__init__(app)
        self.calls_per_minute = calls_per_minute
        self.clients = {}

    async def dispatch(self, request: Request, call_next):
        # Simple IP-based rate limiting (for production, use Redis)
        client_ip = request.client.host if request.client else "unknown"
        current_time = time.time()

        # Clean old entries
        self.clients = {
            ip: timestamps for ip, timestamps in self.clients.items()
            if any(t > current_time - 60 for t in timestamps)
        }

        # Check rate limit
        if client_ip in self.clients:
            recent_calls = [t for t in self.clients[client_ip] if t > current_time - 60]
            if len(recent_calls) >= self.calls_per_minute:
                logger.warning(
                    "rate_limit_exceeded",
                    client_ip=client_ip,
                    requests_per_minute=len(recent_calls)
                )
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Rate limit exceeded. Try again later."}
                )

            recent_calls.append(current_time)
            self.clients[client_ip] = recent_calls
        else:
            self.clients[client_ip] = [current_time]

        response = await call_next(request)
        return response


# Lifespan event handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application startup and shutdown events."""
    global startup_error, startup_traceback

    # Handle startup errors
    if not routers_loaded:
        logger.error(
            "failed_to_load_routers",
            error=startup_error,
            traceback=startup_traceback
        )
        yield
        return

    try:
        # Initialize database
        logger.info("initializing_database")
        init_db()
        logger.info("database_initialized")

        # Load ML models
        logger.info("loading_ml_models")
        service = ForecastingService()
        service.load_models()
        app.state.forecaster = service
        logger.info("ml_models_loaded")

        # Log startup completion
        logger.info(
            "application_started",
            environment=os.getenv("ENV", "development"),
            version="1.0.0"
        )

        yield

    except Exception as e:
        logger.error(
            "startup_failed",
            error=str(e),
            exc_info=True
        )
        raise
    finally:
        # Cleanup on shutdown
        logger.info("application_shutting_down")
        # Add any cleanup logic here
        logger.info("application_shutdown_complete")


# Create FastAPI app
app = FastAPI(
    title="Retail Demand Forecasting API",
    description=(
        "Multi-horizon demand forecasting API powered by LightGBM ensemble. "
        "Generates point forecasts and prediction intervals for store-item combinations. "
        "Production-ready with authentication, observability, and performance optimizations."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if os.getenv("ENV", "development") != "production" else None,
    redoc_url="/redoc" if os.getenv("ENV", "development") != "production" else None,
)

# Security middleware
if os.getenv("ENV", "development") == "production":
    # Trust specific hosts in production (add Render and Railway domains by default)
    allowed_hosts = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1,*.onrender.com,*.up.railway.app").split(",")
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts)

# CORS middleware - more secure in production
cors_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,http://localhost:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Custom middleware
app.add_middleware(RequestIDMiddleware)
app.add_middleware(RateLimitMiddleware, calls_per_minute=int(os.getenv("RPM_LIMIT", "120")))

# Gzip compression for responses
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Include routers (only if loaded successfully)
if routers_loaded:
    # Public routers
    app.include_router(health.router, prefix="/api", tags=["Health"])
    app.include_router(auth.router, tags=["Authentication"])

    # Protected routers — require a valid JWT access token.
    _protected = Depends(get_current_active_user)
    app.include_router(forecast.router, prefix="/api", tags=["Forecast"],
                       dependencies=[_protected])
    app.include_router(analytics.router, prefix="/api", tags=["Analytics"],
                       dependencies=[_protected])
    app.include_router(business.router, prefix="/api/business", tags=["Business"],
                       dependencies=[_protected])
    app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"],
                       dependencies=[_protected])
    app.include_router(data.router, prefix="/api/data", tags=["Data"],
                       dependencies=[_protected])
    app.include_router(history.router, prefix="/api/history", tags=["History"],
                       dependencies=[_protected])
    app.include_router(model_perf.router, prefix="/api/model-performance",
                       tags=["Model Performance"], dependencies=[_protected])
    app.include_router(reports.router, prefix="/api/reports", tags=["Reports"],
                       dependencies=[_protected])
    app.include_router(explain.router, prefix="", tags=["Explain"],
                       dependencies=[_protected])
else:
    # Error handling if routers failed to load
    @app.exception_handler(Exception)
    async def startup_exception_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=500,
            content={
                "error": "Application failed to start",
                "message": startup_error or str(exc),
                "traceback": startup_traceback if os.getenv("ENV") == "development" else None,
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        )

    @app.get("/{path:path}")
    async def catch_all(request: Request):
        raise HTTPException(
            status_code=503,
            detail={
                "error": "Service unavailable",
                "message": "Application failed to start properly",
                "hint": "Check server logs for startup errors"
            }
        )


# Models endpoint
@app.get("/models/v2", tags=["Models"])
async def list_models_v2():
    """List available ML models."""
    models = [
        {"id": "lightgbm", "object": "model", "name": "LightGBM Ensemble"},
        {"id": "xgboost", "object": "model", "name": "XGBoost Regressor"},
        {"id": "randomforest", "object": "model", "name": "Random Forest"}
    ]
    return {
        "object": "list",
        "data": models,
        "models": models
    }

# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with basic API information."""
    return {
        "message": "Retail Demand Forecasting API",
        "version": "1.0.0",
        "environment": os.getenv("ENV", "development"),
        "docs": "/docs" if os.getenv("ENV", "development") != "production" else None,
        "health": "/api/health",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for unhandled errors."""
    request_id = getattr(request.state, "request_id", "unknown")

    logger.error(
        "unhandled_exception",
        request_id=request_id,
        method=request.method,
        url=str(request.url),
        error=str(exc),
        exc_info=True
    )

    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "request_id": request_id,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "hint": "Contact administrators if this persists"
        }
    )


# HTTP exception handler for consistent error format
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions with consistent format."""
    request_id = getattr(request.state, "request_id", "unknown")

    logger.warning(
        "http_exception",
        request_id=request_id,
        method=request.method,
        url=str(request.url),
        status_code=exc.status_code,
        detail=exc.detail
    )

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": f"HTTP {exc.status_code}",
            "message": exc.detail,
            "request_id": request_id,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        },
        headers=getattr(exc, "headers", None)
    )


# Metrics endpoint (Prometheus)
@app.get("/metrics", tags=["Monitoring"])
async def metrics():
    """Prometheus metrics endpoint."""
    from prometheus_client import generate_latest, CONTENT_TYPE_LATEST

    # Add custom metrics if needed
    forecaster = getattr(app.state, "forecaster", None)

    # You could add custom gauges here if needed
    # For example:
    # MODEL_LOADED_GAUGE.set(1 if forecaster and forecaster.is_loaded else 0)

    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)


# Health check endpoint (enhanced)
@app.get("/health/detailed", tags=["Health"])
async def detailed_health_check(request: Request):
    """Detailed health check with dependency status."""
    forecaster = getattr(request.app.state, "forecaster", None)

    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "version": "1.0.0",
        "environment": os.getenv("ENV", "development"),
        "checks": {
            "application": "ok",
            "database": "unknown",  # Would check DB connection
            "models": "ok" if forecaster and forecaster.is_loaded else "not_loaded",
            "memory": "ok",  # Would check memory usage
            "disk": "ok",    # Would check disk space
        }
    }

    # Determine overall status
    check_values = list(health_status["checks"].values())
    if any(status == "not_loaded" for status in check_values):
        health_status["status"] = "degraded"
    elif any(status == "error" for status in check_values) or \
         any(status == "unknown" for status in check_values):
        # For unknown states that'll be the rewritten sentence:
        health_status["status"] = "unhealthy"

    status_code = 200 if health_status["status"] == "healthy" else (
        503 if health_status["status"] == "unhealthy" else 200
    )

    return JSONResponse(
        content=health_status,
        status_code=status_code
    )