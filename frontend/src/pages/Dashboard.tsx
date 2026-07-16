import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { TrendingUp, Package, Store, Activity, ArrowRight, Zap, Target, AlertTriangle, ShieldCheck, Info } from 'lucide-react'
import { Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler, RadialLinearScale
} from 'chart.js'
import { apiClient } from '../api/client'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler, RadialLinearScale)

import { Cpu, Server } from 'lucide-react'

// Mock Data for new dashboard components
const STORE_RANKINGS = [
  { id: 1, name: 'Downtown (Store 1)', revenue: 145000, growth: 12.5, accuracy: 94.2 },
  { id: 4, name: 'Mall (Store 4)', revenue: 128000, growth: 8.4, accuracy: 91.5 },
  { id: 7, name: 'Airport (Store 7)', revenue: 98000, growth: -2.1, accuracy: 89.4 },
];

const CRITICAL_ALERTS = [
  { type: 'critical', message: 'Inventory below safety stock (Store 4 - Item 12)', time: '1 hour ago' },
  { type: 'warning', message: 'Demand spike expected this weekend (Store 1)', time: '3 hours ago' },
  { type: 'critical', message: 'Forecast reliability low due to data drift', time: '5 hours ago' },
  { type: 'warning', message: 'Feature drift detected in Promo feature', time: '1 day ago' },
  { type: 'critical', message: 'Missing incoming data for Store 2', time: '1 day ago' }
];

const RECENT_FORECASTS = [
  { target: 'Store #1 - Item #4', horizon: '30 Days', expected: '4,500 Units', status: 'Completed' },
  { target: 'Store #4 - Item #12', horizon: '14 Days', expected: '1,200 Units', status: 'Completed' },
  { target: 'Store #2 - Item #8', horizon: '7 Days', expected: '850 Units', status: 'Processing' }
];

const MODEL_HEALTH = {
  name: 'LightGBM v1.2',
  trained: '2026-07-17',
  rmse: '6.18',
  status: 'Healthy',
  inference: '12 ms'
};

const HEATMAP_DATA = [
  { store: 'Store 1', w1: 85, w2: 90, w3: 110, w4: 95 },
  { store: 'Store 2', w1: 40, w2: 45, w3: 42, w4: 50 },
  { store: 'Store 3', w1: 60, w2: 55, w3: 65, w4: 60 },
  { store: 'Store 4', w1: 95, w2: 120, w3: 130, w4: 115 },
];

const getHeatmapColor = (val: number) => {
  if (val > 100) return 'rgba(255, 77, 109, 0.8)'; // high (rose)
  if (val > 70) return 'rgba(255, 170, 0, 0.8)'; // med (amber)
  if (val > 50) return 'rgba(0, 217, 126, 0.8)'; // ok (green)
  return 'rgba(79, 131, 255, 0.6)'; // low (blue)
};

