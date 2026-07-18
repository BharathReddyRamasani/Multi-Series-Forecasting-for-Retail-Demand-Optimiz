import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Bar } from 'react-chartjs-2'
import { apiClient } from '../api/client'
import { Beaker, SlidersHorizontal, ArrowRight, TrendingUp, TrendingDown, Target } from 'lucide-react'
import toast from 'react-hot-toast'

export default function DigitalTwin() {
  const [store, setStore] = useState('1')
  const [item, setItem] = useState('1')
  
  // Scenarios
  const [forceHoliday, setForceHoliday] = useState(false)
  const [forcePromotion, setForcePromotion] = useState(false)
  const [promotionFactor, setPromotionFactor] = useState('')
  const [holidayFactor, setHolidayFactor] = useState('')
  
  const { data: storesItems } = useQuery({
    queryKey: ['stores-items'],
    queryFn: () => apiClient.storesItems()
  })

  // Baseline
  const baselineMutation = useMutation({
    mutationFn: () => apiClient.simulate({ store: parseInt(store), item: parseInt(item), horizon: 30, model_type: 'lightgbm' })
  })

  // Scenario
  const scenarioMutation = useMutation({
    mutationFn: () => apiClient.simulate({ 
      store: parseInt(store), 
      item: parseInt(item), 
      horizon: 30, 
      model_type: 'lightgbm',
scenario_overrides: {
                  ...(forceHoliday ? { force_holiday: true } : {}),
                  ...(forcePromotion ? { force_promotion: true } : {}),
                  ...(promotionFactor ? { promotion_factor: parseFloat(promotionFactor) } : {}),
                  ...(holidayFactor ? { holiday_factor: parseFloat(holidayFactor) } : {})
                }
    }),
    onSuccess: () => toast.success('Simulation complete!')
  })
  
  const runSimulation = () => {
    baselineMutation.mutate()
    scenarioMutation.mutate()
  }

  const baseData = baselineMutation.data
  const simData = scenarioMutation.data
  const isRunning = baselineMutation.isPending || scenarioMutation.isPending
  
  const getChartData = () => {
    if (!baseData || !simData) return { labels: [], datasets: [] }
    
    return {
      labels: baseData.forecasts.map(f => f.date.substring(5)),
      datasets: [
        {
          label: 'Baseline',
          data: baseData.forecasts.map(f => f.point),
          backgroundColor: 'rgba(79, 131, 255, 0.5)',
          borderRadius: 4
        },
        {
          label: 'Simulation',
          data: simData.forecasts.map(f => f.point),
          backgroundColor: 'rgba(0, 217, 126, 0.8)',
          borderRadius: 4
        }
      ]
    }
  }

  return (
      <div style={{ display: 'flex', gap: 24 }}>
          
          {/* Controls */}
          <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card">
              <div className="card-header"><span className="card-title"><Target size={16} /> Target Selection</span></div>
              <div className="form-group mb-4">
                <label className="form-label">Store</label>
                <select className="select" value={store} onChange={e => setStore(e.target.value)}>
                  {storesItems?.stores?.map(s => <option key={s} value={s}>Store #{s}</option>)}
                </select>
              </div>
              <div className="form-group mb-2">
                <label className="form-label">Item</label>
                <select className="select" value={item} onChange={e => setItem(e.target.value)}>
                  {storesItems?.items?.map(i => <option key={i} value={i}>Item #{i}</option>)}
                </select>
              </div>
            </div>
            
            <div className="card">
              <div className="card-header"><span className="card-title"><SlidersHorizontal size={16} /> Scenario Parameters</span></div>
              
              <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--tx-3)', padding: '0 16px' }}>
                * Note: These are hypothetical scenario inputs to test extreme bounds.
              </div>
              
<div className="form-group mb-4" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px' }}>
  <input type="checkbox" id="holiday" checked={forceHoliday} onChange={e => setForceHoliday(e.target.checked)} />
  <label htmlFor="holiday" className="form-label" style={{marginBottom: 0, cursor: 'pointer'}}>Simulate Holiday Event</label>
</div>
{/* Optional holiday multiplier */}
<div className="form-group mb-4" style={{ padding: '0 16px' }}>
  <label className="form-label" htmlFor="holiday-factor" style={{marginBottom: 4}}>Holiday Sales Multiplier (e.g., 1.15 for +15%)</label>
  <input type="number" id="holiday-factor" className="input" placeholder="1.0" min="0" step="0.01"
    value={holidayFactor}
    onChange={e => setHolidayFactor(e.target.value)}
  />
</div>
              
              <div className="form-group mb-4" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px' }}>
                <input type="checkbox" id="promo" checked={forcePromotion} onChange={e => setForcePromotion(e.target.checked)} />
                <label htmlFor="promo" className="form-label" style={{marginBottom: 0, cursor: 'pointer'}}>Active Promotion Campaign</label>
</div>
               
               {/* Optional promotion multiplier */}
               <div className="form-group mb-4" style={{ padding: '0 16px' }}>
                 <label className="form-label" htmlFor="promotion-factor" style={{marginBottom: 4}}>Promotion Sales Multiplier (e.g., 1.25 for +25%)</label>
                 <input type="number" id="promotion-factor" className="input" placeholder="1.25" min="0" step="0.01"
                   value={promotionFactor}
                   onChange={e => setPromotionFactor(e.target.value)}
                 />
               </div>
               
               <button 
                 className="btn btn-blue w-full mt-4" 
                 onClick={runSimulation}
                 disabled={isRunning}
              >
                {isRunning ? <div className="spinner" /> : <><Beaker size={16} /> Run Simulation</>}
              </button>
            </div>
          </div>
          
          {/* Results */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
            {!baseData && !isRunning && (
              <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="empty-state">
                  <Beaker size={48} style={{ opacity: 0.5 }} />
                  <p>Configure parameters and run a simulation to see the impact.</p>
                </div>
              </div>
            )}
            
            {isRunning && (
               <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="loading-center">
                    <div className="spinner-lg" />
                    <div style={{ marginTop: 16, color: 'var(--tx-3)' }}>Simulating parallel realities...</div>
                  </div>
               </div>
            )}
            
            {baseData && simData && !isRunning && (
              <>
                <div className="grid-3">
                  <div className="card-kpi blue">
                    <div className="card-header"><span className="card-title">Baseline Demand</span></div>
                    <div className="metric-value">{baseData.expected_sales.toLocaleString()}</div>
                    <div className="metric-label">30 Day Horizon</div>
                  </div>
                  <div className="card-kpi green">
                    <div className="card-header"><span className="card-title">Simulated Demand</span></div>
                    <div className="metric-value">{simData.expected_sales.toLocaleString()}</div>
                    <div className="metric-label">With Overrides</div>
                  </div>
                  
                  {simData.expected_sales > baseData.expected_sales ? (
                    <div className="card-kpi green" style={{ background: 'rgba(0, 217, 126, 0.1)'}}>
                      <div className="card-header"><span className="card-title text-green">Net Impact</span></div>
                      <div className="metric-value text-green" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <TrendingUp /> +{((simData.expected_sales / baseData.expected_sales - 1) * 100).toFixed(1)}%
                      </div>
                      <div className="metric-label">Positive Gain</div>
                    </div>
                  ) : (
                    <div className="card-kpi rose" style={{ background: 'rgba(255, 77, 109, 0.1)'}}>
                      <div className="card-header"><span className="card-title text-rose">Net Impact</span></div>
                      <div className="metric-value text-rose" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <TrendingDown /> {((simData.expected_sales / baseData.expected_sales - 1) * 100).toFixed(1)}%
                      </div>
                      <div className="metric-label">Demand Drop</div>
                    </div>
                  )}
                </div>
                
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Comparative Trajectory</span>
                  </div>
                  <div className="chart-wrap-tall">
                    <Bar 
                      data={getChartData()} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: { mode: 'index', intersect: false },
                        scales: {
                          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9898b0' } },
                          x: { grid: { display: false }, ticks: { color: '#9898b0', maxRotation: 45, minRotation: 45 } }
                        }
                      }} 
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          
        </div>
  )
}
