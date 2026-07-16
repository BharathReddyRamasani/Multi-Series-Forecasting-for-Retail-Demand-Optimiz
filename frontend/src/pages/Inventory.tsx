import { AlertTriangle, Package, ShieldCheck, Activity } from 'lucide-react'

const INVENTORY_DATA = [
  { item: 'Item #12', store: 'Store #4', current: 120, forecast: 500, safety: 150, recommended: 530, risk: 'Stockout Risk', reorder: 'Today' },
  { item: 'Item #8', store: 'Store #1', current: 400, forecast: 300, safety: 100, recommended: 0, risk: 'Healthy', reorder: 'N/A' },
  { item: 'Item #4', store: 'Store #7', current: 800, forecast: 200, safety: 100, recommended: 0, risk: 'Overstock', reorder: 'N/A' },
  { item: 'Item #15', store: 'Store #1', current: 50, forecast: 120, safety: 40, recommended: 110, risk: 'Low Stock', reorder: 'Tomorrow' },
  { item: 'Item #2', store: 'Store #4', current: 200, forecast: 210, safety: 60, recommended: 70, risk: 'Healthy', reorder: 'In 3 days' }
];

export default function Inventory() {
  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Inventory Management</h1>
          <p className="page-subtitle">Monitor stock levels, safety stock, and reorder recommendations across the network.</p>
        </div>
        <div>
           <div className="btn btn-blue">Export Replenishment Plan</div>
        </div>
      </div>
      <div className="page-body">
        
        {/* KPI Grid */}
        <div className="grid-4 mb-4">
          <div className="card-kpi blue">
            <div className="card-header"><span className="card-title"><Package size={16}/> Network Stock</span></div>
            <div className="metric-value">124,500</div>
            <div className="metric-label">Total Units on Hand</div>
          </div>
          <div className="card-kpi rose">
            <div className="card-header"><span className="card-title"><AlertTriangle size={16}/> Stockout Risks</span></div>
            <div className="metric-value">14</div>
            <div className="metric-label">Items needing immediate reorder</div>
          </div>
          <div className="card-kpi green">
            <div className="card-header"><span className="card-title"><ShieldCheck size={16}/> Healthy Inventory</span></div>
            <div className="metric-value">82%</div>
            <div className="metric-label">Of total SKUs</div>
          </div>
          <div className="card-kpi amber">
            <div className="card-header"><span className="card-title"><Activity size={16}/> Overstocked</span></div>
            <div className="metric-value">4%</div>
            <div className="metric-label">Capital tied up</div>
          </div>
        </div>

        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="card-title">Network Inventory & Replenishment Recommendations</span>
            <div style={{ display: 'flex', gap: 8 }}>
               <input type="text" placeholder="Search SKU or Store..." className="input" style={{ width: 200 }} />
               <select className="select">
                 <option>All Risk Levels</option>
                 <option>Stockout Risk</option>
                 <option>Healthy</option>
                 <option>Overstock</option>
               </select>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Store</th>
                  <th>Current Stock</th>
                  <th>Forecast (Lead Time)</th>
                  <th>Safety Stock</th>
                  <th>Risk Level</th>
                  <th>Recommended Order</th>
                  <th>Reorder Date</th>
                </tr>
              </thead>
              <tbody>
                {INVENTORY_DATA.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{fontWeight: 500}}>{row.item}</td>
                    <td>{row.store}</td>
                    <td>{row.current}</td>
                    <td>{row.forecast}</td>
                    <td>{row.safety}</td>
                    <td>
                      {row.risk === 'Stockout Risk' && <span className="badge rose">{row.risk}</span>}
                      {row.risk === 'Low Stock' && <span className="badge amber">{row.risk}</span>}
                      {row.risk === 'Healthy' && <span className="badge green">{row.risk}</span>}
                      {row.risk === 'Overstock' && <span className="badge blue">{row.risk}</span>}
                    </td>
                    <td style={{ fontWeight: 600, color: row.recommended > 0 ? 'var(--blue)' : 'var(--tx-2)' }}>
                      {row.recommended > 0 ? `+${row.recommended}` : '-'}
                    </td>
                    <td style={{ color: row.reorder === 'Today' ? 'var(--rose)' : 'inherit' }}>{row.reorder}</td>
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
