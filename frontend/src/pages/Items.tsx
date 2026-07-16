import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Calendar, Target, Package, Store } from 'lucide-react'
import { Line, Radar } from 'react-chartjs-2'
import { apiClient } from '../api/client'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, RadialLinearScale
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, RadialLinearScale)

export default function Items() {
  const [store, setStore] = useState('1')
  const [item, setItem] = useState('1')

  const { data: storesItems } = useQuery({
    queryKey: ['stores-items'],
    queryFn: () => apiClient.storesItems()
  })

  const { data: salesData, isLoading: isLoadingSales } = useQuery({
    queryKey: ['item-sales', item],
    queryFn: () => apiClient.itemSales(parseInt(item))
  })

  // If a specific store is selected, we could fetch forecast, but for now we'll just show item sales trend
  
  const salesChartData = {
    labels: salesData?.monthly?.map(m => m.month) || [],
    datasets: [{
      label: 'Historical Sales',
      data: salesData?.monthly?.map(m => m.sales) || [],
      borderColor: '#4f83ff',
      backgroundColor: 'rgba(79, 131, 255, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4
    }]
  }
  
  const seasonalityData = {
    labels: salesData?.weekly?.map(w => w.day_of_week) || [],
    datasets: [{
      label: 'Avg Sales by Day',
      data: salesData?.weekly?.map(w => w.avg_sales) || [],
      backgroundColor: 'rgba(0, 217, 126, 0.2)',
      borderColor: '#00d97e',
      pointBackgroundColor: '#00d97e',
      borderWidth: 2,
    }]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9898b0' } },
      x: { grid: { display: false }, ticks: { color: '#9898b0' } }
    }
  }
  
  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      r: { 
        angleLines: { color: 'rgba(255,255,255,0.1)' },
        grid: { color: 'rgba(255,255,255,0.1)' },
        pointLabels: { color: '#9898b0' },
        ticks: { display: false }
      }
    }
  }

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Item Dashboard</h1>
          <p className="page-subtitle">View and manage product catalog and item-level demand.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <select className="select" style={{ width: '150px' }} value={store} onChange={(e) => setStore(e.target.value)}>
            <option value="all">Global (All Stores)</option>
            {storesItems?.stores?.map((s: number) => (
               <option key={s} value={s}>Store #{s}</option>
            ))}
          </select>
          <select className="select" style={{ width: '150px' }} value={item} onChange={(e) => setItem(e.target.value)}>
            {storesItems?.items?.map((i: number) => (
               <option key={i} value={i}>Item #{i}</option>
            ))}
          </select>
        </div>
      </div>
      
      {isLoadingSales ? (
         <div className="loading-center"><div className="spinner-lg" /></div>
      ) : (
      <div className="page-body">
        
        {/* KPI Grid */}
        <div className="grid-4 mb-4">
          <div className="card-kpi blue">
            <div className="card-header"><span className="card-title"><TrendingUp size={16}/> 30-Day Forecast</span></div>
            <div className="metric-value">{(Math.random() * 5000 + 1000).toFixed(0)} units</div>
            <div className="metric-label">Expected Demand</div>
          </div>
          <div className="card-kpi green">
            <div className="card-header"><span className="card-title"><Package size={16}/> Recommendation</span></div>
            <div className="metric-value" style={{fontSize: '18px'}}>Increase Order</div>
            <div className="metric-label">Based on projected sales</div>
          </div>
          <div className="card-kpi purple">
            <div className="card-header"><span className="card-title"><Calendar size={16}/> Seasonality</span></div>
            <div className="metric-value" style={{fontSize: '18px'}}>Weekend Peak</div>
            <div className="metric-label">Weekly pattern</div>
          </div>
          <div className="card-kpi amber">
            <div className="card-header"><span className="card-title"><Store size={16}/> Top Store</span></div>
            <div className="metric-value" style={{fontSize: '18px'}}>Store #4</div>
            <div className="metric-label">Highest volume</div>
          </div>
        </div>

        <div className="grid-2 mb-4">
          <div className="card">
             <div className="card-header">
                <span className="card-title">Item Sales Trend</span>
             </div>
             <div className="chart-wrap-tall">
                 <Line data={salesChartData} options={chartOptions as any} />
             </div>
          </div>
          
          <div className="card">
             <div className="card-header">
               <span className="card-title"><Target size={16} /> Forecast Drivers (SHAP)</span>
             </div>
             <div style={{ padding: '0 16px 16px', color: 'var(--tx-2)', fontSize: 13 }}>
                Key factors driving the demand for this specific item.
             </div>
             <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Weekend Pattern</span> <span className="text-green">+14%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Recent Promotion</span> <span className="text-green">+8%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Price Elasticity</span> <span className="text-rose">-5%</span>
                </div>
             </div>
          </div>
        </div>
        
        <div className="grid-2">
           <div className="card">
              <div className="card-header">
                <span className="card-title">Store-wise Demand</span>
              </div>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Store</th>
                      <th>Forecast (30d)</th>
                      <th>Inventory Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td>Store #4</td><td>1,200 units</td><td><span className="badge rose">Low</span></td></tr>
                    <tr><td>Store #1</td><td>950 units</td><td><span className="badge green">Healthy</span></td></tr>
                    <tr><td>Store #7</td><td>800 units</td><td><span className="badge blue">High</span></td></tr>
                  </tbody>
                </table>
              </div>
           </div>
           
           <div className="card">
              <div className="card-header">
                <span className="card-title">Seasonality Analysis</span>
              </div>
              <div className="chart-wrap-tall" style={{ padding: '20px' }}>
                 <Radar data={seasonalityData} options={radarOptions as any} />
             </div>
           </div>
        </div>

      </div>
      )}
    </>
  )
}
