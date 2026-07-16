import { FileText, FileSpreadsheet, Download } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import axios from 'axios'

export default function Reports() {
    const [generating, setGenerating] = useState(false)

    const handleGenerate = async (type: string) => {
        setGenerating(true)
        try {
            const { data } = await axios.get(`http://localhost:8000/api/reports/generate?type=${type}`)
            toast.success(data.message)
            setTimeout(() => {
                // In a real app this would trigger a file download
                console.log("Mock downloading:", data.url)
            }, 1000)
        } catch (e) {
            toast.error('Failed to generate report')
        } finally {
            setGenerating(false)
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
                        <div className="icon-box" style={{ background: 'var(--rose-bg)', color: 'var(--rose)', width: 64, height: 64, borderRadius: '16px' }}><FileText size={32}/></div>
                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 600 }}>PDF Executive Summary</h3>
                            <p className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>Comprehensive overview with charts and insights.</p>
                        </div>
                        <button className="btn btn-outline w-full" onClick={() => handleGenerate('pdf')} disabled={generating}>Generate PDF</button>
                    </div>
                    
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px', padding: '32px' }}>
                        <div className="icon-box" style={{ background: 'var(--green-bg)', color: 'var(--green)', width: 64, height: 64, borderRadius: '16px' }}><FileSpreadsheet size={32}/></div>
                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 600 }}>Excel Data Dump</h3>
                            <p className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>Raw data export for custom pivot tables.</p>
                        </div>
                        <button className="btn btn-outline w-full" onClick={() => handleGenerate('xlsx')} disabled={generating}>Generate Excel</button>
                    </div>
                    
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px', padding: '32px' }}>
                        <div className="icon-box" style={{ background: 'var(--blue-glass)', color: 'var(--blue)', width: 64, height: 64, borderRadius: '16px' }}><Download size={32}/></div>
                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 600 }}>CSV Export</h3>
                            <p className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>Lightweight data export for integrations.</p>
                        </div>
                        <button className="btn btn-outline w-full" onClick={() => handleGenerate('csv')} disabled={generating}>Generate CSV</button>
                    </div>
                </div>
            </div>
        </>
    )
}
