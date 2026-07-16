import { useState } from 'react'
import { Settings2, Save, Cpu, Calendar, Palette, Download, Percent } from 'lucide-react'

export default function Settings() {
  const [model, setModel] = useState('lightgbm')
  const [horizon, setHorizon] = useState('30')
  const [theme, setTheme] = useState('system')
  const [exportFormat, setExportFormat] = useState('csv')
  const [confidence, setConfidence] = useState('95')

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Configure application preferences and model parameters.</p>
        </div>
        <div>
           <div className="btn btn-blue">
             <Save size={16} /> Save Changes
           </div>
        </div>
      </div>
      <div className="page-body">
        
        <div className="grid-2">
           
           <div className="card">
              <div className="card-header">
                 <span className="card-title"><Cpu size={16} /> Model Settings</span>
              </div>
              <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                 
                 <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Default Inference Model</label>
                    <select className="select" value={model} onChange={e => setModel(e.target.value)} style={{ width: '100%' }}>
                       <option value="lightgbm">LightGBM (Recommended for accuracy)</option>
                       <option value="xgboost">XGBoost (Recommended for stability)</option>
                       <option value="rf">Random Forest (Baseline)</option>
                    </select>
                    <p style={{ fontSize: 11, color: 'var(--tx-3)', marginTop: 4 }}>This model will be used by default across the dashboard.</p>
                 </div>

                 <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8 }}><Percent size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> Confidence Interval Level</label>
                    <select className="select" value={confidence} onChange={e => setConfidence(e.target.value)} style={{ width: '100%' }}>
                       <option value="90">90% (Narrower intervals)</option>
                       <option value="95">95% (Standard)</option>
                       <option value="99">99% (Wider intervals)</option>
                    </select>
                 </div>

                 <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8 }}><Calendar size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> Default Forecast Horizon</label>
                    <select className="select" value={horizon} onChange={e => setHorizon(e.target.value)} style={{ width: '100%' }}>
                       <option value="7">7 Days</option>
                       <option value="14">14 Days</option>
                       <option value="30">30 Days</option>
                       <option value="90">90 Days</option>
                    </select>
                 </div>

              </div>
           </div>

           <div className="card">
              <div className="card-header">
                 <span className="card-title"><Settings2 size={16} /> Application Preferences</span>
              </div>
              <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                 
                 <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8 }}><Palette size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> Theme</label>
                    <select className="select" value={theme} onChange={e => setTheme(e.target.value)} style={{ width: '100%' }}>
                       <option value="system">System Default</option>
                       <option value="light">Light Mode</option>
                       <option value="dark">Dark Mode</option>
                    </select>
                 </div>

                 <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8 }}><Download size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> Default Export Format</label>
                    <select className="select" value={exportFormat} onChange={e => setExportFormat(e.target.value)} style={{ width: '100%' }}>
                       <option value="csv">CSV (Spreadsheet)</option>
                       <option value="excel">Excel (.xlsx)</option>
                       <option value="json">JSON (API format)</option>
                    </select>
                 </div>

              </div>
           </div>

        </div>
        
      </div>
    </>
  )
}
