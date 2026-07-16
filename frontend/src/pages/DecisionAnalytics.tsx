
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Package, AlertTriangle, CheckCircle2, ArrowRight, ShoppingCart, Zap, Boxes } from 'lucide-react'
import { motion, animate } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }
const fadeUp  = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } } }

function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const controls = animate(0, value, {
      duration: 1.2, ease: [0.16, 1, 0.3, 1],
      onUpdate(v) { node.textContent = Math.round(v).toString() }
    })
    return () => controls.stop()
  }, [value])
  return <span ref={ref}>0</span>
}

export default function DecisionAnalytics() {
  const { globalStoreId } = useAuth()
  const [horizon, setHorizon] = useState(7)

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['decision-analytics', globalStoreId, horizon],
    queryFn: () => apiClient.getStoreInventory(globalStoreId, horizon),
  })

  if (isLoading) {
    return (
      <div className="loading-center" style={{ flexDirection: 'column', gap: 16 }}>
        <div className="spinner spinner-lg" />
        <div style={{ color: 'var(--tx-3)', fontSize: 13, letterSpacing: '0.02em' }}>Loading intelligence…</div>
      </div>
    )
  }

  const stockouts  = analytics?.items.filter(i => i.risk_status === 'Stockout Risk') || []
  const overstocks = analytics?.items.filter(i => i.risk_status === 'Overstock') || []
  const healthy    = analytics?.items.filter(i => i.risk_status === 'Healthy') || []
  const totalItems = analytics?.items.length || 1
  const healthPct  = Math.round((healthy.length / totalItems) * 100)

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* Page header */}
      <div className="page-header" style={{ padding: '18px 48px' }}>
        <div>
          <motion.div variants={fadeUp} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, var(--teal) 0%, var(--blue) 100%)', display: 'grid', placeItems: 'center', boxShadow: '0 4px 14px rgba(0,200,212,0.3)', fontSize: 18 }}>
              🎯
            </div>
            <div>
              <div className="page-title">Decision Analytics</div>
              <div className="page-subtitle">AI-driven inventory optimization and reorder recommendations</div>
            </div>
          </motion.div>
        </div>

        <motion.div variants={fadeUp}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface-3)', padding: '6px 6px 6px 14px', borderRadius: 'var(--r-full)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Horizon</span>
            <select
              className="select"
              value={horizon}
              onChange={e => setHorizon(Number(e.target.value))}
              style={{ width: 140, background: 'var(--surface-2)', borderRadius: 'var(--r-full)', padding: '6px 12px', fontSize: 12, border: 'none', boxShadow: 'var(--shadow-sm)' }}
            >
              <option value={7}>7 Days (Tactical)</option>
              <option value={14}>14 Days (Standard)</option>
              <option value={30}>30 Days (Strategic)</option>
            </select>
          </div>
        </motion.div>
      </div>

      <div className="page-body" style={{ padding: '36px 48px' }}>

        {/* ── KPI Row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 32 }}>

          <motion.div variants={fadeUp} className="card-kpi rose" style={{ padding: '24px 28px' }}>
            <div style={{ position: 'absolute', right: -12, top: -8, opacity: 0.05, transform: 'scale(3.5)' }}><AlertTriangle size={40} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center' }}><AlertTriangle size={18} /></div>
              {stockouts.length > 0 && <span className="metric-trend down">Action Required</span>}
            </div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 34, fontWeight: 800, lineHeight: 1, marginBottom: 8 }}><AnimatedNumber value={stockouts.length} /></div>
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Stockout Risks</div>
            <div style={{ fontSize: 12, color: 'var(--tx-3)' }}>Depleting within {horizon}d</div>
          </motion.div>

          <motion.div variants={fadeUp} className="card-kpi purple" style={{ padding: '24px 28px' }}>
            <div style={{ position: 'absolute', right: -12, top: -8, opacity: 0.05, transform: 'scale(3.5)' }}><Boxes size={40} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center' }}><Boxes size={18} /></div>
              {overstocks.length > 0 && <span className="metric-trend up" style={{ background: 'var(--purple-bg)', color: 'var(--purple)', borderColor: 'var(--purple-bdr)' }}>Capital Risk</span>}
            </div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 34, fontWeight: 800, lineHeight: 1, marginBottom: 8 }}><AnimatedNumber value={overstocks.length} /></div>
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Overstock Warnings</div>
            <div style={{ fontSize: 12, color: 'var(--tx-3)' }}>Tying up liquidity</div>
          </motion.div>

          <motion.div variants={fadeUp} className="card-kpi green" style={{ padding: '24px 28px' }}>
            <div style={{ position: 'absolute', right: -12, top: -8, opacity: 0.05, transform: 'scale(3.5)' }}><CheckCircle2 size={40} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center' }}><CheckCircle2 size={18} /></div>
            </div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 34, fontWeight: 800, lineHeight: 1, marginBottom: 8 }}><AnimatedNumber value={healthy.length} /></div>
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Healthy SKUs</div>
            <div style={{ fontSize: 12, color: 'var(--tx-3)' }}>Optimal levels maintained</div>
          </motion.div>
          
          <motion.div variants={fadeUp} className="card-kpi blue" style={{ padding: '24px 28px' }}>
            <div style={{ position: 'absolute', right: -12, top: -8, opacity: 0.05, transform: 'scale(3.5)' }}><Zap size={40} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center' }}><Zap size={18} /></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 34, fontWeight: 800, lineHeight: 1 }}><AnimatedNumber value={healthPct} /></div>
              <span style={{ fontSize: 18, fontWeight: 700 }}>%</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Portfolio Health</div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden', marginTop: 10 }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${healthPct}%` }} transition={{ duration: 1 }} style={{ height: '100%', background: 'white', borderRadius: 4 }} />
            </div>
          </motion.div>

        </div>

        {/* ── Action Center Table ── */}
        <motion.div variants={fadeUp} className="card" style={{ padding: 28 }}>
          <div className="card-header" style={{ marginBottom: 24 }}>
            <div>
              <div className="card-title" style={{ fontSize: 18 }}><ShoppingCart size={18} /> Action Center</div>
              <div className="card-subtitle">AI-recommended reorder quantities — sorted by urgency for {horizon}d horizon</div>
            </div>
            <button className="btn btn-blue">
              <ShoppingCart size={15} /> Bulk Reorder Selected
            </button>
          </div>

          <div className="table-wrap" style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-xl)' }}>
            <table>
              <thead style={{ background: 'var(--surface-2)' }}>
                <tr>
                  <th style={{ width: 40 }}>
                    <input type="checkbox" style={{ accentColor: 'var(--blue)' }} />
                  </th>
                  <th>SKU</th>
                  <th>Risk Status</th>
                  <th>Current Stock</th>
                  <th>Forecast ({horizon}d)</th>
                  <th>Safety Stock</th>
                  <th>AI Rec</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {analytics?.items.map((item, i) => {
                  const isStockout  = item.risk_status === 'Stockout Risk'
                  const isOverstock = item.risk_status === 'Overstock'
                  return (
                    <motion.tr key={item.item_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 + i * 0.04 }}>
                      <td><input type="checkbox" style={{ accentColor: 'var(--blue)' }} /></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface-3)', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, color: 'var(--tx-2)' }}>
                            {item.item_id}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--tx-1)' }}>{item.name}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {isStockout && <span className="badge badge-rose" style={{ padding: '5px 10px' }}><AlertTriangle size={12}/> Stockout Risk</span>}
                        {isOverstock && <span className="badge badge-purple" style={{ padding: '5px 10px' }}><Boxes size={12}/> Overstock</span>}
                        {!isStockout && !isOverstock && <span className="badge badge-green" style={{ padding: '5px 10px' }}><CheckCircle2 size={12}/> Healthy</span>}
                      </td>
                      <td>
                        <span className="mono" style={{ fontSize: 14 }}>{item.current_stock.toLocaleString()}</span>
                      </td>
                      <td>
                        <span className="mono text-blue" style={{ fontWeight: 700, fontSize: 14 }}>{Math.round(item.forecast_30d).toLocaleString()}</span>
                      </td>
                      <td>
                        <span className="mono text-muted">{item.safety_stock.toLocaleString()}</span>
                      </td>
                      <td>
                        <span className="mono" style={{ fontWeight: 800, fontSize: 15, color: item.reorder_rec > 0 ? 'var(--tx-1)' : 'var(--tx-3)' }}>
                          {item.reorder_rec > 0 ? `+${item.reorder_rec.toLocaleString()}` : '—'}
                        </span>
                      </td>
                      <td>
                        {item.reorder_rec > 0 ? (
                          <button className={`btn btn-sm ${isStockout ? 'btn-danger' : 'btn-outline'}`} style={{ gap: 6, padding: '6px 14px' }}>
                            Order <ArrowRight size={13} />
                          </button>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--tx-3)', paddingLeft: 14 }}>No action</span>
                        )}
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

      </div>
    </motion.div>
  )
}
