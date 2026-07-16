import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { TrendingUp, Package, Store, Activity, ArrowRight, Zap, Target, History } from 'lucide-react'
import { Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler
} from 'chart.js'
import axios from 'axios'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler)

export default function Dashboard() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: async () => {
      const { data } = await axios.get('http://localhost:8000/api/dashboard')
      return data
    }
  })

  if (isLoading) return <div className="loading-center"><div className="spinner-lg" /></div>
  
  const chartData = {
    labels: dashboardData?.sales_trend?.map((t: any) => t.year) || [],
    datasets: [
      {
        label: 'Total Sales',
        data: dashboardData?.sales_trend?.map((t: any) => t.sales) || [],
        borderColor: '#4f83ff',
        backgroundColor: 'rgba(79, 131, 255, 0.25)',
        borderWidth: 3,
        fill: true,
        tension: 0.4
      }
    ]
  }
  
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
        border: { dash: [4, 4] },
        ticks: { color: '#9898b0', font: { family: 'Inter' } }
      },
      x: { 
        grid: { display: false },
        ticks: { color: '#9898b0', font: { family: 'Inter' } }
      }
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Business Overview</h1>
          <p className="page-subtitle">Real-time pulse of your retail operations and demand forecasts.</p>
        </div>
        <Link to="/forecast" className="btn btn-blue">
          <Zap size={16} /> Quick Forecast
        </Link>
      </div>

      <div className="page-body">
        {/* KPI Grid */}
        <div className="grid-5 mb-4">
          <div className="card-kpi blue">
            <div className="card-header"><span className="card-title"><Store size={16}/> Total Stores</span></div>
            <div className="metric-value">{dashboardData?.total_stores || 0}</div>
            <div className="metric-label">Active Locations</div>
          </div>
          <div className="card-kpi green">
            <div className="card-header"><span className="card-title"><Package size={16}/> Total Items</span></div>
            <div className="metric-value">{dashboardData?.total_items || 0}</div>
            <div className="metric-label">Tracked SKUs</div>
          </div>
          <div className="card-kpi amber">
            <div className="card-header"><span className="card-title"><TrendingUp size={16}/> Total Sales</span></div>
            <div className="metric-value">{(dashboardData?.total_sales / 1000000).toFixed(1)}M</div>
            <div className="metric-label">Historical Units Sold</div>
          </div>
          <div className="card-kpi purple">
            <div className="card-header"><span className="card-title"><Target size={16}/> Forecast Accuracy</span></div>
            <div className="metric-value">{dashboardData?.forecast_accuracy || '0%'}</div>
            <div className="metric-label">Aggregate MAPE</div>
          </div>
          <div className="card-kpi teal">
            <div className="card-header"><span className="card-title"><History size={16}/> Avg Daily Sales</span></div>
            <div className="metric-value">{dashboardData?.avg_daily_sales || 0}</div>
            <div className="metric-label">Across All Stores</div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid-2 mb-4">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Historical Sales Trend</span>
            </div>
            <div className="chart-wrap">
              <Line data={chartData} options={chartOptions as any} />
            </div>
          </div>
          
          <div className="card">
            <div className="card-header">
              <span className="card-title">Quick Actions & Insights</span>
            </div>
            <div className="flex" style={{ flexDirection: 'column', gap: '16px', height: '100%' }}>
                <div className="stat-row">
                    <div className="flex items-center gap-2">
                        <div className="icon-box" style={{ background: 'var(--amber-bg)', color: 'var(--amber)' }}><Store size={18}/></div>
                        <div>
                            <div style={{ fontWeight: 600 }}>Best Selling Store</div>
                            <div className="text-muted" style={{ fontSize: 12 }}>Store #{dashboardData?.best_selling_store}</div>
                        </div>
                    </div>
                </div>
                <div className="stat-row">
                    <div className="flex items-center gap-2">
                        <div className="icon-box" style={{ background: 'var(--green-bg)', color: 'var(--green)' }}><Package size={18}/></div>
                        <div>
                            <div style={{ fontWeight: 600 }}>Best Selling Item</div>
                            <div className="text-muted" style={{ fontSize: 12 }}>Item #{dashboardData?.best_selling_item}</div>
                        </div>
                    </div>
                </div>
                <div style={{ marginTop: 'auto', display: 'flex', gap: '12px', paddingTop: '20px' }}>
                    <Link to="/analytics" className="btn btn-outline flex-1">View Full Analytics</Link>
                    <Link to="/forecast" className="btn btn-blue flex-1">Generate Forecast</Link>
                </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
