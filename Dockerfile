# ---- Build frontend ----
FROM node:20-alpine AS frontend-builder

WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- Backend ----
FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc && rm -rf /var/lib/apt/lists/*

# Install Python deps
WORKDIR /install
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

WORKDIR /app/backend
COPY backend/ ./
COPY models/ /app/models/

# Copy built frontend into static/
COPY --from=frontend-builder /build/frontend/dist/ /app/backend/static/

ENV ENV=production
# Default CORS origins - can be overridden at runtime
ENV CORS_ORIGINS=http://localhost:8000,http://localhost:3000,http://127.0.0.1:3000
# Number of Gunicorn workers
ENV WORKERS=4
EXPOSE 8000

# Use gunicorn for production with configurable workers
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "$WORKERS", "--worker-class", "uvicorn.workers.UvicornWorker", "main:app"]
