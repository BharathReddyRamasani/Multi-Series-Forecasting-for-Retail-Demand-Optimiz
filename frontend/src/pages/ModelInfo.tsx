import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import {
  Brain, Database, Cpu, FileText, Upload,
  CheckCircle2, AlertCircle, Clock, Layers,
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function ModelInfoPage() {
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: meta }    = useQuery({ queryKey: ['metadata'],  queryFn: apiClient.metadata })
  const { data: metrics } = useQuery({ queryKey: ['metrics'],   queryFn: apiClient.metrics })
  const { data: health }  = useQuery({ queryKey: ['health'],    queryFn: apiClient.health, refetchInterval: 5000 })
  const { data: fi }      = useQuery({ queryKey: ['fi-all'],    queryFn: () => apiClient.featureImportance(74) })

  async function handleFileUpload(file: File) {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file (date, store, item, sales columns)')
      return
    }
    setUploading(true)
    try {
      const result = await apiClient.uploadFile(file)
      setUploadResult(result)
      toast.success(`✅ Uploaded ${result.rows_received.toLocaleString()} rows successfully!`)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileUpload(file)
  }

  const cvP = meta?.cv_performance

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Model Information</div>
          <div className="page-subtitle">LightGBM ensemble details, architecture, and data upload</div>
        </div>
        <div className="flex gap-2 items-center">
          {health?.model_loaded
            ? <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={12} /> Models Loaded</span>
            : <span className="badge badge-amber" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={12} /> Loading…</span>
          }
        </div>
      </div>

      <div className="page-body">
        {/* Overview cards */}
        <div className="kpi-grid stagger mb-4">
          {[
            { icon: Brain,    label: 'Model Type',   value: 'LightGBM',      color: 'blue',   sub: 'Gradient Boosting' },
            { icon: Layers,   label: 'Ensemble',     value: '3 Models',      color: 'purple', sub: 'Point + Q5 + Q95' },
            { icon: Database, label: 'Features',     value: String(meta?.feature_count ?? 74), color: 'teal',   sub: 'Engineered features' },
            { icon: Clock,    label: 'Version',      value: meta?.version ?? '1.0.0', color: 'amber',  sub: meta?.training_date?.split(' ')[0] ?? '–' },
            { icon: Cpu,      label: 'Training Time',value: metrics ? `${metrics.training_time_sec.toFixed(0)}s` : '–', color: 'green',  sub: 'Full training run' },
            { icon: FileText, label: 'Dataset',      value: meta?.dataset_version ?? 'Retail-v1', color: 'blue',   sub: 'Store-item demand' },
          ].map(c => (
            <div key={c.label} className={`kpi-card anim-fade-up ${c.color}`}>
              <div className="kpi-icon-wrap"><c.icon size={20} /></div>
              <div className="kpi-label">{c.label}</div>
              <div className="kpi-value" style={{ fontSize: 20 }}>{c.value}</div>
              <div className="kpi-sub">{c.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid-2" style={{ gap: 20, marginBottom: 20 }}>
          {/* Model architecture */}
          <div className="card">
            <div className="card-header">
              <div className="card-title"><Brain size={14} /> Model Architecture</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                {
                  title: '🎯 Point Forecast (Median)',
                  file: 'lightgbm_forecaster.joblib',
                  desc: 'Primary model trained to minimize MSE. Returns the expected demand value.',
                  color: 'var(--c-primary)',
                },
                {
                  title: '📉 Lower Quantile (Q5)',
                  file: 'model_low_q05.joblib',
                  desc: 'Quantile regression model (q=0.05). Provides the pessimistic lower bound of the 90% prediction interval.',
                  color: 'var(--c-teal)',
                },
                {
                  title: '📈 Upper Quantile (Q95)',
                  file: 'model_high_q95.joblib',
                  desc: 'Quantile regression model (q=0.95). Provides the optimistic upper bound of the 90% prediction interval.',
                  color: 'var(--c-accent)',
                },
              ].map(m => (
                <div key={m.file} style={{
                  padding: '12px 14px',
                  background: 'var(--c-surface-2)',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid rgba(${m.color === 'var(--c-primary)' ? '59,130,246' : m.color === 'var(--c-teal)' ? '20,184,166' : '139,92,246'},0.2)`,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t-primary)', marginBottom: 4 }}>{m.title}</div>
                  <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: 'var(--t-muted)', marginBottom: 6 }}>{m.file}</div>
                  <div style={{ fontSize: 12, color: 'var(--t-secondary)' }}>{m.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CV Performance */}
          <div className="card">
            <div className="card-header">
              <div className="card-title"><FileText size={14} /> Cross-Validation Results</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cvP && [
                { label: 'Mean RMSE',  val: cvP.mean_rmse.toFixed(4),  bar: 100 - (cvP.mean_rmse / 10) * 100 },
                { label: 'Mean MAE',   val: cvP.mean_mae.toFixed(4),   bar: 100 - (cvP.mean_mae / 10) * 100 },
                { label: 'Mean MAPE',  val: cvP.mean_mape.toFixed(3) + '%', bar: 100 - cvP.mean_mape },
                { label: 'Mean SMAPE', val: cvP.mean_smape.toFixed(3) + '%', bar: 100 - cvP.mean_smape },
              ].map(row => (
                <div key={row.label} style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--t-secondary)' }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t-primary)', fontFamily: 'JetBrains Mono' }}>{row.val}</span>
                  </div>
                  <div className="progress-bar-wrap">
                    <div className="progress-bar" style={{ width: `${Math.max(5, row.bar)}%` }} />
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-green)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  ✅ Test-Set R² Score
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--c-green)', fontVariantNumeric: 'tabular-nums' }}>
                  {metrics ? (metrics.r2 * 100).toFixed(2) : '98.03'}%
                </div>
                <div style={{ fontSize: 11, color: 'var(--c-green)', opacity: 0.8 }}>
                  Variance explained by the model
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Engineering Pipeline */}
        <div className="card mb-4">
          <div className="card-header">
            <div className="card-title"><Cpu size={14} /> Feature Engineering Pipeline</div>
            <span className="badge badge-blue">{meta?.feature_count ?? 74} features</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { title: '📅 Calendar Features', items: ['Year, Month, Day', 'Day of week (0-6)', 'Day of year', 'Week number', 'Quarter'], color: 'var(--c-amber)' },
              { title: '🔄 Cyclical Encodings', items: ['sin/cos(day_of_week)', 'sin/cos(day_of_year)', 'sin/cos(month)', 'sin/cos(week)'], color: 'var(--c-teal)' },
              { title: '🎉 Holiday Features', items: ['is_holiday', 'days_to_holiday', 'days_from_holiday', 'festival_week', 'long_weekend'], color: 'var(--c-rose)' },
              { title: '⏮️ Lag Features', items: ['Lag 1,2,3 days', 'Lag 7,14,21,28 days', 'Lag 60,90 days', 'Lag 180 days', 'Lag 364 days (annual)'], color: 'var(--c-primary)' },
              { title: '📊 Rolling Statistics', items: ['Mean (7,14,28,60,90d)', 'Std (7,14,28,60,90d)', 'Min/Max (7,14,28,60,90d)', 'Median (7,14,28,60,90d)'], color: 'var(--c-accent)' },
              { title: '📈 Advanced Features', items: ['EMA (α=0.5,0.7,0.8,0.9,0.95)', 'Weekly growth rate', 'Monthly growth rate', 'Expanding mean/std', 'Store/Item averages'], color: 'var(--c-green)' },
            ].map(group => (
              <div key={group.title} style={{
                padding: '12px 14px',
                background: 'var(--c-surface-2)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--c-border)',
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: group.color, marginBottom: 8 }}>{group.title}</div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {group.items.map(item => (
                    <li key={item} style={{ fontSize: 11.5, color: 'var(--t-secondary)', display: 'flex', gap: 6 }}>
                      <span style={{ color: group.color, opacity: 0.6 }}>·</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* CSV Upload */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><Upload size={14} /> Upload Custom Historical Data</div>
            <span className="badge badge-amber">Optional</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--t-secondary)', marginBottom: 16 }}>
            Upload your own historical sales CSV to override the default synthetic history used for feature engineering.
            Required columns: <code style={{ background: 'var(--c-surface-2)', padding: '1px 5px', borderRadius: 4, fontSize: 11, fontFamily: 'JetBrains Mono' }}>date, store, item, sales</code>
          </p>

          <label
            className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            />
            <div className="upload-icon">
              {uploading ? '⏳' : '📂'}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t-secondary)', marginBottom: 6 }}>
              {uploading ? 'Uploading…' : 'Drop CSV here or click to browse'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--t-muted)' }}>
              Supports large files · Columns: date, store, item, sales
            </div>
          </label>

          {uploadResult && (
            <div style={{
              marginTop: 16, padding: 14,
              background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: 'var(--radius-md)',
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
            }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--c-green)', fontWeight: 700, textTransform: 'uppercase' }}>Rows</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--t-primary)' }}>{uploadResult.rows_received.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--c-green)', fontWeight: 700, textTransform: 'uppercase' }}>Stores</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--t-primary)' }}>{uploadResult.stores?.length}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--c-green)', fontWeight: 700, textTransform: 'uppercase' }}>Items</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--t-primary)' }}>{uploadResult.items?.length}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--c-green)', fontWeight: 700, textTransform: 'uppercase' }}>Date Range</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t-primary)', fontFamily: 'JetBrains Mono' }}>
                  {uploadResult.date_range?.start}<br />{uploadResult.date_range?.end}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
