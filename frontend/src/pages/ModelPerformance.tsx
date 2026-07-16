import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Cpu, Activity, Zap, Layers, Server, Target, GitBranch, ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Bar, Scatter } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, Title, Tooltip, Legend
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, Title, Tooltip, Legend)

export default function ModelPerformance() {
  const { data, isLoading } = useQuery({
    queryKey: ['modelPerformance'],
    queryFn: async () => {
      const { data } = await axios.get('http://localhost:8000/api/model-performance')
      return data
    }
  })

  if (isLoading) return <div className="loading-center"><div className="spinner-lg" /></div>

  // --- Feature Importance (Bar) ---
  const featureImportanceData = {
    labels: ['lag_7', 'rolling_mean_30', 'day_of_week', 'store_id', 'item_id', 'month', 'is_weekend'],
    datasets: [
      {
        label: 'Relative Importance',
        data: [100, 75, 45, 30, 25, 15, 10],
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
  // Simulate high lag_7 -> higher prediction
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

  // --- Waterfall Plot (Global / Average) ---
  const waterfallData = {
    labels: ['Base', 'lag_7', 'rolling_mean_30', 'day_of_week', 'month', 'Prediction'],
    datasets: [
      { 
        data: [0, 45, 57, 50, 48, 0], 
        backgroundColor: 'transparent' // Hidden bars
      },
      { 
        data: [45, 12, -7, -2, 6, 54], 
        backgroundColor: ['var(--tx-3)', '#00d97e', '#ff4d6d', '#ff4d6d', '#00d97e', '#4f83ff'],
        borderRadius: 4
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

  const waterfallOptions = {
    ...commonOptions,
    scales: {
      x: { stacked: true, grid: { display: false }, ticks: { color: '#9898b0' } },
      y: { stacked: true, grid: { color: 'rgba(255,255,255,0.08)' }, ticks: { color: '#9898b0' } }
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Model Performance & XAI</h1>
          <p className="page-subtitle">Evaluate the ML algorithm and explain its global behavior using SHAP values.</p>
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

        {/* Top XAI Row */}
        <div className="grid-2 mb-4">
          <div className="card">
            <div className="card-header">
              <span className="card-title"><Target size={16} /> Feature Importance</span>
              <span style={{fontSize: 11, color: 'var(--tx-3)'}}>Tree Split Metric</span>
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

        {/* Bottom XAI Row */}
        <div className="grid-2 mb-4">
          <div className="card">
            <div className="card-header">
              <span className="card-title">SHAP Dependence Plot (lag_7)</span>
            </div>
            <div className="chart-wrap">
              <Scatter data={dependenceData} options={commonOptions as any} />
            </div>
          </div>
          
          <div className="card">
            <div className="card-header">
              <span className="card-title">Global Waterfall Explanation</span>
            </div>
            <div className="chart-wrap">
              <Bar data={waterfallData} options={waterfallOptions as any} />
            </div>
          </div>
        </div>
        
        {/* Telemetry */}
        <div className="card">
          <div className="card-header"><span className="card-title"><Server size={18} /> Training & Prediction Telemetry</span></div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Training Time</th>
                  <th>Prediction Time (per 1k)</th>
                  <th>MAPE</th>
                </tr>
              </thead>
              <tbody>
                {data?.comparison?.map((c: any) => (
                  <tr key={c.model}>
                    <td style={{ fontWeight: c.model === 'LightGBM' ? 700 : 500, color: c.model === 'LightGBM' ? 'var(--blue-hi)' : 'var(--tx-1)' }}>
                        {c.model} {c.model === 'LightGBM' && '(Production)'}
                    </td>
                    <td className="mono">{c.training_time}s</td>
                    <td className="mono">{c.prediction_time}ms</td>
                    <td className="mono">{c.mape}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  )
}
