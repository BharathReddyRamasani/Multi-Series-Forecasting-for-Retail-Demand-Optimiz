# DemandAI — Retail Demand Forecasting Platform

> AI-powered, multi-horizon demand forecasting for retail supply chains using a **LightGBM ensemble** trained on store-item sales data.

---

## 🏗️ Project Structure

```
d:\forecast\
├── models/                          # Pre-trained model files
│   ├── lightgbm_forecaster.joblib   # Point forecast model
│   ├── model_low_q05.joblib         # Lower bound (Q5)
│   ├── model_high_q95.joblib        # Upper bound (Q95)
│   ├── metadata (5).json            # Model training metadata
│   ├── metrics (5).json             # Test-set metrics
│   └── feature_importance (5).csv  # Feature importance scores
│
├── backend/                         # FastAPI Python backend
│   ├── main.py                      # App entry point + CORS + lifespan
│   ├── requirements.txt             # Python dependencies
│   ├── routers/
│   │   ├── forecast.py              # POST /api/forecast (+ batch, upload)
│   │   ├── analytics.py             # GET /api/metrics, /feature-importance
│   │   └── health.py                # GET /api/health
│   ├── services/
│   │   ├── forecaster.py            # LightGBM loading + inference
│   │   └── feature_engine.py        # 74-feature pipeline
│   └── schemas/
│       └── models.py                # Pydantic request/response models
│
├── frontend/                        # React + Vite + TypeScript frontend
│   ├── src/
│   │   ├── App.tsx                  # Router + layout
│   │   ├── main.tsx                 # React entry + QueryClient
│   │   ├── index.css                # Design system (dark theme)
│   │   ├── api/client.ts            # Axios API client + types
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx        # KPI cards + model overview
│   │   │   ├── Forecast.tsx         # Interactive forecast explorer
│   │   │   ├── Analytics.tsx        # Feature importance charts
│   │   │   └── ModelInfo.tsx        # Model details + CSV upload
│   │   └── components/
│   │       └── Sidebar.tsx          # Navigation sidebar
│   ├── package.json
│   ├── vite.config.ts               # Proxy /api → localhost:8000
│   └── tsconfig.json
│
├── start_backend.ps1                # PowerShell: install + start backend
├── start_frontend.ps1               # PowerShell: install + start frontend
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.10+** with pip
- **Node.js 18+** with npm

### Step 1 — Start Backend
Open **Terminal 1** and run:
```powershell
cd d:\forecast
powershell -ExecutionPolicy Bypass -File start_backend.ps1
```
OR manually:
```powershell
cd d:\forecast\backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Backend will be available at: http://localhost:8000  
API docs (Swagger): http://localhost:8000/docs

### Step 2 — Start Frontend
Open **Terminal 2** and run:
```powershell
cd d:\forecast
powershell -ExecutionPolicy Bypass -File start_frontend.ps1
```
OR manually:
```powershell
cd d:\forecast\frontend
npm install
npm run dev
```
Frontend will be available at: http://localhost:5173

---

## 🤖 Model Details

| Property | Value |
|---|---|
| Model Name | LightGBM_Retail_Forecaster |
| Version | 1.0.0 |
| Algorithm | LightGBM (Gradient Boosting) |
| Ensemble | 3 models: point + Q5 + Q95 |
| Features | 74 engineered features |
| Test RMSE | 3.9938 |
| Test MAE | 2.9944 |
| Test R² | 0.9803 (98.03%) |
| WAPE | 5.48% |
| CV MAPE | 6.62% |
| Inference | 0.1254 ms/row |

### Feature Categories
- **Lag features**: 1, 2, 3, 7, 14, 21, 28, 60, 90, 180, 364 days
- **Rolling stats**: mean, std, min, max, median over 7/14/28/60/90 days
- **EMA**: α = 0.5, 0.7, 0.8, 0.9, 0.95
- **Growth rates**: weekly, monthly
- **Calendar**: year, month, day, day_of_week, day_of_year, week, quarter + cyclical
- **Holidays**: is_holiday, days_to/from_holiday, festival_week, long_weekend
- **Store/Item**: avg_sales, popularity, sales_trend

---

## 📡 API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Model status check |
| POST | `/api/forecast` | Generate forecast for store-item pair |
| POST | `/api/forecast/batch` | Batch forecast for multiple pairs |
| GET | `/api/metrics` | Test-set performance metrics |
| GET | `/api/feature-importance` | Feature importance scores |
| GET | `/api/metadata` | Model training metadata |
| GET | `/api/model-summary` | Combined dashboard data |
| GET | `/api/stores-items` | Available stores and items |
| POST | `/api/upload` | Upload custom CSV data |

### Example Forecast Request
```bash
curl -X POST http://localhost:8000/api/forecast \
  -H "Content-Type: application/json" \
  -d '{"store": 1, "item": 1, "horizon": 30}'
```

---

## 🎨 Frontend Pages

1. **Dashboard** — KPI cards (RMSE, MAE, R², WAPE, latency), model ensemble overview, training info
2. **Forecast Explorer** — Store/item selector, horizon pills (7/14/30/60/90 days), interactive Chart.js ribbon with confidence intervals, forecast table, CSV export
3. **Analytics** — Feature importance bar chart, category breakdown, error metrics deep-dive
4. **Model Info** — Architecture details, CV results, feature engineering pipeline, CSV upload

---

## 🔧 Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI + Python 3.10 |
| ML | LightGBM + joblib |
| Feature Engineering | pandas + numpy |
| Frontend | React 18 + Vite + TypeScript |
| Charts | Chart.js + react-chartjs-2 |
| State | TanStack Query v5 |
| Routing | React Router v6 |
| HTTP | Axios |
| Styling | Vanilla CSS (dark theme) |
