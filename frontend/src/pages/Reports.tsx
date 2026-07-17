import { FileText, FileSpreadsheet, Download } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { apiClient } from '../api/client'

export default function Reports() {
  const [generating, setGenerating] = useState<string | null>(null)

  const handleGenerate = async (type: 'csv' | 'json' | 'pdf' | 'xlsx') => {
    // Backend supports csv and json report exports.
    if (type === 'pdf' || type === 'xlsx') {
      toast.error(`${type.toUpperCase()} export is not supported yet. Use CSV or JSON.`)
      return
    }
    setGenerating(type)
    try {
      await apiClient.downloadReport(type)
      toast.success(`Downloaded ${type.toUpperCase()} report.`)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to generate report')
    } finally {
      setGenerating(null)
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Automated Reports</h1>
          <p className="page-subtitle">Generate presentation-ready reports for stakeholders.</p>
        </div>
      </div>
      <div className="page-body">
        <div className="grid-3">
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px', padding: '32px' }}>
            <div className="icon-box" style={{ background: 'var(--rose-bg)', color: 'var(--rose)', width: 64, height: 64, borderRadius: '16px' }}><FileText size={32} /></div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>JSON Report</h3>
              <p className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>Full model metrics and feature importances (API format).</p>
            </div>
            <button className="btn btn-outline w-full" onClick={() => handleGenerate('json')} disabled={generating === 'json'}>Generate JSON</button>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px', padding: '32px' }}>
            <div className="icon-box" style={{ background: 'var(--green-bg)', color: 'var(--green)', width: 64, height: 64, borderRadius: '16px' }}><FileSpreadsheet size={32} /></div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>Excel Data Dump</h3>
              <p className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>Raw data export for custom pivot tables.</p>
            </div>
            <button className="btn btn-outline w-full" onClick={() => handleGenerate('xlsx')} disabled={generating === 'xlsx'}>Generate Excel</button>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px', padding: '32px' }}>
            <div className="icon-box" style={{ background: 'var(--blue-glass)', color: 'var(--blue)', width: 64, height: 64, borderRadius: '16px' }}><Download size={32} /></div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>CSV Export</h3>
              <p className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>Lightweight data export for integrations.</p>
            </div>
            <button className="btn btn-outline w-full" onClick={() => handleGenerate('csv')} disabled={generating === 'csv'}>Generate CSV</button>
          </div>
        </div>
      </div>
    </>
  )
}
