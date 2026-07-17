import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import { UploadCloud, CheckCircle2, AlertTriangle, Activity, Check, Database, Share2, Server, Cpu } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }
const fadeUp  = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } } }

export default function ModelOps() {
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: metrics, isLoading } = useQuery({ queryKey: ['model-ops'], queryFn: apiClient.modelSummary })


  const uploadMutation = useMutation({
    mutationFn: async (f: File) => await apiClient.uploadFile(f),
    onSuccess: (res) => {
      toast.success(res.message, { style: { background: 'var(--surface-3)', color: 'var(--tx-1)', border: '1px solid var(--border)' } })
      queryClient.invalidateQueries({ queryKey: ['stores-items'] })
      setFile(null)
    },
    onError: (err: any) => { toast.error(err?.response?.data?.detail ?? 'Upload failed') },
  })

  const handleUpload = () => { if (file) uploadMutation.mutate(file) }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped?.name.endsWith('.csv')) setFile(dropped)
    else toast.error('Please upload a CSV file')
  }

  if (isLoading) {
    return (
      <div className="loading-center" style={{ flexDirection: 'column', gap: 16 }}>
        <div className="spinner spinner-lg" style={{ borderTopColor: 'var(--green)' }} />
        <div style={{ color: 'var(--tx-3)', fontSize: 13, letterSpacing: '0.02em' }}>Fetching telemetry…</div>
      </div>
    )
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      <div className="page-header" style={{ padding: '18px 48px' }}>
        <div>
          <motion.div variants={fadeUp} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, var(--green) 0%, var(--teal) 100%)', display: 'grid', placeItems: 'center', boxShadow: '0 4px 14px rgba(0,217,126,0.3)', fontSize: 18, color: 'var(--bg)' }}>
              <Server size={20} />
            </div>
            <div>
              <div className="page-title">Model Operations</div>
              <div className="page-subtitle">Production telemetry, feature importance, and data ingestion</div>
            </div>
          </motion.div>
        </div>
        <motion.div variants={fadeUp}>
          <span className="badge badge-green" style={{ padding: '6px 12px', fontSize: 13, background: 'rgba(0,217,126,0.1)' }}>
            <CheckCircle2 size={14} /> AI Engines Online
          </span>
        </motion.div>
      </div>

      <div className="page-body" style={{ padding: '36px 48px' }}>

        {/* ── KPI Row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 32 }}>

          <motion.div variants={fadeUp} className="card-kpi green" style={{ padding: '24px 28px' }}>
            <div style={{ position: 'absolute', right: -12, top: -8, opacity: 0.05, transform: 'scale(3.5)' }}><CheckCircle2 size={40} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center' }}><CheckCircle2 size={18} /></div>
              <span className="metric-trend up" style={{ fontSize: 12 }}>Target &gt; 0.95</span>
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 38, fontWeight: 700, lineHeight: 1, marginBottom: 8, color: 'var(--tx-1)', letterSpacing: '-0.02em' }}>
              {(metrics?.metrics.r2 ?? 0).toFixed(4)}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Test R² Score</div>
            <div style={{ fontSize: 12, color: 'var(--tx-3)' }}>Coefficient of determination</div>
          </motion.div>

          <motion.div variants={fadeUp} className="card-kpi amber" style={{ padding: '24px 28px' }}>
            <div style={{ position: 'absolute', right: -12, top: -8, opacity: 0.05, transform: 'scale(3.5)' }}><AlertTriangle size={40} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center' }}><AlertTriangle size={18} /></div>
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 38, fontWeight: 700, lineHeight: 1, marginBottom: 8, color: 'var(--tx-1)', letterSpacing: '-0.02em' }}>
              {(metrics?.metrics.rmse ?? 0).toFixed(4)}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Test RMSE</div>
            <div style={{ fontSize: 12, color: 'var(--tx-3)' }}>Root Mean Squared Error</div>
          </motion.div>

          <motion.div variants={fadeUp} className="card-kpi blue" style={{ padding: '24px 28px' }}>
            <div style={{ position: 'absolute', right: -12, top: -8, opacity: 0.05, transform: 'scale(3.5)' }}><Activity size={40} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center' }}><Activity size={18} /></div>
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 38, fontWeight: 700, lineHeight: 1, marginBottom: 8, color: 'var(--tx-1)', letterSpacing: '-0.02em' }}>
              {(metrics?.metrics.mae ?? 0).toFixed(4)}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Test MAE</div>
            <div style={{ fontSize: 12, color: 'var(--tx-3)' }}>Mean Absolute Error</div>
          </motion.div>

        </div>

        {/* ── Feature Importance + Sandbox ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

          {/* Feature Importance */}
          <motion.div variants={fadeUp} className="card" style={{ padding: 28 }}>
            <div className="card-header" style={{ marginBottom: 24 }}>
              <div>
                <div className="card-title" style={{ fontSize: 18 }}><Share2 size={18} /> Global Feature Importance</div>
                <div className="card-subtitle">Top 15 features across all stores (LightGBM baseline)</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 420, overflowY: 'auto', paddingRight: 8 }}>
              {metrics?.top_features?.slice(0, 15).map((feat, i) => {
                const maxImp = metrics.top_features[0]?.importance || 1
                const pct = (feat.importance / maxImp) * 100
                return (
                  <motion.div key={feat.feature} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.04 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{feat.feature}</span>
                      <span className="mono" style={{ fontSize: 12, color: 'var(--tx-2)', fontWeight: 600, flexShrink: 0 }}>{feat.importance.toFixed(2)}</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--surface-3)', borderRadius: 100, overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.2 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                        style={{ height: '100%', background: 'linear-gradient(90deg, var(--teal), var(--green))', borderRadius: 100 }}
                      />
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          {/* Sandbox Data Upload */}
          <motion.div variants={fadeUp} className="card" style={{ padding: 28 }}>
            <div className="card-header" style={{ marginBottom: 24 }}>
              <div>
                <div className="card-title" style={{ fontSize: 18 }}><Database size={18} /> Sandbox Data Injection</div>
                <div className="card-subtitle">Upload custom CSV data to simulate inference</div>
              </div>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? 'var(--blue)' : file ? 'var(--green-bdr)' : 'var(--border-hi)'}`,
                borderRadius: 'var(--r-xl)',
                padding: '48px 24px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                textAlign: 'center', cursor: 'pointer',
                background: isDragging ? 'var(--blue-glow)' : file ? 'rgba(0,217,126,0.05)' : 'var(--surface-3)',
                transition: 'all 250ms ease',
                marginBottom: 20,
                minHeight: 240,
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv"
                onChange={e => setFile(e.target.files?.[0] || null)}
                style={{ display: 'none' }}
              />

              <AnimatePresence mode="wait">
                {file ? (
                  <motion.div key="file" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--green-bg)', color: 'var(--green)', display: 'grid', placeItems: 'center', margin: '0 auto 16px', boxShadow: '0 0 20px rgba(0,217,126,0.2)' }}>
                      <Check size={24} strokeWidth={3} />
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--tx-1)', fontSize: 16, marginBottom: 4 }}>{file.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--tx-3)' }}>{(file.size / 1024).toFixed(1)} KB — ready to upload</div>
                  </motion.div>
                ) : (
                  <motion.div key="empty" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
                    <UploadCloud size={44} style={{ color: 'var(--tx-3)', marginBottom: 16 }} />
                    <div style={{ fontWeight: 700, color: 'var(--tx-1)', fontSize: 16, marginBottom: 8 }}>Drop CSV file here or click to browse</div>
                    <div style={{ fontSize: 13, color: 'var(--tx-3)' }}>Requires: date, store, item, sales</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              className="btn btn-blue w-full"
              style={{ padding: '14px', fontSize: 15, fontWeight: 600, letterSpacing: '0.02em', borderRadius: 'var(--r-lg)' }}
              disabled={!file || uploadMutation.isPending}
              onClick={handleUpload}
            >
              {uploadMutation.isPending
                ? <div className="spinner" style={{ width: 18, height: 18, borderTopColor: 'white' }} />
                : <><Cpu size={16} /> Inject Data to Engine</>
              }
            </button>

            {/* Required columns reference */}
            <div style={{ marginTop: 24, padding: '16px', background: 'var(--surface-0)', borderRadius: 'var(--r-lg)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--tx-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Expected Schema</div>
              <code style={{ fontSize: 13, fontFamily: 'JetBrains Mono, monospace', color: 'var(--blue-hi)', background: 'var(--blue-glass)', padding: '4px 8px', borderRadius: 6 }}>
                date, store, item, sales
              </code>
            </div>
          </motion.div>

        </div>

      </div>
    </motion.div>
  )
}

