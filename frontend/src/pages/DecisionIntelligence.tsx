import { useState } from 'react'
import { AlertTriangle, TrendingUp, Package, ShieldCheck, Zap } from 'lucide-react'
import DigitalTwin from './DigitalTwin'

export default function DecisionIntelligence() {
  const [activeTab, setActiveTab] = useState('insights')

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">Decision Intelligence</h1>
          <p className="page-subtitle">Executive summary and actionable insights.</p>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
           <button 
              className={`btn ${activeTab === 'insights' ? 'btn-blue' : 'btn-outline'}`}
              onClick={() => setActiveTab('insights')}
           >
              Executive Insights
           </button>
           <button 
              className={`btn ${activeTab === 'simulation' ? 'btn-blue' : 'btn-outline'}`}
              onClick={() => setActiveTab('simulation')}
           >
              What-If Analysis
           </button>
        </div>
      </div>
      <div className="page-body">
        
        {activeTab === 'insights' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
             {/* Today's Top Insights */}
             <div>
                <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Zap size={18} color="var(--blue)" /> Today's Top Insights</h3>
                <div className="grid-3">
                   <div className="card" style={{ borderLeft: '4px solid var(--rose)' }}>
                      <div className="card-header" style={{ borderBottom: 'none', paddingBottom: 0 }}><span className="card-title text-rose"><AlertTriangle size={16} /> Stores at Risk</span></div>
                      <div style={{ padding: '0 16px 16px' }}>
                         <p style={{ fontSize: 13, color: 'var(--tx-2)' }}>Store #4 and Store #7 are showing consecutive days of elevated stockout risks due to unexpected weekend demand spikes.</p>
                      </div>
                   </div>
                   <div className="card" style={{ borderLeft: '4px solid var(--amber)' }}>
                      <div className="card-header" style={{ borderBottom: 'none', paddingBottom: 0 }}><span className="card-title text-amber"><Package size={16} /> Inventory Alerts</span></div>
                      <div style={{ padding: '0 16px 16px' }}>
                         <p style={{ fontSize: 13, color: 'var(--tx-2)' }}>Item #12 (Organic Milk) is below safety stock in 3 out of 10 locations. Recommend triggering emergency replenishment.</p>
                      </div>
                   </div>
                   <div className="card" style={{ borderLeft: '4px solid var(--green)' }}>
                      <div className="card-header" style={{ borderBottom: 'none', paddingBottom: 0 }}><span className="card-title text-green"><TrendingUp size={16} /> Demand Spikes</span></div>
                      <div style={{ padding: '0 16px 16px' }}>
                         <p style={{ fontSize: 13, color: 'var(--tx-2)' }}>Store #1 is projected to see a +22% spike in Electronics sales over the upcoming holiday weekend.</p>
                      </div>
                   </div>
                </div>
             </div>

             {/* Recommended Actions */}
             <div>
                <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><ShieldCheck size={18} color="var(--green)" /> Recommended Actions</h3>
                <div className="card">
                   <div className="table-responsive">
                     <table className="table">
                        <thead>
                           <tr>
                              <th>Priority</th>
                              <th>Action Type</th>
                              <th>Details</th>
                              <th>Forecast Reliability</th>
                              <th>Impact</th>
                           </tr>
                        </thead>
                        <tbody>
                           <tr>
                              <td><span className="badge rose">High</span></td>
                              <td>Inventory Transfer</td>
                              <td>Move 500 units of Item #12 from Store #7 to Store #4</td>
                              <td>High</td>
                              <td style={{ color: 'var(--green)' }}>Prevent $4,500 lost sales</td>
                           </tr>
                           <tr>
                              <td><span className="badge amber">Medium</span></td>
                              <td>Price Adjustment</td>
                              <td>Discount Item #8 by 10% in Store #2</td>
                              <td>Medium</td>
                              <td style={{ color: 'var(--green)' }}>Clear overstock</td>
                           </tr>
                           <tr>
                              <td><span className="badge blue">Low</span></td>
                              <td>Staffing</td>
                              <td>Increase weekend staff at Store #1</td>
                              <td>High</td>
                              <td style={{ color: 'var(--green)' }}>Handle demand spike</td>
                           </tr>
                        </tbody>
                     </table>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'simulation' && (
           <DigitalTwin />
        )}
      </div>
    </>
  )
}
