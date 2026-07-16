import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart2, TrendingUp, Store, Package, Calendar, Target } from 'lucide-react'
import { Bar, Line, Radar } from 'react-chartjs-2'
import apiClient from '../api/client'

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart2 size={16} /> },
    { id: 'store', label: 'Store Analysis', icon: <Store size={16} /> },
    { id: 'item', label: 'Item Analysis', icon: <Package size={16} /> },
    { id: 'seasonality', label: 'Seasonality', icon: <Calendar size={16} /> },
    { id: 'xai', label: 'Explainability (XAI)', icon: <Target size={16} /> },
  ]

  const { data: featureImportance } = useQuery({
    queryKey: ['global-feature-importance'],
    queryFn: () => apiClient.featureImportance(10)
  })

  const chartOptions = { 
    responsive: true, 
    maintainAspectRatio: false, 
    plugins: { 
      legend: { display: false },
      tooltip: { 
        backgroundColor: '#18181f',
        titleColor: '#f1f1f7',
        bodyColor: '#f1f1f7',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 10
      }
    }, 
    scales: { 
      y: { 
        grid: { color: 'rgba(255,255,255,0.08)' },
        ticks: { color: '#9898b0', font: { family: 'Inter' } }
      }, 
      x: { 
        grid: { display: false },
        ticks: { color: '#9898b0', font: { family: 'Inter' } }
      } 
    } 
  }

  const xaiChartOptions = {
    ...chartOptions,
    indexAxis: 'y' as const,
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.08)' }, ticks: { color: '#9898b0', font: { family: 'Inter' } } },
      y: { grid: { display: false }, ticks: { color: '#9898b0', font: { family: 'Inter' } } }
    }
  }

  const xaiData = {
    labels: featureImportance ? featureImportance.map(f => f.feature) : [],
    datasets: [{
      label: 'Global Importance',
      data: featureImportance ? featureImportance.map(f => f.importance) : [],
      backgroundColor: '#a855f7',
      borderRadius: 4
    }]
  }

  const barData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [{ label: 'Sales', data: [120, 190, 300, 500, 420, 600, 700, 650, 550, 480, 510, 800], backgroundColor: '#4f83ff', borderRadius: 4 }]
  }

  const lineData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{ label: 'Avg Sales', data: [40, 35, 45, 50, 80, 110, 95], borderColor: '#a855f7', backgroundColor: 'rgba(168, 85, 247, 0.25)', fill: true, tension: 0.4, borderWidth: 3 }]
  }
  
  const radarData = {
    labels: ['Winter', 'Spring', 'Summer', 'Autumn'],
    datasets: [{ label: 'Seasonal Demand', data: [65, 85, 100, 75], borderColor: '#00d97e', backgroundColor: 'rgba(0, 217, 126, 0.25)', borderWidth: 3 }]
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Advanced Analytics</h1>
          <p className="page-subtitle">Deep dive into historical sales patterns, trends, and model explainability.</p>
        </div>
      </div>

      <div className="page-body">
        
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '24px', overflowX: 'auto' }}>
          {tabs.map(t => (
            <button
              key={t.id}
              className={`btn ${activeTab === t.id ? 'btn-blue' : 'btn-ghost'}`}
              onClick={() => setActiveTab(t.id)}
              style={{ whiteSpace: 'nowrap' }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid-2">
             <div className="card">
                 <div className="card-header"><span className="card-title">Monthly Sales (YTD)</span></div>
                 <div className="chart-wrap"><Bar data={barData} options={chartOptions as any} /></div>
             </div>
             <div className="card">
                 <div className="card-header"><span className="card-title">Weekly Pattern</span></div>
                 <div className="chart-wrap"><Line data={lineData} options={chartOptions as any} /></div>
             </div>
          </div>
        )}

        {activeTab === 'store' && (
          <div className="card">
             <div className="card-header">
                <span className="card-title">Store Performance</span>
                <select className="select" style={{width: 200}}>
                    {Array.from({length: 10}).map((_, i) => <option key={i}>Store #{i+1}</option>)}
                </select>
             </div>
             <div className="chart-wrap-tall"><Line data={barData} options={chartOptions as any} /></div>
          </div>
        )}

        {activeTab === 'item' && (
          <div className="card">
             <div className="card-header">
                <span className="card-title">Item Demand Trends</span>
                <select className="select" style={{width: 200}}>
                    {Array.from({length: 50}).map((_, i) => <option key={i}>Item #{i+1}</option>)}
                </select>
             </div>
             <div className="chart-wrap-tall"><Bar data={barData} options={chartOptions as any} /></div>
          </div>
        )}

        {activeTab === 'seasonality' && (
          <div className="grid-2">
              <div className="card">
                 <div className="card-header"><span className="card-title">Seasonal Distribution</span></div>
                 <div className="chart-wrap"><Radar data={radarData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} /></div>
             </div>
          </div>
        )}

        {activeTab === 'xai' && (
          <div className="card">
             <div className="card-header">
                <span className="card-title">Global Feature Importance (SHAP Summary)</span>
             </div>
             <div style={{ padding: '0 16px 16px', color: 'var(--tx-2)', fontSize: 13 }}>
                These are the top factors that the primary machine learning model relies on to make predictions across the entire dataset.
             </div>
             <div className="chart-wrap-tall">
               {featureImportance ? (
                 <Bar data={xaiData} options={xaiChartOptions as any} />
               ) : (
                 <div className="loading-center"><div className="spinner" /></div>
               )}
             </div>
          </div>
        )}

      </div>
    </>
  )
}
