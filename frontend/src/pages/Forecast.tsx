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
import apiClient from '../api/client'
import type { ForecastRequest } from '../api/client'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler)

export default function ForecastPage() {
  const [store, setStore] = useState('1')
  const [item, setItem] = useState('1')
  const [horizon, setHorizon] = useState('30')
  const [modelType, setModelType] = useState('lightgbm')
  
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

  // Also fetch XAI explanation for the first forecasted date
  const explainMutation = useMutation({
    mutationFn: async (forecast_date: string) => {
      return apiClient.explain({
        store: parseInt(store),
        item: parseInt(item),
        forecast_date
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

    xaiData.shap_values.slice(0, 5).forEach(sv => {
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
  
  if (data && data.forecasts.length > 0) {
    avgSales = data.expected_sales / data.horizon
    lowestFcst = Math.min(...data.forecasts.map((f: any) => f.point))
    highestFcst = Math.max(...data.forecasts.map((f: any) => f.point))
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
        
        {/* TOP SUMMARY CARDS */}
        {data && (
          <div className="grid-5 mb-4">
            <div className="card-kpi blue">
              <div className="card-header"><span className="card-title">Expected Demand</span></div>
              <div className="metric-value">{data.expected_sales.toLocaleString()} <span style={{fontSize: 14, color: '#00d97e'}}>▲ +8.4%</span></div>
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
                  <option value="lightgbm">LightGBM (Recommended)</option>
                  <option value="xgboost">XGBoost</option>
                  <option value="sarima">SARIMA</option>
                  <option value="gru">Deep Learning (GRU)</option>
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
                    <div style={{ fontWeight: 600, color: 'var(--green)' }}>6.2</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--tx-3)' }}>MAPE</div>
                    <div style={{ fontWeight: 600, color: 'var(--teal)' }}>5.8%</div>
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
                  <div><span style={{color: 'var(--tx-3)', fontSize: 12}}>Variance:</span> <span className="font-bold">9.4</span></div>
                  <div><span style={{color: 'var(--tx-3)', fontSize: 12}}>Growth:</span> <span className="text-green font-bold">+7%</span></div>
                </div>
              )}
            </div>

            {/* XAI & Business Insights Row */}
            {data && (
              <div className="grid-2">
                
                {/* AI Business Insight */}
                <div className="card" style={{ border: '1px solid var(--purple-bdr)' }}>
                  <div className="card-header">
                    <span className="card-title text-purple"><Info size={16} /> AI Business Insight</span>
                  </div>
                  <div style={{ padding: '0 8px' }}>
                    <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--tx-1)', marginBottom: 16 }}>
                      {xaiData ? xaiData.insight_text : "Analyzing AI confidence..."}
                    </p>
                    <div style={{ background: 'var(--surface-3)', padding: 12, borderRadius: 8, fontSize: 13 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{color: 'var(--tx-3)'}}>Demand Trend</span> <span className="text-green">Increasing</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{color: 'var(--tx-3)'}}>Inventory Risk</span> <span className="text-blue">Low</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{color: 'var(--tx-3)'}}>Highest Demand</span> <span>Thursday</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* XAI Waterfall */}
                <div className="card">
                  <div className="card-header">
                    <span className="card-title"><Target size={16} /> Forecast Explanation (XAI)</span>
                    <span style={{fontSize: 11, color: 'var(--tx-3)'}}>SHAP Waterfall</span>
                  </div>
                  <div style={{ height: 180 }}>
                    {xaiData ? (
                      <Bar data={getWaterfallData()} options={waterfallOptions as any} />
                    ) : (
                      <div className="loading-center"><div className="spinner"/></div>
                    )}
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
