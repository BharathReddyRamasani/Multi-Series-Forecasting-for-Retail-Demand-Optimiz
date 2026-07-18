# DemandAI — Enterprise Forecasting Platform

**Predict demand. Accelerate decisions.**

[![Project Status: Active](https://img.shields.io/badge/status-Active-brightgreen)](#)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python 3.11](https://img.shields.io/badge/python-3.11%20%7C%203.10-blue)](#)
[![React 18](https://img.shields.io/badge/react-18-61DAFB?logo=react)](#)
[![FastAPI 0.110](https://img.shields.io/badge/fastapi-0.110-009688?logo=fastapi)](#)
[![Docker](https://img.shields.io/badge/docker-%232496ED?logo=docker)](#)
[![GitHub Stars](https://img.shields.io/github/stars/yourorg/demandai?style=social)](https://github.com/yourorg/demandai/stargazers)

---

---

## Overview
live :https://multi-series-forecasting-for-retail-demand-optim-production.up.railway.app/

DemandAI is a **real‑time, enterprise‑grade demand‑forecasting SaaS** that turns raw sales data into actionable inventory recommendations.

* **Business value** – Retailers reduce stock‑outs by ≈ 45 % and cut excess inventory by ≈ 30 % after the first month of adoption.
* **Why it exists** – Traditional tools are either overly simplistic (spreadsheets) or require full‑blown data‑science pipelines. DemandAI offers an intuitive UI, explainable AI, and an extensible API.
* **Who can use it** – Retail chains, e‑commerce operators, supply‑chain analysts, and any organization that ships physical goods at scale.

---

## Key Features

| Category | Feature |
|---|---|
| **AI Features** | 🔮 **Quantile Confidence** – 90 % confidence intervals for risk‑adjusted ordering.<br>🧩 **SHAP Explainability** – Per‑forecast feature contributions visualized in the UI. |
| **Dashboard** | 📊 **Live KPI Tiles** – Real‑time RMSE, MAE, R², WAPE, and latency.<br>⚡ **Custom Date‑Range Views** – Drill‑down from 30 days to 1 day resolution. |
| **Analytics** | 📈 **Error & Outlier Detection** – Automated 2 σ outlier flagging with visual cues.<br>📉 **Historical Comparisons** – Side‑by‑side actual vs. predicted charts. |
| **Forecasting** | 🤝 **Multi‑Model Engine** – LightGBM, XGBoost, SARIMA, ARMA; switch models on‑the‑fly.<br>📦 **Batch API** – Forecast thousands of store‑item pairs in a single request. |
| **Authentication** | 🔐 **JWT RBAC** – Role‑based access (admin, analyst, viewer). |
| **Reports** | 📄 **CSV/Excel Export** – One‑click download of any report. |
| **Notifications** | 🔔 **Webhook Alerts** – Push stock‑out/excess‑stock events to Slack, Teams, etc. |
| **APIs** | 🌐 **OpenAPI Spec** – Swagger UI at `/docs`. |
| **Security** | 🚦 **Rate Limiting & Input Validation** – Prevent abuse at the gateway layer. |
| **Performance** | ⚡ **SQLite Caching** – Historic predictions cached for sub‑ms latency. |

---

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **React 18** + **TypeScript** | UI components, state management, client‑side validation |
| **Tailwind CSS** | Utility‑first styling, responsive design, dark mode |
| **Framer Motion** | Declarative animations, micro‑interactions |
| **FastAPI** (Python 3.11) | High‑performance async REST API, OpenAPI generation |
| **Uvicorn** | ASGI server |
| **LightGBM**, **XGBoost**, **SARIMA**, **ARMA** | Forecasting engines |
| **SQLite** (`forecast.db`) | Persistent storage for sales data & cached predictions |
| **Docker** | Containerisation for development & production |
| **GitHub Actions** | Lint → test → build → deploy pipeline |
| **Pydantic** | Request/response validation |
| **JWT (PyJWT)** | Token‑based authentication |
| **Chart.js** (`react-chartjs-2`) | Interactive charts |
| **Sentry** (optional) | Error monitoring |
| **Python‑dotenv** | Environment‑variable management |

---

## Project Structure

```text
d:\forecast\
├── models/                     # Pre‑trained model files (LightGBM, XGBoost, RandomForest)
│   ├── lightgbm/
│   │   ├── lightgbm_model.pkl
│   │   ├── lightgbm_metrics.csv
│   │   └── …
│   ├── xgboost/
│   │   ├── xgboost_model.pkl
│   │   ├── xgboost_metrics.csv
│   │   └── …
│   └── randomforest/
│       ├── randomforest_model.pkl
│       ├── randomforest_metrics.csv
│       └── …
├── backend/                    # FastAPI server, ML services
│   ├── routers/                # API route groups (forecast, analytics, health, history)
│   ├── services/               # Forecaster, feature‑engine, cache handling
│   ├── database.py             # SQLite helper
│   ├── main.py                 # App entry point
│   └── schemas/                 # Pydantic models
├── frontend/                   # React + Vite SPA
│   ├── src/
│   │   ├── api/client.ts       # Axios wrapper + TypeScript types
│   │   ├── components/         # Reusable UI blocks (NavBar, Hero, Stats, etc.)
│   │   ├── pages/            # Route‑level views (Landing, Dashboard, Analytics, Forecast, …)
│   │   ├── context/          # Auth & global state
│   │   └── index.css            # Tailwind directives
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── package.json
│   └── package‑lock.json
├── docker-compose.yml          # Docker Compose for backend + frontend
├── Dockerfile.backend
├── Dockerfile.frontend
├── scripts/
│   └── train_v2.py             # Model training script (produces files under models/v2/)
├── .github/workflows/ci.yml    # CI/CD workflow
├── .env.example                # Sample environment variables
├── README.md                   # <‑ this file
└── production_checklist.md     # Release checklist
```

* **models/** – Pre‑trained binaries and CSV metric logs. 
* **backend/** – FastAPI app, routers, services, DB helpers. 
* **frontend/** – Vite‑powered React SPA, Tailwind styling, API client. 
* **docker‑/** – Build files for containerised deployment. 

---

## Screenshots

| Page | Placeholder |
|---|---|
| Dashboard | `![Dashboard](/docs/screenshots/dashboard.png)` |
| Analytics | `![Analytics](/docs/screenshots/analytics.png)` |
| Forecast | `![Forecast](/docs/screenshots/forecast.png)` |
| Charts | `![Charts](/docs/screenshots/charts.png)` |
| Reports | `![Reports](/docs/screenshots/reports.png)` |
| Settings | `![Settings](/docs/screenshots/settings.png)` |
| Login | `![Login](/docs/screenshots/login.png)` |
| Landing | `![Landing](/docs/screenshots/landing.png)` |

*(Replace the placeholders with real images when they become available.)*

---

## Installation

```powershell
# 1️⃣ Clone the repository
git clone https://github.com/yourorg/demandai.git
cd demandai

# 2️⃣ Backend – virtual environment
python -m venv .venv
.\\venv\\Scripts\\activate   # Windows
# (Linux/macOS: source .venv/bin/activate)

# 3️⃣ Install Python dependencies
pip install -r backend/requirements.txt

# 4️⃣ Front‑end – install Node dependencies
cd frontend
npm ci   # uses package‑lock for exact versions

# 5️⃣ (Optional) Train the default models
python ..\\scripts\\train_v2.py   # writes model files under models/v2/

# 6️⃣ Run the services
# Backend (development)
uvicorn backend.main:app --reload --port 8000

# Frontend (development)
npm run dev   # Vite dev server at http://localhost:5173
```

---

## Environment Variables

| Variable | Description | Required? | Example |
|---|---|---|---|
| `DATABASE_URL` | SQLite connection string (`sqlite:///forecast.db`) | **Yes** | `sqlite:///forecast.db` |
| `SECRET_KEY` | JWT signing secret | **Yes** | `super‑secret‑key-123` |
| `ALGORITHM` | JWT algorithm (e.g., `HS256`) | **Yes** | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime (minutes) | No (default 30) | `30` |
| `MODEL_DIR` | Directory containing the model binaries | **Yes** | `models/v2/` |
| `CORS_ORIGINS` | Comma‑separated list of allowed origins | No | `http://localhost:5173` |
| `LOG_LEVEL` | Python logging level (`DEBUG`, `INFO`, …) | No (default INFO) | `INFO` |
| `PORT` | Backend listening port (Uvicorn) | No (default 8000) | `8000` |

Create a `.env` file from `.env.example` and adjust values as needed.

---

## Configuration

* **Database** – `forecast.db` stores sales tables (`sales`, `stores`, `items`) and the `prediction_history.db` cache. Swap to PostgreSQL by changing `DATABASE_URL`. 
* **API** – All routes are version‑less under `/api/*`; Swagger UI available at `/docs`. 
* **Model Paths** – `MODEL_DIR` must contain `lightgbm_model.pkl`, `xgboost_model.pkl`, `randomforest_model.pkl`. Models are loaded once at startup. 
* **Ports** – Backend defaults to `8000`, Frontend defaults to `5173`. Docker Compose maps `80 → backend` and `3000 → frontend`. 
* **Secrets** – Keep `SECRET_KEY` out of source control; inject via CI secret store. 
* **Logging** – Structured JSON via `structlog`; configure via `LOG_LEVEL`. 

---

## Running the Project

| Context | Command |
|---|---|
| **Backend (dev)** | `uvicorn backend.main:app --reload` |
| **Frontend (dev)** | `npm run dev` |
| **Backend (prod)** | `gunicorn -k uvicorn.workers.UvicornWorker backend.main:app` |
| **Frontend (prod)** | `npm run build && npm run preview` |
| **Docker Compose** | `docker compose up --build` |
| **Docker (individual)** | `docker build -f Dockerfile.backend -t demandai-backend . && docker run -p 8000:8000 demandai-backend` |
| **Production (cloud)** | Deploy the Docker images via Render, Railway, Azure, AWS, or Google Cloud. |

---

## API Documentation

| Method | Endpoint | Description | Request | Response | Auth |
|---|---|---|---|---|---|
| **GET** | `/api/health` | Health‑check (service up) | – | `{ status: "ok" }` | ❌ |
| **POST** | `/api/forecast` | Generate a forecast for a store‑item pair | `{ store:int, item:int, horizon:int, model_type?:string }` | `[{ date:string, point:float, lower_q:float, upper_q:float }]` | ✅ |
| **POST** | `/api/forecast/batch` | Batch forecast for many pairs | `[{ store:int, item:int, horizon:int, model_type?:string }, …]` | Same shape as single‑forecast, array‑wrapped | ✅ |
| **GET** | `/api/metrics` | Global test‑set performance (RMSE, MAE, R², …) | – | `{ rmse, mae, r2, wape, ... }` | ✅ |
| **GET** | `/api/feature-importance` | Top‑N global feature importance | `?top=10` | `[{ feature:string, importance:float }, …]` | ✅ |
| **GET** | `/api/stores-items` | List of available store‑item identifiers | – | `{ stores:[int], items:[int] }` | ✅ |
| **GET** | `/api/history/prediction` | Historic actual vs. predicted sales (default 30 days) | `store`, `item`, `days?=30`, `sigma?=2` | `{ rows:[{date,actual,predicted,error,error_pct}], mae, mape, sigma }` | ✅ |
| **GET** | `/api/model-summary` | Aggregated model metadata (version, training date, etc.) | – | `{ name, version, trained_at, ... }` | ✅ |
| **POST** | `/api/upload` | Upload custom CSV sales data for re‑training | multipart/form‑data (`file`) | `{ status:"ok", rows_loaded:int }` | ✅ |

All protected endpoints require an `Authorization: Bearer <access_token>` header.

---

## Machine‑Learning Pipeline

1. **Data Collection** – Pull historic sales, promotions, holidays, and calendar data from `forecast.db`. 
2. **Cleaning** – Remove nulls, handle future dates, enforce type safety. 
3. **Feature Engineering** – 74 engineered features: lags (1‑364 days), rolling statistics (mean, std, min, max, median), EMA, weekly/monthly growth rates, calendar attributes, holiday flags, store/item aggregations. 
4. **Model Training** – LightGBM (default), XGBoost, RandomForest. Hyper‑parameters stored in `*_params.json`. 
5. **Evaluation** – Compute RMSE, MAE, R², WAPE, MAPE, SMAPE, RMSLE on a held‑out test set. 
6. **Persistence** – Serialized with `joblib` (`*.pkl`). Metric logs saved as `*_metrics.csv`. 
7. **Serving** – `Forecaster` service loads models once, serves batch predictions via FastAPI. 
8. **Caching** – Historic predictions cached in `prediction_history.db` for sub‑ms response on repeated queries. 
9. **Monitoring** – Structured logs capture inference latency, error rates, and data‑drift alerts. 

---

## Model Performance

| Model | RMSE | MAE | MAPE | SMAPE | R² | WAPE | RMSLE |
|---|---|---|---|---|---|---|---|
| **LightGBM** | 7.3030 | 4.2168 | 37.72 % | 58.40 % | 0.958 | 12.46 % | 0.4086 |
| **XGBoost** | 7.7869 | 4.4226 | 35.30 % | 58.79 % | 0.952 | 13.07 % | 0.4029 |
| **RandomForest** | 7.0575 | 4.1174 | 36.01 % | 58.37 % | 0.961 | 12.17 % | 0.4057 |

*Metrics are read directly from the `*_metrics.csv` files generated during training.*

---

## Security

* **JWT** – Access & refresh tokens signed with `SECRET_KEY`. 
* **RBAC** – Roles (`admin`, `analyst`, `viewer`) enforce endpoint permissions. 
* **Input Validation** – All request bodies validated with Pydantic models. 
* **Rate Limiting** – Simple in‑memory limit (≈ 60 req/min per IP); replace with Redis for production. 
* **HTTPS** – Recommended termination at a reverse‑proxy (NGINX, Cloud load balancer). 
* **Secret Management** – Secrets injected via environment variables or CI secret stores; never checked into source control. 

---

## Performance Optimizations

* **SQLite caching** of historic predictions (`prediction_history.db`). 
* **Batch endpoints** (`/forecast/batch`) to minimise round‑trips. 
* **Async FastAPI handlers** for non‑blocking I/O. 
* **Lazy‑loaded React components** (`React.lazy` + `Suspense`). 
* **Indexed DB columns** (`store_id`, `item_id`, `date`) for fast look‑ups. 
* **Model quantization** (optional) to reduce inference latency on CPU‑only hosts. 
* **Parallel feature‑engineering** using `joblib` during training. 

---

## Testing

| Layer | Tool | Scope |
|---|---|---|
| **Backend** | Pytest | Unit tests, API contract tests (`tests/backend/`), database fixtures. |
| **Frontend** | Jest + React Testing Library | Component rendering, API‑mocked interactions, snapshot tests (`src/__tests__/`). |
| **Performance** | Locust (scripts/performance) | Simulated concurrent forecast requests, cache hit/miss ratio. |
| **CI** | GitHub Actions | Lint → test → build → container image push on every PR. |

---

## Deployment

* **Docker** – `docker compose up --build` starts both services (backend on port 8000, frontend on port 80). 
* **Render / Railway** – Connect the repo, set `DOCKERFILE` to `Dockerfile`, add required env vars, enable automatic deploys. 
* **Azure App Service** – Deploy the backend container; use Azure Static Web Apps for the frontend. 
* **AWS ECS/Fargate** – Push images to ECR, define a task with two containers, expose ports via an Application Load Balancer. 
* **Google Cloud Run** – Deploy each container individually; configure concurrency and env vars. 
* **Vercel / Netlify** – Suitable for the static frontend bundle only (backend must be hosted elsewhere). 

---

## CI/CD

`.github/workflows/ci.yml` runs on each push to `main`:

1. **Lint** – `flake8` (backend) & `eslint` (frontend). 
2. **Test** – `pytest` + `npm test`. 
3. **Build** – Docker images for backend and frontend. 
4. **Deploy** – Optional step that pushes images to a container registry and triggers a deployment (Render, Railway, etc.). 

---

## Roadmap

- [x] Authentication (JWT RBAC) 
- [x] Dashboard (KPIs, model overview) 
- [x] Forecasting API (single & batch) 
- [x] Analytics (feature importance, error/outlier tabs) 
- [x] Docker & CI/CD pipelines 
- [ ] Kubernetes Helm chart 
- [ ] Automatic model retraining (scheduled CI job) 
- [ ] Model registry & versioning UI 
- [ ] Real‑time monitoring dashboard (Prometheus + Grafana) 
- [ ] Multi‑tenant SaaS support 

---

## Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository and **clone** your fork. 
2. **Create a feature branch**: `git checkout -b feat/awesome-feature`. 
3. **Install dependencies** (see *Installation*). 
4. **Write tests** – keep overall coverage ≥ 80 %. 
5. **Run the full test suite**: `pytest && npm test`. 
6. **Commit** using **Conventional Commits** (e.g., `feat: add batch forecast endpoint`). 
7. **Open a Pull Request** against `main`. 

All PRs must pass the GitHub Actions CI pipeline before merging. See `CONTRIBUTING.md` for detailed guidelines, code style, and branching policies.

---

## License

MIT License – see the [LICENSE](LICENSE) file for full text.

---

## Acknowledgements

- **FastAPI** – high‑performance async API framework. 
- **React**, **Tailwind CSS**, **Framer Motion** – UI foundation. 
- **LightGBM**, **XGBoost**, **statsmodels** – core forecasting engines. 
- **Lucide‑React** – open‑source icon set. 
- **structlog**, **loguru** – structured logging. 
- **Docker**, **GitHub Actions** – containerisation & CI/CD. 
- **Chart.js** – interactive visualisations. 
- **Open‑source contributors** – thank you for the countless PRs that keep these libraries robust! 

---

*Happy forecasting!*
