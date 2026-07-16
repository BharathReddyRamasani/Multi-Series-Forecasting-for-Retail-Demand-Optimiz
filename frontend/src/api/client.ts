import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 60_000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Types ─────────────────────────────────────────────────────────────────

export interface ForecastRequest {
  store: number
  item: number
  horizon: number
  model_type?: string
  start_date?: string
}

export interface ForecastPoint {
  date: string
  point: number
  lower_95: number
  upper_95: number
}

export interface ForecastResponse {
  store: number
  item: number
  horizon: number
  start_date: string
  forecasts: ForecastPoint[]
  model_version: string
  model_name: string
}

export interface Metrics {
  rmse: number
  mae: number
  r2: number
  median_ae: number
  mbe: number
  wape: number
  training_time_sec: number
  inference_latency_ms: number
  cv_mean_rmse: number
  cv_mean_mae: number
  cv_mean_mape: number
  cv_mean_smape: number
}

export interface FeatureImportanceItem {
  feature: string
  importance: number
  rank: number
}

export interface ModelMetadata {
  model_name: string
  version: string
  training_date: string
  dataset_version: string
  random_seed: number
  feature_count: number
  cv_performance: {
    mean_rmse: number
    mean_mae: number
    mean_mape: number
    mean_smape: number
  }
}

export interface ModelSummary {
  metadata: ModelMetadata
  metrics: Metrics
  top_features: FeatureImportanceItem[]
  models: { name: string; file: string }[]
}

export interface HealthResponse {
  status: string
  model_loaded: boolean
  version: string
}

export interface StoreItemInfo {
  stores: number[]
  items: number[]
  combinations: number
}

// ── Business & Inventory ──

export interface TopItem {
  item_id: number
  name: string
  revenue: number
  units_sold: number
}

export interface StoreDashboardResponse {
  store_id: number
  projected_revenue_30d: number
  projected_volume_30d: number
  yoy_growth: number
  top_items: TopItem[]
  status: string
}

export interface InventoryItem {
  item_id: number
  name: string
  current_stock: number
  forecast_30d: number
  safety_stock: number
  risk_status: string
  reorder_rec: number
}

export interface InventoryResponse {
  store_id: number
  items: InventoryItem[]
}

// ── Explainability (XAI) ──

export interface ShapValue {
  feature: string
  value: number
}

export interface ExplainResponse {
  prediction: number
  base_value: number
  shap_values: ShapValue[]
  insight_text: string
}

export interface ExplainRequest {
  store: number
  item: number
  forecast_date: string
}


// ── API Calls ─────────────────────────────────────────────────────────────

export const apiClient = {
  health: () =>
    api.get<HealthResponse>('/health').then(r => r.data),

  forecast: (req: ForecastRequest) =>
    api.post<ForecastResponse>('/forecast', req).then(r => r.data),

  metrics: () =>
    api.get<Metrics>('/metrics').then(r => r.data),

  featureImportance: (topN = 20) =>
    api.get<FeatureImportanceItem[]>(`/feature-importance?top_n=${topN}`).then(r => r.data),

  metadata: () =>
    api.get<ModelMetadata>('/metadata').then(r => r.data),

  modelSummary: () =>
    api.get<ModelSummary>('/model-summary').then(r => r.data),

  storesItems: async () => {
    const [{ data: stores }, { data: items }] = await Promise.all([
      api.get<number[]>('/data/stores'),
      api.get<number[]>('/data/items')
    ])
    return { stores, items, combinations: stores.length * items.length } as StoreItemInfo
  },

  uploadCSV: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },

  getStoreDashboard: (store: number) =>
    api.get<StoreDashboardResponse>(`/business/dashboard?store=${store}`).then(r => r.data),

  getStoreInventory: (store: number, horizon: number = 30) =>
    api.get<InventoryResponse>(`/business/inventory?store=${store}&horizon=${horizon}`).then(r => r.data),



  uploadData: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },

  explain: (req: ExplainRequest) =>
    api.post<ExplainResponse>('/explain', req).then(r => r.data),
}

export default api
