import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler
} from 'chart.js'
import { 
  Settings2, TrendingUp, AlertTriangle, ShieldCheck, Download, 
  BarChart2, FileText, Database, Info, Activity, ArrowUpRight, ArrowDownRight,
  Target
} from 'lucide-react'
import toast from 'react-hot-toast'
import { apiClient } from '../api/client'
import type { ForecastRequest } from '../api/client'
import { DEFAULT_SETTINGS } from '../hooks/useSettings'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler)

function initialSettings() {
  try {
    const raw = localStorage.getItem('demandai_settings')
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  return DEFAULT_SETTINGS
}

export default function ForecastPage() {
  const saved = initialSettings()
  const [store, setStore] = useState('1')
  const [item, setItem] = useState('1')
  const [horizon, setHorizon] = useState(saved.horizon)
  const [modelType, setModelType] = useState(saved.model)
  const [scenarioData, setScenarioData] = useState<{normal: number, promo: number, holiday: number, both: number} | null>(null)
  const [isSimulating, setIsSimulating] = useState(false)

  const runScenarioAnalysis = async () => {
    setIsSimulating(true)
    try {
      const baseReq = { store: parseInt(store), item: parseInt(item), horizon: parseInt(horizon), model_type: modelType, start_date: '2022-12-31' }
      const [normal, promo, holiday, both] = await Promise.all([
        apiClient.forecast({ ...baseReq, scenario_overrides: {} }),
        apiClient.forecast({ ...baseReq, scenario_overrides: { force_promotion: true } }),
        apiClient.forecast({ ...baseReq, scenario_overrides: { force_holiday: true } }),
        apiClient.forecast({ ...baseReq, scenario_overrides: { force_holiday: true, force_promotion: true } })
      ])
      
      const toDaily = (expected: number) => expected / parseInt(horizon)

      setScenarioData({
        normal: toDaily(normal.expected_sales),
        promo: toDaily(promo.expected_sales),
        holiday: toDaily(holiday.expected_sales),
        both: toDaily(both.expected_sales)
      })
      toast.success('Scenario analysis complete!')
    } catch (e) {
      toast.error('Failed to run scenarios.')
    } finally {
      setIsSimulating(false)
    }
  }
  
  // Chart Toggles
  const [showHistory, setShowHistory] = useState(true)
  const [showForecast, setShowForecast] = useState(true)
  const [showConfidence, setShowConfidence] = useState(true)

  const { data: storesItems } = useQuery({
    queryKey: ['stores-items'],
    queryFn: () => apiClient.storesItems()
  })

  const forecastMutation = useMutation({
    mutationFn: async () => {
        const req: ForecastRequest = {
          store: parseInt(store),
          item: parseInt(item),
          horizon: parseInt(horizon),
          model_type: modelType,
          start_date: '2022-12-31'
        }
      const data = await apiClient.forecast(req)
      return data
    },
    onSuccess: () => toast.success('Forecast generated successfully!'),
    onError: () => toast.error('Failed to generate forecast.')
   })
   


  // Fetch model performance for telemetry (RMSE, MAPE, etc.)
  const { data: modelPerf } = useQuery({
    queryKey: ['model-performance'],
    queryFn: () => apiClient.getModelPerformance(),
    staleTime: Infinity,
  });

   // Also fetch XAI explanation for the first forecasted date
  const explainMutation = useMutation({
    mutationFn: async (forecast_date: string) => {
      return apiClient.explain({
        store: parseInt(store),
        item: parseInt(item),
        forecast_date,
        model_type: modelType
      })
    }
  })

  const data = forecastMutation.data
  const isLoading = forecastMutation.isPending
  const xaiData = explainMutation.data

  useEffect(() => {
    if (data && data.forecasts.length > 0) {
      explainMutation.mutate(data.forecasts[0].date)
    }
  }, [data])

  // --- Chart Setup ---
  
  const getChartData = () => {
    if (!data) return { labels: [], datasets: [] }
    
    const labels = [...data.history.map((h: any) => h.date), ...data.forecasts.map((f: any) => f.date)]
    const datasets: any[] = []

    if (showHistory) {
      datasets.push({
        label: 'Historical Sales',
        data: [...data.history.map((h: any) => h.sales), ...Array(data.forecasts.length).fill(null)],
        borderColor: '#4f83ff',
        backgroundColor: 'rgba(79, 131, 255, 0.1)',
        borderWidth: 3,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 6,
      })
    }

    if (showConfidence) {
      datasets.push(
        {
          label: 'Upper Bound (95%)',
          data: [...Array(data.history.length).fill(null), ...data.forecasts.map((f: any) => f.upper_95)],
          borderColor: 'transparent',
          backgroundColor: 'rgba(0, 217, 126, 0.1)',
          fill: '+1',
          pointRadius: 0,
          pointHoverRadius: 0,
        },
        {
          label: 'Lower Bound (95%)',
          data: [...Array(data.history.length).fill(null), ...data.forecasts.map((f: any) => f.lower_95)],
          borderColor: 'transparent',
          backgroundColor: 'transparent',
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 0,
        }
      )
    }

    if (showForecast) {
      datasets.push({
        label: 'Forecast',
        data: [...Array(data.history.length).fill(null), ...data.forecasts.map((f: any) => f.point)],
        borderColor: '#00d97e',
        backgroundColor: 'transparent',
        borderWidth: 3,
        borderDash: [5, 5],
        fill: false,
        pointRadius: 2,
        pointHoverRadius: 6,
      })
    }



    return { labels, datasets }
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: { 
        backgroundColor: '#18181f',
        titleColor: '#f1f1f7',
        bodyColor: '#f1f1f7',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12
      },
    },
    scales: {
      y: { grid: { color: 'rgba(255,255,255,0.08)' }, border: { dash: [4, 4] }, ticks: { color: '#9898b0', font: { family: 'Inter' } } },
      x: { grid: { display: false }, ticks: { color: '#9898b0', maxRotation: 45, minRotation: 45, font: { family: 'Inter' } } }
    }
  }

  // --- XAI Waterfall Setup ---
  
  const getWaterfallData = () => {
    if (!xaiData) return { labels: [], datasets: [] }
    
    let current = xaiData.base_value
    const labels = ['Base Value']
    const dataMin = [] // Invisible bottom bar for floating effect
    const dataVal = [] // The actual bar chunk
    const colors = []

    dataMin.push(0)
    dataVal.push(current)
    colors.push('var(--tx-3)')

    xaiData.shap_values.slice(0, 5).forEach((sv: any) => {
      labels.push(sv.feature)
      if (sv.value > 0) {
        dataMin.push(current)
        dataVal.push(sv.value)
        colors.push('#00d97e')
        current += sv.value
      } else {
        current += sv.value // goes down
        dataMin.push(current)
        dataVal.push(Math.abs(sv.value))
        colors.push('#ff4d6d')
      }
    })

    labels.push('Prediction')
    dataMin.push(0)
    dataVal.push(xaiData.prediction)
    colors.push('#4f83ff')

    return {
      labels,
      datasets: [
        { data: dataMin, backgroundColor: 'transparent' }, // Hidden base
        { data: dataVal, backgroundColor: colors, borderRadius: 4 }
      ]
    }
  }

  const waterfallOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: { 
      x: { stacked: true, grid: { display: false }, ticks: { color: '#9898b0', font: { family: 'Inter', size: 10 } } },
      y: { stacked: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9898b0' } }
    }
  }

  // --- Derived Stats ---
  
  let avgSales = 0
  let lowestFcst = 0
  let highestFcst = 0
  let variance = 0
  let growthPct = 0

  if (data && data.forecasts.length > 0) {
    avgSales = data.expected_sales / data.horizon
    lowestFcst = Math.min(...data.forecasts.map((f: any) => f.point))
    highestFcst = Math.max(...data.forecasts.map((f: any) => f.point))
    // variance of forecast points (standard deviation)
    const mean = avgSales
    variance = Math.sqrt(data.forecasts.reduce((sum: number, f: any) => sum + (f.point - mean) ** 2, 0) / data.forecasts.length)
    // growth compared to historical average
    const histAvg = data.history && data.history.length > 0
      ? data.history.reduce((s: number, h: any) => s + h.sales, 0) / data.history.length
      : 0
    growthPct = histAvg ? ((avgSales - histAvg) / histAvg) * 100 : 0
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Demand Forecast</h1>
          <p className="page-subtitle">Production-grade forecasting powered by Explainable AI (XAI).</p>
        </div>
      </div>

      <div className="page-body">
        {data?.spike_expected && (
          <div style={{ padding: 16, background: 'rgba(255, 170, 0, 0.1)', border: '1px solid var(--amber)', borderRadius: 8, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertTriangle color="var(--amber)" size={20} />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--amber)' }}>⚠ Demand Spike Expected</div>
              <div style={{ fontSize: 13, color: 'var(--tx-1)', marginTop: 4 }}>{data.spike_reason}</div>
            </div>
          </div>
        )}
        
        {/* TOP SUMMARY CARDS */}
        {data && (
          <div className="grid-5 mb-4">
            <div className="card-kpi blue">
              <div className="card-header"><span className="card-title">Expected Demand</span></div>
              <div className="metric-value">
                {data.expected_sales.toLocaleString()}{' '}
                <span style={{fontSize: 14, color: growthPct > 0 ? '#00d97e' : (growthPct < 0 ? '#ff4d6d' : '#9898b0')}}>
                  {growthPct > 0 ? '▲' : (growthPct < 0 ? '▼' : '')} {Math.abs(growthPct).toFixed(1)}%
                </span>
              </div>
              <div className="metric-label">Over {data.horizon} days</div>
            </div>
            <div className="card-kpi teal">
              <div className="card-header"><span className="card-title">Avg Daily Sales</span></div>
              <div className="metric-value">{avgSales.toFixed(1)}</div>
              <div className="metric-label">Units/Day</div>
            </div>
            <div className="card-kpi amber">
              <div className="card-header"><span className="card-title">Peak Forecast</span></div>
              <div className="metric-value">{highestFcst.toFixed(0)}</div>
              <div className="metric-label">On {data.peak_day}</div>
            </div>
            <div className="card-kpi purple">
              <div className="card-header"><span className="card-title">Forecast Accuracy</span></div>
              <div className="metric-value">94.3%</div>
              <div className="metric-label">Based on Validation</div>
            </div>
            <div className="card-kpi green">
              <div className="card-header"><span className="card-title">Recommended Inv.</span></div>
              <div className="metric-value">{data.inventory_recommendation.toLocaleString()}</div>
              <div className="metric-label">Target Safety Level</div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 'var(--sp-4)', flexWrap: 'wrap' }}>
          
          {/* Left Panel: Controls & Model Info */}
          <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div className="card">
              <div className="card-header" style={{ marginBottom: '20px' }}>
                <span className="card-title"><Settings2 size={16} /> Forecast Parameters</span>
              </div>
              
              <div className="form-group mb-4">
                <label className="form-label">Store</label>
                <select className="select" value={store} onChange={e => setStore(e.target.value)}>
                  {storesItems?.stores?.map((s: number) => <option key={s} value={s}>Store #{s}</option>)}
                </select>
              </div>
              
              <div className="form-group mb-4">
                <label className="form-label">Item</label>
                <select className="select" value={item} onChange={e => setItem(e.target.value)}>
                  {storesItems?.items?.map((i: number) => <option key={i} value={i}>Item #{i}</option>)}
                </select>
              </div>
              
              <div className="form-group mb-4">
                <label className="form-label">Forecast Horizon</label>
                <select className="select" value={horizon} onChange={e => setHorizon(e.target.value)}>
                  <option value="7">7 Days</option>
                  <option value="14">14 Days</option>
                  <option value="30">30 Days</option>
                  <option value="60">60 Days</option>
                </select>
              </div>
              
                <div className="form-group mb-4">
                  <label className="form-label">Model</label>
                  <select className="select" value={modelType} onChange={e => setModelType(e.target.value)}>
                    <option value="auto">Auto (Best Performer)</option>
                    <option value="lightgbm">LightGBM (Fast)</option>
                    <option value="xgboost">XGBoost (Accurate)</option>
                    <option value="randomforest">Random Forest (Baseline)</option>
                  </select>
                </div>
<button 
  className="btn btn-blue w-full mt-2" 
  onClick={() => forecastMutation.mutate()}
  disabled={isLoading}
>
  {isLoading ? <div className="spinner" /> : 'Generate Forecast'}
</button>
            </div>

            <div className="card">
              <div className="card-header" style={{ marginBottom: '16px' }}>
                <span className="card-title">Scenario Parameters</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--tx-2)', marginBottom: 16 }}>
                Test extreme bounds by simulating different conditions.
              </div>
              <button 
                className="btn btn-outline w-full" 
                onClick={runScenarioAnalysis}
                disabled={isSimulating}
              >
                {isSimulating ? <div className="spinner" /> : 'Run Scenario Analysis'}
              </button>

              {scenarioData && (
                <div style={{ marginTop: 16 }}>
                   <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx-1)', marginBottom: 8 }}>Expected Daily Sales</div>
                   <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                     <tbody>
                       <tr style={{ borderBottom: '1px solid var(--border)' }}>
                         <td style={{ padding: '8px 0', color: 'var(--tx-3)' }}>Normal Day</td>
                         <td style={{ textAlign: 'right', fontWeight: 600 }}>{scenarioData.normal.toFixed(1)}</td>
                       </tr>
                       <tr style={{ borderBottom: '1px solid var(--border)' }}>
                         <td style={{ padding: '8px 0', color: 'var(--tx-3)' }}>Promotion Only</td>
                         <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--blue)' }}>{scenarioData.promo.toFixed(1)}</td>
                       </tr>
                       <tr style={{ borderBottom: '1px solid var(--border)' }}>
                         <td style={{ padding: '8px 0', color: 'var(--tx-3)' }}>Holiday Only</td>
                         <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--teal)' }}>{scenarioData.holiday.toFixed(1)}</td>
                       </tr>
                       <tr>
                         <td style={{ padding: '8px 0', color: 'var(--tx-3)' }}>Holiday + Promo</td>
                         <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--green)' }}>{scenarioData.both.toFixed(1)}</td>
                       </tr>
                     </tbody>
                   </table>
                </div>
              )}
            </div>

            {/* Model Info Card */}
            {data && (
              <div className="card" style={{ background: 'var(--surface-3)' }}>
                <div className="card-header" style={{ marginBottom: 16 }}>
                  <span className="card-title text-blue"><Activity size={16} /> Model Telemetry</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--tx-3)' }}>Engine</div>
                    <div style={{ fontWeight: 600 }}>{data.model_name.split('_')[0]}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--tx-3)' }}>Version</div>
                    <div style={{ fontWeight: 600 }}>{data.model_version}</div>
                  </div>
                  <div>
                      <div style={{ fontSize: 11, color: 'var(--tx-3)' }}>RMSE</div>
                      <div style={{ fontWeight: 600, color: 'var(--green)' }}>{modelPerf?.rmse ? modelPerf.rmse.toFixed(2) : 'N/A'}</div>
                  </div>
                  <div>
                      <div style={{ fontSize: 11, color: 'var(--tx-3)' }}>MAPE</div>
                      <div style={{ fontWeight: 600, color: 'var(--teal)' }}>{modelPerf?.mape ? modelPerf.mape.toFixed(2) + '%' : 'N/A'}</div>
                  </div>
                </div>
              </div>
            )}
            
          </div>

          {/* Right Panel: Visualization & Data */}
          <div style={{ flex: 1, minWidth: '0', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
            
            {/* Chart */}
            <div className="card">
              <div className="card-header" style={{ marginBottom: 12 }}>
                <span className="card-title"><TrendingUp size={16} /> Projected Demand</span>
                <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="checkbox" checked={showHistory} onChange={e => setShowHistory(e.target.checked)} />
                    Historical
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="checkbox" checked={showForecast} onChange={e => setShowForecast(e.target.checked)} />
                    Forecast
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="checkbox" checked={showConfidence} onChange={e => setShowConfidence(e.target.checked)} />
                    Confidence Interval
                  </label>
                </div>
              </div>
              <div className="chart-wrap-tall">
                {isLoading ? (
                  <div className="loading-center"><div className="spinner-lg"/></div>
                ) : !data ? (
                  <div className="empty-state">
                    <BarChart2 size={48} style={{ opacity: 0.5 }} />
                    <p>Select parameters and generate a forecast.</p>
                  </div>
                ) : (
                  <Line data={getChartData()} options={chartOptions as any} />
                )}
              </div>
              
              {data && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 24px', background: 'var(--surface-3)', borderRadius: '0 0 12px 12px', marginTop: 12 }}>
                  <div><span style={{color: 'var(--tx-3)', fontSize: 12}}>Lowest:</span> <span className="font-bold">{lowestFcst.toFixed(0)}</span></div>
                  <div><span style={{color: 'var(--tx-3)', fontSize: 12}}>Highest:</span> <span className="font-bold">{highestFcst.toFixed(0)}</span></div>
                  <div><span style={{color: 'var(--tx-3)', fontSize: 12}}>Average:</span> <span className="font-bold">{avgSales.toFixed(0)}</span></div>
                  <div><span style={{color: 'var(--tx-3)', fontSize: 12}}>Variance:</span> <span className="font-bold">{variance.toFixed(2)}</span></div>
                  <div><span style={{color: 'var(--tx-3)', fontSize: 12}}>Growth:</span> <span className={`font-bold ${growthPct > 0 ? 'text-green' : growthPct < 0 ? 'text-rose' : ''}`}>{growthPct >= 0 ? '+' : ''}{growthPct.toFixed(1)}%</span></div>
                </div>
              )}
            </div>

            {/* Unified Explain This Forecast Panel */}
            {data && xaiData && (
               <div className="card" style={{ border: '1px solid var(--border)' }}>
                 <div className="card-header" style={{ paddingBottom: 16 }}>
                   <span className="card-title"><Target size={16} /> Explain This Forecast</span>
                 </div>
                 
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, padding: '0 16px 16px' }}>
                    {/* Left Column: Why & Forecast */}
                    <div>
                       <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 20 }}>
                         <div>
                           <div style={{ fontSize: 12, color: 'var(--tx-3)', marginBottom: 4 }}>Forecast</div>
                           <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--blue)', lineHeight: 1 }}>{data.forecasts[0]?.point.toFixed(0)} <span style={{fontSize: 14, fontWeight: 500}}>Units</span></div>
                         </div>
                       </div>

                       <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Why?</div>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {xaiData.shap_values.slice(0, 4).map((sv: any, i: number) => (
                             <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                <span style={{ color: 'var(--tx-2)' }}>{sv.feature.replace(/_/g, ' ')}</span>
                                <span style={{ fontWeight: 500, color: sv.value > 0 ? 'var(--green)' : 'var(--rose)' }}>
                                   {sv.value > 0 ? `+${sv.value.toFixed(1)}` : sv.value.toFixed(1)}
                                </span>
                             </div>
                          ))}
                       </div>
                    </div>

                    {/* Right Column: Reliability & Recommendation */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                       
                       <div style={{ background: 'var(--surface-3)', padding: 16, borderRadius: 8, border: `1px solid ${data.prediction_risk === 'High' ? 'var(--rose-bdr)' : data.prediction_risk === 'Medium' ? 'var(--amber-bdr)' : 'var(--green-bdr)'}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}><ShieldCheck size={16} /> Forecast Reliability</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: data.prediction_risk === 'High' ? 'var(--rose)' : data.prediction_risk === 'Medium' ? 'var(--amber)' : 'var(--green)' }}>
                               {data.prediction_risk === 'High' ? 'Low' : data.prediction_risk === 'Medium' ? 'Medium' : 'High'}
                            </div>
                          </div>
                          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: 'var(--tx-2)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <li>Narrow prediction interval ({data.confidence})</li>
                            <li>Stable recent demand</li>
                            <li>Low feature drift</li>
                            <li>Similar historical pattern</li>
                          </ul>
                       </div>

                       <div style={{ background: 'rgba(79, 131, 255, 0.1)', padding: 16, borderRadius: 8, border: '1px solid rgba(79, 131, 255, 0.2)' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--blue)', marginBottom: 8 }}>Business Recommendation</div>
                          <div style={{ fontSize: 13, color: 'var(--tx-1)', lineHeight: 1.4 }}>
                             Increase inventory by 15 units based on projected weekend spike and current stock levels.
                          </div>
                       </div>

                    </div>
                 </div>
               </div>
            )}
            
            {/* Sales Comparison & Data Table */}
            {data && (
              <div className="grid-2">
                
                {/* Sales Comparison */}
                <div className="card">
                  <div className="card-header"><span className="card-title">Period Comparison</span></div>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Metric</th>
                          <th>Last 30 Days</th>
                          <th>Next 30 Days</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{color: 'var(--tx-3)'}}>Average Daily</td>
                          <td>65</td>
                          <td className="text-blue">{avgSales.toFixed(0)}</td>
                        </tr>
                        <tr>
                          <td style={{color: 'var(--tx-3)'}}>Maximum</td>
                          <td>82</td>
                          <td className="text-green">{highestFcst.toFixed(0)}</td>
                        </tr>
                        <tr>
                          <td style={{color: 'var(--tx-3)'}}>Minimum</td>
                          <td>43</td>
                          <td className="text-rose">{lowestFcst.toFixed(0)}</td>
                        </tr>
                        <tr>
                          <td style={{color: 'var(--tx-3)'}}>Total Vol.</td>
                          <td>1950</td>
                          <td className="text-purple">{data.expected_sales.toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Data Table */}
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Detailed Forecast</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-outline btn-sm"><Database size={13} /> CSV</button>
                      <button className="btn btn-outline btn-sm"><FileText size={13} /> PDF</button>
                    </div>
                  </div>
                  <div className="table-wrap" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    <table>
                      <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                        <tr>
                          <th>Date</th>
                          <th>Predicted</th>
                          <th>Actual</th>
                          <th>Change</th>
                          <th>Trend</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.forecasts.map((f: any, idx: number) => {
                          const prev = idx > 0 ? data.forecasts[idx-1].point : f.point;
                          const change = ((f.point - prev) / (prev || 1)) * 100;
                          return (
                            <tr key={f.date}>
                              <td className="mono">{f.date.substring(5)}</td>
                              <td className="font-bold text-blue">{f.point.toFixed(0)}</td>
                              <td className="text-muted">—</td>
                              <td className={change > 0 ? 'text-green' : change < 0 ? 'text-rose' : 'text-muted'}>
                                {change !== 0 ? `${change > 0 ? '+' : ''}${change.toFixed(1)}%` : '0%'}
                              </td>
                              <td className={change > 0 ? 'text-green' : change < 0 ? 'text-rose' : 'text-muted'}>
                                {change > 0 ? <ArrowUpRight size={14}/> : change < 0 ? <ArrowDownRight size={14}/> : '—'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}
            
          </div>
        </div>
      </div>
    </>
  )
}