export default function Dashboard() {
  const [selectedStore, setSelectedStore] = useState('1')

  const { data: storesItems } = useQuery({
    queryKey: ['stores-items'],
    queryFn: () => apiClient.storesItems()
  })

  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ['store-dashboard', selectedStore],
    queryFn: () => apiClient.getStoreDashboard(parseInt(selectedStore))
  })

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Executive Dashboard</h1>
          <p className="page-subtitle">Global overview of business KPIs, rankings, and active alerts.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Link to="/forecast" className="btn btn-blue">
            <Zap size={16} /> New Forecast
          </Link>
        </div>
      </div>

      {isLoadingDashboard ? (
        <div className="loading-center"><div className="spinner-lg" /></div>
      ) : (
        <div className="page-body">
          {/* Executive Summary (Today's Summary) */}
          <div style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 8, padding: 20, marginBottom: 24, display: 'flex', gap: 24, justifyContent: 'space-between' }}>
             <div>
                <div style={{ fontSize: 13, color: 'var(--tx-3)', marginBottom: 4 }}>Forecast Demand</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--green)' }}>+8%</div>
             </div>
             <div style={{ width: 1, background: 'var(--border)' }}></div>
             <div>
                <div style={{ fontSize: 13, color: 'var(--tx-3)', marginBottom: 4 }}>Inventory Risk</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--amber)' }}>Medium</div>
             </div>
             <div style={{ width: 1, background: 'var(--border)' }}></div>
             <div>
                <div style={{ fontSize: 13, color: 'var(--tx-3)', marginBottom: 4 }}>Model Accuracy</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--tx-1)' }}>93%</div>
             </div>
             <div style={{ width: 1, background: 'var(--border)' }}></div>
             <div>
                <div style={{ fontSize: 13, color: 'var(--tx-3)', marginBottom: 4 }}>Stores at Risk</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--rose)' }}>2</div>
             </div>
             <div style={{ width: 1, background: 'var(--border)' }}></div>
             <div>
                <div style={{ fontSize: 13, color: 'var(--tx-3)', marginBottom: 4 }}>Recommended Action</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--blue)', maxWidth: 200, lineHeight: 1.2 }}>Increase inventory for Store 4</div>
             </div>
          </div>

          <div className="grid-2 mb-4">
            {/* Store Rankings */}
            <div className="card">
              <div className="card-header">
                <span className="card-title"><Store size={16} /> Top Store Rankings</span>
              </div>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Store</th>
                      <th>Revenue (30d)</th>
                      <th>Growth</th>
                      <th>Fcst Accuracy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {STORE_RANKINGS.map((store, i) => (
                      <tr key={i}>
                        <td style={{fontWeight: 500}}>{store.name}</td>
                        <td style={{ color: 'var(--blue)' }}>${store.revenue.toLocaleString()}</td>
                        <td style={{ color: store.growth > 0 ? 'var(--green)' : 'var(--rose)' }}>
                          {store.growth > 0 ? '+' : ''}{store.growth}%
                        </td>
                        <td>{store.accuracy}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Product Rankings */}
            <div className="card">
              <div className="card-header">
                <span className="card-title"><Package size={16} /> Top Product Rankings (Network)</span>
              </div>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Global Revenue</th>
                      <th>Units Sold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData?.top_items.slice(0,3).map((item: any, i: number) => (
                      <tr key={i}>
                        <td style={{fontWeight: 500}}>{item.name}</td>
                        <td style={{ color: 'var(--green)' }}>${(item.revenue * 5).toLocaleString()}</td>
                        <td>{(item.units_sold * 5).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid-2 mb-4">
             {/* Demand Heatmap (Store x Week) */}
             <div className="card">
                <div className="card-header">
                  <span className="card-title"><Activity size={16} /> Business Heatmap (Store × Week Demand)</span>
                </div>
                <div className="table-responsive">
                  <table className="table" style={{ textAlign: 'center' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left' }}>Store</th>
                        <th>Week 1</th>
                        <th>Week 2</th>
                        <th>Week 3</th>
                        <th>Week 4</th>
                      </tr>
                    </thead>
                    <tbody>
                      {HEATMAP_DATA.map((row, idx) => (
                        <tr key={idx}>
                           <td style={{ textAlign: 'left', fontWeight: 500 }}>{row.store}</td>
                           <td style={{ background: getHeatmapColor(row.w1), color: '#fff' }}>{row.w1}</td>
                           <td style={{ background: getHeatmapColor(row.w2), color: '#fff' }}>{row.w2}</td>
                           <td style={{ background: getHeatmapColor(row.w3), color: '#fff' }}>{row.w3}</td>
                           <td style={{ background: getHeatmapColor(row.w4), color: '#fff' }}>{row.w4}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>

             {/* System Alerts */}
            <div className="card">
              <div className="card-header">
                <span className="card-title"><AlertTriangle size={16} color="var(--rose)" /> Critical Alerts Center</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {CRITICAL_ALERTS.map((alert, i) => (
                  <div key={i} style={{ 
                    padding: 12, 
                    background: alert.type === 'critical' ? 'rgba(255, 77, 109, 0.1)' : alert.type === 'warning' ? 'rgba(255, 170, 0, 0.1)' : 'var(--surface-3)', 
                    border: `1px solid ${alert.type === 'critical' ? 'rgba(255, 77, 109, 0.2)' : alert.type === 'warning' ? 'rgba(255, 170, 0, 0.2)' : 'var(--border)'}`,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12
                  }}>
                    {alert.type === 'critical' ? <AlertTriangle size={16} color="var(--rose)" style={{marginTop: 2}} /> : 
                     alert.type === 'warning' ? <AlertTriangle size={16} color="var(--amber)" style={{marginTop: 2}} /> : 
                     <Info size={16} color="var(--blue)" style={{marginTop: 2}} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: 'var(--tx-1)', fontWeight: 500 }}>{alert.message}</div>
                      <div style={{ fontSize: 11, color: 'var(--tx-3)', marginTop: 4 }}>{alert.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid-2">
            {/* Model Monitoring */}
            <div className="card">
               <div className="card-header">
                  <span className="card-title"><Cpu size={16} /> Model Monitoring</span>
               </div>
               <div className="grid-2" style={{ gap: 16 }}>
                  <div style={{ background: 'var(--surface-3)', padding: 16, borderRadius: 8 }}>
                     <div style={{ fontSize: 12, color: 'var(--tx-3)', marginBottom: 4 }}>Current Model</div>
                     <div style={{ fontSize: 16, fontWeight: 600 }}>{MODEL_HEALTH.name}</div>
                  </div>
                  <div style={{ background: 'var(--surface-3)', padding: 16, borderRadius: 8 }}>
                     <div style={{ fontSize: 12, color: 'var(--tx-3)', marginBottom: 4 }}>Status</div>
                     <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--green)' }}>{MODEL_HEALTH.status}</div>
                  </div>
                  <div style={{ background: 'var(--surface-3)', padding: 16, borderRadius: 8 }}>
                     <div style={{ fontSize: 12, color: 'var(--tx-3)', marginBottom: 4 }}>RMSE</div>
                     <div style={{ fontSize: 16, fontWeight: 600 }}>{MODEL_HEALTH.rmse}</div>
                  </div>
                  <div style={{ background: 'var(--surface-3)', padding: 16, borderRadius: 8 }}>
                     <div style={{ fontSize: 12, color: 'var(--tx-3)', marginBottom: 4 }}>Inference Time</div>
                     <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--blue)' }}>{MODEL_HEALTH.inference}</div>
                  </div>
                  <div style={{ background: 'var(--surface-3)', padding: 16, borderRadius: 8, gridColumn: 'span 2' }}>
                     <div style={{ fontSize: 12, color: 'var(--tx-3)', marginBottom: 4 }}>Last Trained</div>
                     <div style={{ fontSize: 16, fontWeight: 600 }}>{MODEL_HEALTH.trained}</div>
                  </div>
               </div>
            </div>

            {/* Recent Forecasts */}
            <div className="card">
              <div className="card-header">
                <span className="card-title"><TrendingUp size={16} /> Recent Forecasts</span>
              </div>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Target</th>
                      <th>Horizon</th>
                      <th>Expected Demand</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RECENT_FORECASTS.map((fcst, i) => (
                      <tr key={i}>
                        <td style={{fontWeight: 500}}>{fcst.target}</td>
                        <td style={{ color: 'var(--tx-2)' }}>{fcst.horizon}</td>
                        <td style={{ color: 'var(--blue)' }}>{fcst.expected}</td>
                        <td>
                          <span className={`badge ${fcst.status === 'Completed' ? 'green' : 'amber'}`}>
                            {fcst.status}
                          </span>
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
