import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Package, ShieldCheck, Activity } from 'lucide-react'
import { Line, Bar } from 'react-chartjs-2'
import { apiClient } from '../api/client'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler)

export default function Stores() {
  const [store, setStore] = useState('1')
  
  const { data: storesItems } = useQuery({
    queryKey: ['stores-items'],
    queryFn: () => apiClient.storesItems()
  })

  const { data: dashboardData, isLoading: isLoadingDash } = useQuery({
    queryKey: ['store-dashboard', store],
    queryFn: () => apiClient.getStoreDashboard(parseInt(store))
  })

  const { data: salesData, isLoading: isLoadingSales } = useQuery({
    queryKey: ['store-sales', store],
    queryFn: () => apiClient.storeSales(parseInt(store))
  })

  const { data: inventoryData, isLoading: isLoadingInv } = useQuery({
    queryKey: ['store-inventory', store],
    queryFn: () => apiClient.getStoreInventory(parseInt(store))
  })

  const isLoading = isLoadingDash || isLoadingSales || isLoadingInv;

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
  
  const weeklyChartData = {
    labels: salesData?.weekly?.map(w => w.day_of_week) || [],
    datasets: [{
      label: 'Avg Weekly Sales',
      data: salesData?.weekly?.map(w => w.avg_sales) || [],
      backgroundColor: '#00d97e',
      borderRadius: 4
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

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Store Dashboard</h1>
          <p className="page-subtitle">View and manage store locations.</p>
        </div>
        <div>
          <select className="select" style={{ width: '200px' }} value={store} onChange={(e) => setStore(e.target.value)}>
            {storesItems?.stores?.map((s: number) => (
               <option key={s} value={s}>Store #{s}</option>
            ))}
          </select>
        </div>
      </div>
      
      {isLoading ? (
         <div className="loading-center"><div className="spinner-lg" /></div>
      ) : (
      <div className="page-body">
        
        {/* KPI Grid */}
        <div className="grid-4 mb-4">
          <div className="card-kpi blue">
            <div className="card-header"><span className="card-title"><TrendingUp size={16}/> Revenue (30d)</span></div>
            <div className="metric-value">${dashboardData?.projected_revenue_30d.toLocaleString()}</div>
            <div className="metric-label">{(dashboardData?.yoy_growth ?? 0) > 0 ? '+' : ''}{dashboardData?.yoy_growth ?? 0}% YoY Growth</div>
          </div>
          <div className="card-kpi green">
            <div className="card-header"><span className="card-title"><Activity size={16}/> Projected Volume</span></div>
            <div className="metric-value">{dashboardData?.projected_volume_30d.toLocaleString()}</div>
            <div className="metric-label">Units next 30 days</div>
          </div>
          <div className="card-kpi purple">
            <div className="card-header"><span className="card-title"><Package size={16}/> Top Product</span></div>
            <div className="metric-value" style={{fontSize: '18px'}}>{dashboardData?.top_items[0]?.name || 'N/A'}</div>
            <div className="metric-label">By Volume</div>
          </div>
          <div className="card-kpi amber">
            <div className="card-header"><span className="card-title"><ShieldCheck size={16}/> Store Status</span></div>
            <div className="metric-value">{dashboardData?.status}</div>
            <div className="metric-label">Operational Health</div>
          </div>
        </div>

        <div className="grid-2 mb-4">
          <div className="card">
             <div className="card-header">
                <span className="card-title">Historical Sales Trend</span>
             </div>
             <div className="chart-wrap-tall">
                 <Line data={salesChartData} options={chartOptions as any} />
             </div>
          </div>
          
          <div className="card">
             <div className="card-header">
               <span className="card-title"><Activity size={16} /> Weekly Seasonality</span>
             </div>
             <div className="chart-wrap-tall">
                 <Bar data={weeklyChartData} options={chartOptions as any} />
             </div>
          </div>
        </div>
        
        <div className="grid-2">
           <div className="card">
              <div className="card-header">
                <span className="card-title">Top Products</span>
              </div>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Revenue</th>
                      <th>Units Sold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData?.top_items.map((item: any, i: number) => (
                       <tr key={i}>
                         <td style={{fontWeight: 500}}>{item.name}</td>
                         <td style={{color:'var(--green)'}}>${item.revenue.toLocaleString()}</td>
                         <td>{item.units_sold.toLocaleString()}</td>
                       </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
           
           <div className="card">
              <div className="card-header">
                <span className="card-title">Inventory Risk</span>
              </div>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Current Stock</th>
                      <th>Risk Level</th>
                      <th>Rec. Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryData?.items.slice(0, 5).map((item: any, i: number) => (
                       <tr key={i}>
                         <td style={{fontWeight: 500}}>{item.name}</td>
                         <td>{item.current_stock}</td>
                         <td>
                            {item.risk_status === 'Stockout Risk' && <span className="badge rose">{item.risk_status}</span>}
                            {item.risk_status === 'Low Stock' && <span className="badge amber">{item.risk_status}</span>}
                            {item.risk_status === 'Healthy' && <span className="badge green">{item.risk_status}</span>}
                            {item.risk_status === 'Overstock' && <span className="badge blue">{item.risk_status}</span>}
                         </td>
                         <td style={{ color: item.reorder_rec > 0 ? 'var(--blue)' : 'var(--tx-2)' }}>
                            {item.reorder_rec > 0 ? `+${item.reorder_rec}` : '-'}
                         </td>
                       </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        </div>

      </div>
      )}
    </>
  )
}
