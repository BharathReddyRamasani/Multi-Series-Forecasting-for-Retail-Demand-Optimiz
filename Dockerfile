# ========== BUILD STAGE ==========
# Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .

ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY

RUN npm run build

# ========== BACKEND DEPENDENCIES ==========
FROM python:3.11-slim AS backend-deps

WORKDIR /app/backend

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Create and activate virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ========== FINAL STAGE ==========
FROM python:3.11-slim

# Install runtime system dependencies (required by LightGBM)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./backend/static/

# Copy backend dependencies
COPY --from=backend-deps /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy application code
COPY backend/ ./backend/
COPY models/ ./models/

# Create necessary directories
RUN mkdir -p backend/logs && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Environment variables with sensible defaults
ENV ENV=production \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    WORKERS=4 \
    HOST=0.0.0.0 \
    PORT=8000 \
    LOG_LEVEL=info

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# Entry point
CMD gunicorn --bind 0.0.0.0:$PORT --workers $WORKERS --worker-class uvicorn.workers.UvicornWorker --log-level $LOG_LEVEL backend.main:app
