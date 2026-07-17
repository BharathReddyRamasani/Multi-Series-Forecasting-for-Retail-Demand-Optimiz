import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import { Cpu, Activity, Zap, Layers, Server, Target, GitBranch, ArrowRight } from 'lucide-react'
import { Bar, Scatter } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, Title, Tooltip, Legend
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, Title, Tooltip, Legend)

export default function ModelPerformance() {
  const { data, isLoading } = useQuery({
    queryKey: ['modelPerformance'],
    queryFn: apiClient.getModelPerformance
  })

  const { data: fiData } = useQuery({
    queryKey: ['modelFeatureImportance'],
    queryFn: () => apiClient.getModelFeatureImportance('lightgbm')
  })

  if (isLoading) return <div className="loading-center"><div className="spinner-lg" /></div>

  // --- Feature Importance (Bar) ---
  const topFeatures = (fiData || []).slice(0, 10)
  const featureImportanceData = {
    labels: topFeatures.map((f: any) => f.feature),
    datasets: [
      {
        label: 'Relative Importance',
        data: topFeatures.map((f: any) => f.importance),
        backgroundColor: '#4f83ff',
        borderRadius: 4
      }
    ]
  }

  // --- SHAP Summary (Simulated with horizontal grouped bar) ---
  const shapSummaryData = {
    labels: ['lag_7', 'rolling_mean_30', 'day_of_week', 'store_id', 'item_id'],
    datasets: [
      {
        label: 'Negative Impact',
        data: [-0.4, -0.2, -0.6, -0.1, -0.3],
        backgroundColor: '#ff4d6d',
        borderRadius: 4
      },
      {
        label: 'Positive Impact',
        data: [0.8, 0.6, 0.3, 0.4, 0.2],
        backgroundColor: '#00d97e',
        borderRadius: 4
      }
    ]
  }

  // --- SHAP Dependence (Scatter) ---
  const scatterPoints = Array.from({ length: 100 }, () => {
    const lag = Math.random() * 100
    return {
      x: lag,
      y: (lag * 0.5) + (Math.random() * 20 - 10)
    }
  })

  const dependenceData = {
    datasets: [
      {
        label: 'lag_7 effect',
        data: scatterPoints,
        backgroundColor: 'rgba(168, 85, 247, 0.5)',
        borderColor: '#a855f7',
        borderWidth: 1,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  }

  // --- Shared Options ---
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false },
      tooltip: { 
        backgroundColor: '#18181f', titleColor: '#f1f1f7', bodyColor: '#f1f1f7',
        borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, padding: 10
      }
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.08)' }, ticks: { color: '#9898b0', font: { family: 'Inter' } } },
      y: { grid: { display: false }, ticks: { color: '#9898b0', font: { family: 'Inter' } } }
    }
  }

  const hBarOptions = {
    ...commonOptions,
    indexAxis: 'y' as const,
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.08)' }, ticks: { color: '#9898b0', font: { family: 'Inter' } } },
      y: { grid: { display: false }, ticks: { color: '#9898b0', font: { family: 'Inter' } } }
    }
  }
  
  const stackedHBarOptions = {
    ...hBarOptions,
    scales: {
      x: { stacked: true, grid: { color: 'rgba(255,255,255,0.08)' }, ticks: { color: '#9898b0' } },
      y: { stacked: true, grid: { display: false }, ticks: { color: '#9898b0' } }
    }
  }

  // Create Bar chart data for the model comparison
  const comparisonLabels = data?.comparison?.map((c: any) => c.model) || []
  const rmseData = data?.comparison?.map((c: any) => c.rmse) || []
  
  const modelCompChartData = {
    labels: comparisonLabels,
    datasets: [{
      label: 'RMSE (Lower is better)',
      data: rmseData,
      backgroundColor: comparisonLabels.map((l: string) => l === 'LightGBM' ? '#00d97e' : 'rgba(255,255,255,0.1)'),
      borderRadius: 4
    }]
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Model Performance & Comparison</h1>
          <p className="page-subtitle">Evaluate the ML algorithm, compare candidates, and explain global behavior.</p>
        </div>
      </div>

      <div className="page-body">
        
        {/* Model Metrics */}
        <div className="grid-4 mb-4">
          <div className="card-kpi blue">
            <div className="card-header"><span className="card-title"><Cpu size={16}/> Active Model</span></div>
            <div className="metric-value">{data?.model_used}</div>
            <div className="metric-label">Ensemble Regressor</div>
          </div>
          <div className="card-kpi green">
            <div className="card-header"><span className="card-title"><Activity size={16}/> RMSE</span></div>
            <div className="metric-value">{data?.rmse.toFixed(2)}</div>
            <div className="metric-label">Root Mean Square Error</div>
          </div>
          <div className="card-kpi amber">
            <div className="card-header"><span className="card-title"><Zap size={16}/> MAE</span></div>
            <div className="metric-value">{data?.mae.toFixed(2)}</div>
            <div className="metric-label">Mean Absolute Error</div>
          </div>
          <div className="card-kpi purple">
            <div className="card-header"><span className="card-title"><Layers size={16}/> MAPE</span></div>
            <div className="metric-value">{data?.mape.toFixed(2)}%</div>
            <div className="metric-label">Mean Abs Percentage Error</div>
          </div>
        </div>

        {/* Model Comparison Matrix */}
        <div className="grid-2 mb-4">
          <div className="card">
            <div className="card-header">
              <span className="card-title"><Server size={18} /> Model Comparison Matrix</span>
            </div>
            <div className="table-wrap" style={{ flex: 1 }}>
              <table>
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>RMSE</th>
                    <th>MAE</th>
                    <th>MAPE</th>
                    <th>Inference (1k)</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.comparison?.sort((a: any, b: any) => a.rmse - b.rmse).map((c: any, index: number) => (
                    <tr key={c.model} style={c.model === 'LightGBM' ? { background: 'rgba(0, 217, 126, 0.05)' } : {}}>
                      <td style={{ fontWeight: c.model === 'LightGBM' ? 700 : 500, color: c.model === 'LightGBM' ? 'var(--green)' : 'var(--tx-1)' }}>
                          {index === 0 && <span style={{ marginRight: 8, fontSize: 16 }}>🥇</span>}
                          {index === 1 && <span style={{ marginRight: 8, fontSize: 16 }}>🥈</span>}
                          {index === 2 && <span style={{ marginRight: 8, fontSize: 16 }}>🥉</span>}
                          {c.model}
                          {c.model === 'LightGBM' && <span style={{ marginLeft: 8, fontSize: 10, padding: '2px 6px', background: 'var(--green)', color: '#000', borderRadius: 4 }}>PRODUCTION</span>}
                      </td>
                      <td className="mono">{c.rmse.toFixed(2)}</td>
                      <td className="mono">{c.mae.toFixed(2)}</td>
                      <td className="mono">{c.mape.toFixed(2)}%</td>
                      <td className="mono">{c.prediction_time}ms</td>
                    </tr>
                  ))}
                  {!data?.comparison && <tr><td colSpan={5} style={{textAlign: 'center', padding: 20}}>Loading comparison...</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">RMSE Leaderboard</span>
              <span style={{fontSize: 11, color: 'var(--tx-3)'}}>Lower is better</span>
            </div>
            <div className="chart-wrap">
              <Bar data={modelCompChartData} options={hBarOptions as any} />
            </div>
          </div>
        </div>

        {/* Top XAI Row */}
        <div className="grid-2 mb-4">
          <div className="card">
            <div className="card-header">
              <span className="card-title"><Target size={16} /> Global Feature Importance</span>
              <span style={{fontSize: 11, color: 'var(--tx-3)'}}>LightGBM Split Metric</span>
            </div>
            <div className="chart-wrap">
              <Bar data={featureImportanceData} options={hBarOptions as any} />
            </div>
          </div>
          
          <div className="card">
            <div className="card-header">
              <span className="card-title"><GitBranch size={16} /> SHAP Summary Plot</span>
              <span style={{fontSize: 11, color: 'var(--tx-3)'}}>Global Impact Direction</span>
            </div>
            <div className="chart-wrap">
              <Bar data={shapSummaryData} options={stackedHBarOptions as any} />
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
