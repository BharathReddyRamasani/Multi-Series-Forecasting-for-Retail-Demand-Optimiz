import { useEffect, useState } from 'react'
import { Settings2, Save, Cpu, Calendar, Palette, Download, Percent } from 'lucide-react'
import { toast } from 'react-hot-toast'

const STORAGE_KEY = 'demandai_settings'

export interface AppSettings {
  model: string
  horizon: string
  confidence: string
  theme: string
  exportFormat: string
}

const DEFAULTS: AppSettings = {
  model: 'lightgbm',
  horizon: '30',
  confidence: '95',
  theme: 'system',
  exportFormat: 'csv',
}

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    /* ignore corrupt storage */
  }
  return DEFAULTS
}

function applyTheme(theme: string) {
  const root = document.documentElement
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
  } else {
    root.setAttribute('data-theme', theme)
  }
}

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings)
  const [saved, setSaved] = useState(true)

  // Keep the document theme in sync with the current selection.
  useEffect(() => {
    applyTheme(settings.theme)
  }, [settings.theme])

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
      applyTheme(settings.theme)
      setSaved(true)
      toast.success('Settings saved')
    } catch {
      toast.error('Failed to save settings')
    }
  }

  const handleReset = () => {
    setSettings(DEFAULTS)
    setSaved(false)
  }

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Configure application preferences and model parameters.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={handleReset}>
            Reset
          </button>
          <button className="btn btn-blue" onClick={handleSave}>
            <Save size={16} /> Save Changes
          </button>
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
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
                  Default Inference Model
                </label>
                <select
                  className="select"
                  value={settings.model}
                  onChange={(e) => update('model', e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="lightgbm">LightGBM (Recommended for accuracy)</option>
                  <option value="xgboost">XGBoost (Recommended for stability)</option>
                  <option value="randomforest">Random Forest (Baseline)</option>
                </select>
                <p style={{ fontSize: 11, color: 'var(--tx-3)', marginTop: 4 }}>
                  This model will be used by default across the dashboard.
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
                  <Percent size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> Confidence Interval Level
                </label>
                <select
                  className="select"
                  value={settings.confidence}
                  onChange={(e) => update('confidence', e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="90">90% (Narrower intervals)</option>
                  <option value="95">95% (Standard)</option>
                  <option value="99">99% (Wider intervals)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
                  <Calendar size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> Default Forecast Horizon
                </label>
                <select
                  className="select"
                  value={settings.horizon}
                  onChange={(e) => update('horizon', e.target.value)}
                  style={{ width: '100%' }}
                >
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
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
                  <Palette size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> Theme
                </label>
                <select
                  className="select"
                  value={settings.theme}
                  onChange={(e) => update('theme', e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="system">System Default</option>
                  <option value="light">Light Mode</option>
                  <option value="dark">Dark Mode</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
                  <Download size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> Default Export Format
                </label>
                <select
                  className="select"
                  value={settings.exportFormat}
                  onChange={(e) => update('exportFormat', e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="csv">CSV (Spreadsheet)</option>
                  <option value="json">JSON (API format)</option>
                </select>
                <p style={{ fontSize: 11, color: 'var(--tx-3)', marginTop: 4 }}>
                  Used when downloading reports from the Model Performance page.
                </p>
              </div>
            </div>
          </div>
        </div>

        {!saved && (
          <p style={{ fontSize: 12, color: 'var(--tx-3)', marginTop: 14, textAlign: 'right' }}>
            You have unsaved changes.
          </p>
        )}
      </div>
    </>
  )
}
