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
ENV CORS_ORIGINS=http://localhost:8000
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--log-level", "info"]
