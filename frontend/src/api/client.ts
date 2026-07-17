import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 60_000,
  headers: { 'Content-Type': 'application/json' },
})

let getTokenFn: () => Promise<string | null> = async () => null;

export const setGetTokenFn = (fn: () => Promise<string | null>) => {
  getTokenFn = fn;
}

// Attach the JWT bearer token (if present) to every request.
api.interceptors.request.use(async (config) => {
  const token = await getTokenFn()
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// On 401, we don't clear localStorage anymore because Clerk manages the session
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error)
  },
)

// ── Types ─────────────────────────────────────────────────────────────────

export interface ForecastRequest {
  store: number
  item: number
  horizon: number
  model_type?: string
  start_date?: string
  scenario_overrides?: Record<string, any>
}

export interface ForecastPoint {
  date: string
  point: number
  lower_95: number
  upper_95: number
}

export interface HistoricalPoint {
  date: string
  sales: number
}

export interface ForecastResponse {
  store: number
  item: number
  horizon: number
  start_date: string
  forecasts: ForecastPoint[]
  history: HistoricalPoint[]
  model_version: string
  model_name: string
  expected_sales: number
  peak_day: string
  safety_stock: number
  inventory_recommendation: number
  demand_trend: string
  confidence: string
  spike_expected: boolean
  spike_reason: string
  prediction_risk: string
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

export interface DataQuality {
  missing_values_pct: number
  duplicate_rows: number
  outliers: number
  data_drift: boolean
  freshness: string
}

export interface FeatureDrift {
  feature: string
  training_value: number
  current_value: number
  drift_pct: number
  has_drifted: boolean
}

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
  model_type?: string
}


export interface MonthlySales {
  month: string
  sales: number
}

export interface WeeklyPattern {
  day_of_week: string
  avg_sales: number
}

export interface SalesResponse {
  monthly: MonthlySales[]
  weekly: WeeklyPattern[]
}

export interface InsightsResponse {
  store_id: number
  insights: string[]
  recommendation: string
}

export interface AccuracyHistoryResponse {
  store: number
  item?: number
  history: { month: string; rmse: number }[]
  trend: string
}

// ── API Calls ─────────────────────────────────────────────────────────────

export const apiClient = {
  health: () =>
    api.get<HealthResponse>('/health').then(r => r.data),

  // ── Reports ──
  downloadReport: async (type: 'csv' | 'json' = 'csv') => {
    const token = localStorage.getItem('demandai_token')
    const res = await fetch(`/api/reports/generate?type=${type}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) {
      throw new Error(`Report generation failed (${res.status})`)
    }
    const blob = await res.blob()
    const cd = res.headers.get('content-disposition') || ''
    const match = cd.match(/filename=([^;]+)/)
    const filename = match ? match[1].replace(/['"]/g, '') : `forecast_report.${type}`
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  },


  forecast: (req: ForecastRequest) =>
    api.post<ForecastResponse>('/forecast', req).then(r => r.data),
    
  simulate: (req: ForecastRequest) =>
    api.post<ForecastResponse>('/simulate', req).then(r => r.data),

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

  storeSales: (storeId: number) =>
    api.get<SalesResponse>(`/data/sales/store/${storeId}`).then(r => r.data),

  itemSales: (itemId: number) =>
    api.get<SalesResponse>(`/data/sales/item/${itemId}`).then(r => r.data),
    
  getDatasetInfo: () =>
    api.get('/data/dataset-info').then(r => r.data),
    
  getQuality: () =>
    api.get<DataQuality>('/data/quality').then(r => r.data),
    
  getDrift: () =>
    api.get<FeatureDrift[]>('/data/drift').then(r => r.data),
    
  getRawData: (page: number, size: number, store?: number, item?: number) => {
    let url = `/data/raw?page=${page}&size=${size}`
    if (store) url += `&store=${store}`
    if (item) url += `&item=${item}`
    return api.get(url).then(r => r.data)
  },

  getModelPerformance: () =>
    api.get('/model-performance/').then(r => r.data),

  getModelFeatureImportance: (model = 'lightgbm') =>
    api.get<FeatureImportanceItem[]>(`/model-performance/importance?model=${model}`).then(r => r.data),

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
    
  getStoreInsights: (store: number) =>
    api.get<InsightsResponse>(`/business/insights?store=${store}`).then(r => r.data),
    
  getAccuracyHistory: (store: number, item?: number) => {
    let url = `/history/accuracy-history?store=${store}`
    if (item) url += `&item=${item}`
    return api.get<AccuracyHistoryResponse>(url).then(r => r.data)
  },

  uploadData: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },

  explain: (req: ExplainRequest) =>
    api.post<ExplainResponse>('/explain/', req).then(r => r.data),
}

export default api
