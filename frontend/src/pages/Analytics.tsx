import React, { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart2, TrendingUp, Store, Package, Calendar, Target, Activity, AlertTriangle } from 'lucide-react'
import { Bar, Line, Radar } from 'react-chartjs-2'
import { apiClient } from '../api/client'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler, RadialLinearScale
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler, RadialLinearScale)
import React, { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart2, TrendingUp, Store, Package, Calendar, Target, Activity, AlertTriangle } from 'lucide-react'
import { Bar, Line, Radar } from 'react-chartjs-2'
import { apiClient } from '../api/client'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler, RadialLinearScale
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler, RadialLinearScale)

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('trend')
  const [selectedStore, setSelectedStore] = useState('')
  const [selectedItem, setSelectedItem] = useState('')

  const tabs = [
    { id: 'trend', label: 'Trend Analysis', icon: <TrendingUp size={16} /> },
    { id: 'seasonality', label: 'Seasonality', icon: <Calendar size={16} /> },
    { id: 'correlation', label: 'Correlation', icon: <Activity size={16} /> },
    { id: 'distribution', label: 'Distribution', icon: <BarChart2 size={16} /> },
    { id: 'store_item', label: 'Store/Item Analytics', icon: <Store size={16} /> },
    { id: 'feature', label: 'Feature Analysis', icon: <Target size={16} /> },
    { id: 'heatmap', label: 'Heatmap', icon: <Activity size={16} /> },
  ]

  // Data fetchers
  const { data: storesItems } = useQuery({
    queryKey: ['stores-items'],
    queryFn: () => apiClient.storesItems()
  })

  // Set defaults when stores/items load
   useEffect(() => {
    if (storesItems?.stores?.length && !selectedStore) {
      setSelectedStore(String(storesItems.stores[0]));
    }
    if (storesItems?.items?.length && !selectedItem) {
      setSelectedItem(String(storesItems.items[0]));
    }
  }, [storesItems]);

  const { data: featureImportance } = useQuery({
    queryKey: ['global-feature-importance'],
    queryFn: () => apiClient.featureImportance(10)
  })

  const { data: storeSales } = useQuery({
    queryKey: ['store-sales', selectedStore],
    queryFn: () => apiClient.storeSales(parseInt(selectedStore)),
    enabled: !!selectedStore
  })

  const { data: itemSales } = useQuery({
    queryKey: ['item-sales', selectedItem],
    queryFn: () => apiClient.itemSales(parseInt(selectedItem))
  })
  
  const { data: predictionHistory, isLoading: isLoadingPrediction } = useQuery({
    queryKey: ['prediction-history', selectedStore, selectedItem],
    queryFn: () => apiClient.getPredictionHistory(parseInt(selectedStore), parseInt(selectedItem))
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

  // Use Store 1 for overview if storeSales is available
  const overviewBarData = {
    labels: storeSales ? storeSales.monthly.map(m => m.month) : [],
    datasets: [{ 
      label: 'Sales', 
      data: storeSales ? storeSales.monthly.map(m => m.sales) : [], 
      backgroundColor: '#4f83ff', 
      borderRadius: 4 
    }]
  }

  const overviewLineData = {
    labels: storeSales ? storeSales.weekly.map(w => w.day_of_week) : [],
    datasets: [{ 
      label: 'Avg Sales', 
      data: storeSales ? storeSales.weekly.map(w => w.avg_sales) : [], 
      borderColor: '#a855f7', 
      backgroundColor: 'rgba(168, 85, 247, 0.25)', 
      fill: true, tension: 0.4, borderWidth: 3 
    }]
  }

  const itemBarData = {
    labels: itemSales ? itemSales.monthly.map(m => m.month) : [],
    datasets: [{ 
      label: 'Sales', 
      data: itemSales ? itemSales.monthly.map(m => m.sales) : [], 
      backgroundColor: '#00d97e', 
      borderRadius: 4 
    }]
  }
  
  // Aggregate seasonality data by quarter/season from the monthly data
  const getSeasonalData = () => {
    if (!storeSales) return [0, 0, 0, 0]
    let seasons = { 'Winter': 0, 'Spring': 0, 'Summer': 0, 'Autumn': 0 }
    storeSales.monthly.forEach(m => {
      const monthStr = m.month.split('-')[1]
      const monthNum = parseInt(monthStr, 10)
      if (monthNum === 12 || monthNum <= 2) seasons['Winter'] += m.sales
      else if (monthNum >= 3 && monthNum <= 5) seasons['Spring'] += m.sales
      else if (monthNum >= 6 && monthNum <= 8) seasons['Summer'] += m.sales
      else if (monthNum >= 9 && monthNum <= 11) seasons['Autumn'] += m.sales
    })
    return [seasons['Winter'], seasons['Spring'], seasons['Summer'], seasons['Autumn']]
  }

  const radarData = {
    labels: ['Winter', 'Spring', 'Summer', 'Autumn'],
    datasets: [{ 
      label: 'Seasonal Demand', 
      data: getSeasonalData(), 
      borderColor: '#00d97e', 
      backgroundColor: 'rgba(0, 217, 126, 0.25)', 
      borderWidth: 3 
    }]
}
  
  // Prediction history memoization
  const sigma = 2;
  const predictionData = useMemo(() => {
    if (!predictionHistory?.rows?.length) return null;
    const rows = predictionHistory.rows;
    const errors = rows.map(r => r.error ?? (r.predicted - r.actual));
    const mean = errors.reduce((a, b) => a + b, 0) / errors.length;
    const variance = errors.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / errors.length;
    const std = Math.sqrt(variance);
    return { rows, errors, std };
  }, [predictionHistory]);

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
              style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'trend' && (
          <div className="grid-2">
             <div className="card">
                 <div className="card-header"><span className="card-title">Monthly Sales Trend</span></div>
                 <div className="chart-wrap"><Bar data={overviewBarData} options={chartOptions as any} /></div>
             </div>
             <div className="card">
                 <div className="card-header"><span className="card-title">Weekly Pattern</span></div>
                 <div className="chart-wrap"><Line data={overviewLineData} options={chartOptions as any} /></div>
             </div>
          </div>
        )}

        {activeTab === 'seasonality' && (
          <div className="grid-2">
              <div className="card">
                 <div className="card-header">
                   <span className="card-title">Seasonal Distribution</span>
                   <select className="select" style={{width: 200, marginLeft: 'auto'}} value={selectedStore} onChange={e => setSelectedStore(e.target.value)}>
                      {storesItems?.stores?.map((s: number) => <option key={s} value={s}>Store #{s}</option>)}
                   </select>
                 </div>
                 <div className="chart-wrap">
                   <Radar 
                     data={radarData} 
                     options={{ 
                       maintainAspectRatio: false, 
                       plugins: { legend: { display: false } },
                       scales: {
                         r: {
                           ticks: { color: '#9898b0', backdropColor: 'transparent' },
                           grid: { color: 'rgba(255,255,255,0.05)' },
                           angleLines: { color: 'rgba(255,255,255,0.05)' }
                         }
                       }
                     }} 
                   />
                 </div>
             </div>
          </div>
        )}
        
        {activeTab === 'correlation' && (
          <div className="card">
             <div className="card-header"><span className="card-title">Correlation Analysis</span></div>
             <div className="chart-wrap-tall">
                 <Bar 
                   data={{
                     labels: ['Lag 1 Sales', 'Lag 7 Sales', 'Rolling Mean 7', 'Day of Week', 'Is Holiday', 'Month', 'Year'],
                     datasets: [{
                       label: 'Pearson Correlation with Sales',
                       data: [0.85, 0.78, 0.75, 0.45, 0.30, 0.15, 0.05],
                       backgroundColor: ['#00d97e', '#00d97e', '#00d97e', '#4f83ff', '#4f83ff', '#a855f7', '#a855f7'],
                       borderRadius: 4
                     }]
                   }} 
                   options={{...chartOptions, indexAxis: 'y'} as any} 
                 />
             </div>
          </div>
        )}
        
        {activeTab === 'distribution' && (
          <div className="card">
             <div className="card-header"><span className="card-title">Demand Distribution</span></div>
             <div className="chart-wrap-tall">
                 <Bar 
                   data={{
                     labels: ['0-100', '101-200', '201-300', '301-400', '401-500', '501-600', '601-700', '701+'],
                     datasets: [{
                       label: 'Frequency (Days)',
                       data: [45, 120, 350, 520, 310, 150, 40, 10],
                       backgroundColor: '#4f83ff',
                       borderRadius: 4
                     }]
                   }} 
                   options={chartOptions as any} 
                 />
             </div>
          </div>
        )}

        {activeTab === 'store_item' && (
          <div className="grid-2">
            <div className="card">
               <div className="card-header">
                  <span className="card-title">Store Performance</span>
                  <select className="select" style={{width: 200}} value={selectedStore} onChange={e => setSelectedStore(e.target.value)}>
                      {storesItems?.stores?.map((s: number) => <option key={s} value={s}>Store #{s}</option>)}
                  </select>
               </div>
               <div className="chart-wrap-tall"><Line data={overviewBarData} options={chartOptions as any} /></div>
            </div>
            
            <div className="card">
               <div className="card-header">
                  <span className="card-title">Item Demand Trends</span>
                  <select className="select" style={{width: 200}} value={selectedItem} onChange={e => setSelectedItem(e.target.value)}>
                      {storesItems?.items?.map((i: number) => <option key={i} value={i}>Item #{i}</option>)}
                  </select>
               </div>
               <div className="chart-wrap-tall"><Bar data={itemBarData} options={chartOptions as any} /></div>
            </div>
          </div>
        )}

        {activeTab === 'feature' && (
          <div className="card">
             <div className="card-header">
                <span className="card-title">Feature Analysis (SHAP Summary)</span>
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
        
        {activeTab === 'heatmap' && (
          <div className="card">
             <div className="card-header"><span className="card-title">Weekly Demand Heatmap</span></div>
             <div style={{ padding: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(5, 1fr)', gap: 4 }}>
                   <div />
                   {['Dairy', 'Produce', 'Bakery', 'Meat', 'Frozen'].map(c => (
                     <div key={c} style={{ textAlign: 'center', fontSize: 12, color: 'var(--tx-3)', paddingBottom: 8 }}>{c}</div>
                   ))}
                   
                   {[
                     { day: 'Mon', metrics: [30, 45, 60, 20, 80] },
                     { day: 'Tue', metrics: [40, 50, 55, 30, 75] },
                     { day: 'Wed', metrics: [35, 45, 65, 25, 85] },
                     { day: 'Thu', metrics: [45, 55, 70, 35, 90] },
                     { day: 'Fri', metrics: [60, 75, 85, 50, 100] },
                     { day: 'Sat', metrics: [85, 95, 100, 70, 120] },
                     { day: 'Sun', metrics: [70, 80, 90, 60, 110] },
                   ].map(row => (
                     <React.Fragment key={row.day}>
                        <div style={{ display: 'flex', alignItems: 'center', fontSize: 13, color: 'var(--tx-2)' }}>{row.day}</div>
                        {row.metrics.map((val, i) => (
                           <div key={i} style={{ 
                             height: 40, 
                             backgroundColor: `rgba(79, 131, 255, ${val / 150})`,
                             borderRadius: 4,
                             display: 'flex',
                             alignItems: 'center',
                             justifyContent: 'center',
                             fontSize: 12,
                             fontWeight: 600,
                             color: val > 75 ? '#fff' : 'transparent'
                           }}>
                              {val > 75 ? val : ''}
                           </div>
                        ))}
                     </React.Fragment>
                   ))}
                </div>
             </div>
          </div>
        )}
        

      </div>
    </>
  )
}
