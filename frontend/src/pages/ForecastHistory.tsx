import { History, TrendingUp } from 'lucide-react'

const TIMELINE_DATA = [
  { date: 'July 15, 2026', target: 'Store 1 - Item 12', forecast: 62, actual: null, error: null, status: 'Pending Actuals' },
  { date: 'July 14, 2026', target: 'Store 1 - Item 12', forecast: 58, actual: 61, error: 4.9, status: 'Completed' },
  { date: 'July 13, 2026', target: 'Store 1 - Item 12', forecast: 55, actual: 52, error: 5.7, status: 'Completed' },
  { date: 'July 12, 2026', target: 'Store 1 - Item 12', forecast: 50, actual: 49, error: 2.0, status: 'Completed' },
  { date: 'July 11, 2026', target: 'Store 1 - Item 12', forecast: 65, actual: 70, error: 7.1, status: 'Completed' },
];

export default function ForecastHistory() {
  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Forecast Timeline</h1>
          <p className="page-subtitle">Track historical forecast accuracy against actual ground-truth demand.</p>
        </div>
        <div>
          <select className="select" style={{ width: 200 }}>
             <option>Store 1 - Item 12</option>
             <option>Store 4 - Item 8</option>
          </select>
        </div>
      </div>
      
      <div className="page-body">
        
        <div className="card">
            <div className="card-header"><span className="card-title"><History size={16}/> Forecast vs Actuals Timeline</span></div>
            <div style={{ padding: '0 16px 16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                   {TIMELINE_DATA.map((item, idx) => (
                      <div key={idx} style={{ 
                         display: 'flex', 
                         alignItems: 'center', 
                         gap: 24, 
                         padding: 16, 
                         background: 'var(--surface-3)', 
                         borderRadius: 8, 
                         border: '1px solid var(--border)' 
                      }}>
                         <div style={{ minWidth: 120 }}>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>{item.date}</div>
                            <div style={{ fontSize: 11, color: 'var(--tx-3)', marginTop: 2 }}>{item.target}</div>
                         </div>
                         
                         <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 32 }}>
                            <div>
                               <div style={{ fontSize: 12, color: 'var(--tx-3)', marginBottom: 4 }}>Forecast</div>
                               <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--blue)' }}>{item.forecast}</div>
                            </div>
                            
                            <div>
                               <div style={{ fontSize: 12, color: 'var(--tx-3)', marginBottom: 4 }}>Actual</div>
                               <div style={{ fontSize: 20, fontWeight: 700, color: item.actual ? 'var(--tx-1)' : 'var(--tx-3)' }}>
                                  {item.actual || '--'}
                               </div>
                            </div>
                            
                            <div>
                               <div style={{ fontSize: 12, color: 'var(--tx-3)', marginBottom: 4 }}>Error MAPE</div>
                               <div style={{ 
                                  fontSize: 18, 
                                  fontWeight: 600, 
                                  color: item.error === null ? 'var(--tx-3)' : (item.error < 5 ? 'var(--green)' : 'var(--amber)') 
                               }}>
                                  {item.error !== null ? `${item.error}%` : '--'}
                               </div>
                            </div>
                         </div>
                         
                         <div>
                            {item.status === 'Completed' ? (
                               <span className="badge green">Completed</span>
                            ) : (
                               <span className="badge amber">Pending Actuals</span>
                            )}
                         </div>
                      </div>
                   ))}
                </div>
            </div>
        </div>
      </div>
    </>
  )
}
