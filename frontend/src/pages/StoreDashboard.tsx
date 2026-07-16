import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import { useAuth } from '../context/AuthContext'
import {
  DollarSign, Package, Activity,
  AlertTriangle, CheckCircle2, Zap, BarChart3, ShoppingCart,
  ArrowUpRight, ArrowDownRight, Clock, Target, Boxes, RefreshCw
} from 'lucide-react'
import { motion, animate } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Filler, Tooltip, BarElement
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, BarElement)

/* ── Animation presets ──────────────────────────────────────────────────── */
const spring = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const up     = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } } }
const scale  = { hidden: { opacity: 0, scale: 0.94 }, show: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } } }

/* ── Animated Number Counter ──────────────────────────────────────────────── */
function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0 }: { value: number; prefix?: string; suffix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const controls = animate(0, value, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(v) { node.textContent = prefix + v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix }
    })
    return () => controls.stop()
  }, [value])
  return <span ref={ref}>{prefix}0{suffix}</span>
}

/* ── Sparkline micro-chart ────────────────────────────────────────────────── */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const chartData = {
    labels: data.map((_, i) => i.toString()),
    datasets: [{
      data,
      borderColor: color,
      backgroundColor: color.includes('rgba') ? color.replace(/,\s*[\d.]+\)/, ', 0.08)') : 'rgba(255,255,255,0.08)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
    }]
  }
  const opts: any = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: { x: { display: false }, y: { display: false } },
    animation: { duration: 800 },
  }
  return <div style={{ height: 52, marginTop: 8 }}><Line data={chartData} options={opts} /></div>
}

/* ── Revenue bar chart ────────────────────────────────────────────────────── */
function RevenueBarChart({ items }: { items: { name: string; revenue: number }[] }) {
  const data = {
    labels: items.map(it => it.name.replace('Premium SKU ', 'SKU ')),
    datasets: [{
      data: items.map(it => it.revenue),
      backgroundColor: [
        'rgba(79,131,255,0.7)', 'rgba(0,217,126,0.7)', 'rgba(168,85,247,0.7)',
        'rgba(245,166,35,0.7)', 'rgba(0,200,212,0.7)',
      ],
      borderRadius: 6,
      borderSkipped: false,
    }]
  }
  const opts: any = {
    responsive: true, maintainAspectRatio: false, indexAxis: 'y' as const,
    plugins: { legend: { display: false }, tooltip: {
      backgroundColor: '#1e1e27', padding: 10, cornerRadius: 8,
      titleFont: { family: 'Inter', size: 12 }, bodyFont: { family: 'JetBrains Mono', size: 12 },
      callbacks: { label: (ctx: any) => ` $${ctx.parsed.x.toLocaleString(undefined, { maximumFractionDigits: 0 })}` }
    }},
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#5a5a72', font: { family: 'JetBrains Mono', size: 11 }, callback: (v: any) => `$${(v/1000).toFixed(0)}k` }, border: { display: false } },
      y: { grid: { display: false }, ticks: { color: '#9898b0', font: { family: 'Inter', size: 12 } }, border: { display: false } }
    }
  }
  return <div style={{ height: 200 }}><Bar data={data} options={opts} /></div>
}

/* ── KPI Card ─────────────────────────────────────────────────────────────── */
function KpiCard({ accent, icon: Icon, label, value, sub, trend, sparkData }: {
  accent: string; icon: any; label: string; value: React.ReactNode
  sub: string; trend?: { dir: 'up' | 'down'; text: string }; sparkData?: number[]
}) {
  return (
    <motion.div variants={scale} className={`card-kpi ${accent}`}
      style={{ padding: '24px 28px', position: 'relative', overflow: 'hidden' }}>
      {/* Large ghost icon in bg */}
      <div style={{ position: 'absolute', right: -12, top: -8, opacity: 0.05, transform: 'scale(3.5)', transformOrigin: 'top right' }}>
        <Icon size={40} />
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.08)', display: 'grid', placeItems: 'center', backdropFilter: 'blur(8px)' }}>
          <Icon size={18} />
        </div>
        {trend && (
          <span className={`metric-trend ${trend.dir}`} style={{ fontSize: 11 }}>
            {trend.dir === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trend.text}
          </span>
        )}
      </div>

      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 30, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 6 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 12, opacity: 0.5 }}>{sub}</div>

      {sparkData && <Sparkline data={sparkData} color="rgba(255,255,255,0.8)" />}
    </motion.div>
  )
}

/* ── Inventory Health Ring ────────────────────────────────────────────────── */
function HealthRing({ healthy, stockout, overstock }: { healthy: number; stockout: number; overstock: number }) {
  const total = healthy + stockout + overstock || 1
  const healthyPct = (healthy / total) * 100
  const stockoutPct = (stockout / total) * 100
  const overstockPct = (overstock / total) * 100

  const radius = 52
  const circumference = 2 * Math.PI * radius
  const gap = 3

  const segments = [
    { pct: healthyPct, color: '#00d97e', label: 'Healthy', count: healthy },
    { pct: stockoutPct, color: '#ff4d6d', label: 'Stockout', count: stockout },
    { pct: overstockPct, color: '#a855f7', label: 'Overstock', count: overstock },
  ]

  let offset = 0
  const arcs = segments.map(seg => {
    const dash = ((seg.pct / 100) * (circumference - gap * 3))
    const arc = { ...seg, dash, offset }
    offset += dash + gap
    return arc
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
      <div style={{ position: 'relative', width: 124, height: 124, flexShrink: 0 }}>
        <svg viewBox="0 0 124 124" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
          <circle cx="62" cy="62" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
          {arcs.map((arc, i) => arc.dash > 0 && (
            <motion.circle key={i} cx="62" cy="62" r={radius} fill="none"
              stroke={arc.color} strokeWidth="12"
              strokeDasharray={`${arc.dash} ${circumference}`}
              strokeDashoffset={-arc.offset}
              strokeLinecap="round"
              initial={{ strokeDasharray: '0 999' }}
              animate={{ strokeDasharray: `${arc.dash} ${circumference}` }}
              transition={{ duration: 1.2, delay: i * 0.2, ease: [0.16, 1, 0.3, 1] }}
            />
          ))}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
          <div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{total}</div>
            <div style={{ fontSize: 10, color: 'var(--tx-3)', marginTop: 2 }}>SKUs</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {segments.map(seg => (
          <div key={seg.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 11, color: 'var(--tx-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{seg.label}</div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 17, fontWeight: 700, lineHeight: 1.2, color: seg.color }}>{seg.count}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Stock Alert Item ─────────────────────────────────────────────────────── */
function AlertItem({ item, i }: { item: any; i: number }) {
  const isStockout  = item.risk_status === 'Stockout Risk'
  const isOverstock = item.risk_status === 'Overstock'
  const color  = isStockout ? 'var(--rose)' : isOverstock ? 'var(--purple)' : 'var(--green)'
  const bg     = isStockout ? 'var(--rose-bg)' : isOverstock ? 'var(--purple-bg)' : 'var(--green-bg)'
  const border = isStockout ? 'var(--rose-bdr)' : isOverstock ? 'var(--purple-bdr)' : 'var(--green-bdr)'
  const Icon   = isStockout ? AlertTriangle : isOverstock ? Boxes : CheckCircle2

  return (
    <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 12, background: bg, border: `1px solid ${border}`, marginBottom: 8 }}>
      <div style={{ color, flexShrink: 0 }}><Icon size={15} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx-1)' }}>Item {item.item_id}</div>
        <div style={{ fontSize: 11, color: 'var(--tx-3)', marginTop: 1 }}>
          Stock: {item.current_stock.toLocaleString()} · Demand: {Math.round(item.forecast_30d).toLocaleString()}
        </div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color, flexShrink: 0, whiteSpace: 'nowrap' }}>
        {isStockout ? `−${item.reorder_rec.toLocaleString()}` : isOverstock ? 'Excess' : 'OK'}
      </span>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════════════════════════════════════ */
export default function StoreDashboard() {
  const { globalStoreId } = useAuth()

  const { data: dashboard, isLoading: dashLoading, refetch: refetchDash } = useQuery({
    queryKey: ['business-dashboard', globalStoreId],
    queryFn: () => apiClient.getStoreDashboard(globalStoreId),
  })

  const { data: inventory, isLoading: invLoading } = useQuery({
    queryKey: ['dashboard-inventory', globalStoreId],
    queryFn: () => apiClient.getStoreInventory(globalStoreId, 30),
  })

  const { data: modelSummary, isLoading: modelLoading } = useQuery({
    queryKey: ['model-summary'],
    queryFn: () => apiClient.modelSummary(),
  })

  const isLoading = dashLoading || invLoading

  /* ── Derived data ─────────────────────────────────────────────────────── */
  const stockouts  = inventory?.items.filter(i => i.risk_status === 'Stockout Risk') ?? []
  const overstocks = inventory?.items.filter(i => i.risk_status === 'Overstock') ?? []
  const healthy    = inventory?.items.filter(i => i.risk_status === 'Healthy') ?? []
  const criticalAlerts = [...stockouts, ...overstocks].slice(0, 6)
  const totalItems = (inventory?.items.length ?? 0)

  const yoyPos = (dashboard?.yoy_growth ?? 0) >= 0
  const revenuePerUnit = dashboard && dashboard.projected_volume_30d > 0
    ? dashboard.projected_revenue_30d / dashboard.projected_volume_30d
    : 0

  /* Simulate weekly sparkline from total (7 data points trending toward total) */
  const revSparkSeed = dashboard?.projected_revenue_30d ?? 1000
  const revSpark = [0.6,0.72,0.65,0.85,0.78,0.92,1.0].map(f => Math.round(revSparkSeed * f * 0.22))
  const volSparkSeed = dashboard?.projected_volume_30d ?? 100
  const volSpark = [0.55,0.68,0.74,0.8,0.7,0.88,1.0].map(f => Math.round(volSparkSeed * f * 0.22))

  /* ── Model health ─────────────────────────────────────────────────────── */
  const modelR2    = ((modelSummary?.metrics.r2 ?? 0) * 100).toFixed(1)
  const modelRmse  = (modelSummary?.metrics.rmse ?? 0).toFixed(2)
  const modelLatency = (modelSummary?.metrics.inference_latency_ms ?? 0).toFixed(3)

  /* ── Render loading ───────────────────────────────────────────────────── */
  if (isLoading || !dashboard) {
    return (
      <div className="loading-center" style={{ flexDirection: 'column', gap: 20 }}>
        <div className="spinner spinner-lg" />
        <div style={{ fontSize: 13, color: 'var(--tx-3)', letterSpacing: '0.02em' }}>Loading store intelligence…</div>
      </div>
    )
  }

  return (
    <motion.div variants={spring} initial="hidden" animate="show">

      {/* ══════════════════════════════════════════
          PAGE HEADER — Store Identity Banner
          ══════════════════════════════════════════ */}
      <div className="page-header" style={{ padding: '18px 48px' }}>
        <div>
          <motion.div variants={up} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, var(--blue) 0%, var(--purple) 100%)', display: 'grid', placeItems: 'center', boxShadow: '0 4px 14px rgba(79,131,255,0.4)', fontSize: 18 }}>
              🏪
            </div>
            <div>
              <div className="page-title">Store #{globalStoreId} Intelligence Hub</div>
              <div className="page-subtitle">Live 30-day AI projections · Updated just now</div>
            </div>
          </motion.div>
        </div>

        <motion.div variants={up} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className={`badge ${dashboard.status === 'Healthy' ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: 12, padding: '5px 12px' }}>
            <CheckCircle2 size={12} /> {dashboard.status}
          </span>
          <span className={`badge ${yoyPos ? 'badge-green' : 'badge-rose'}`} style={{ fontSize: 12, padding: '5px 12px' }}>
            {yoyPos ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(dashboard.yoy_growth).toFixed(1)}% YoY
          </span>
          <button className="btn btn-outline btn-sm" onClick={() => refetchDash()} style={{ gap: 6 }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </motion.div>
      </div>

      <div className="page-body" style={{ padding: '36px 48px' }}>

        {/* ══════════════════════════════════════════
            ROW 1 — 5 Hero KPI Cards
            ══════════════════════════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 20, marginBottom: 28 }}>

          <KpiCard
            accent="blue" icon={DollarSign} label="Projected Revenue"
            value={<AnimatedNumber value={dashboard.projected_revenue_30d} prefix="$" decimals={0} />}
            sub="Next 30 days"
            trend={{ dir: 'up', text: '+12.4%' }}
            sparkData={revSpark}
          />

          <KpiCard
            accent="teal" icon={Package} label="Unit Volume"
            value={<AnimatedNumber value={dashboard.projected_volume_30d} decimals={0} />}
            sub="Units to move"
            trend={{ dir: 'up', text: '+8.1%' }}
            sparkData={volSpark}
          />

          <KpiCard
            accent="green" icon={Target} label="Avg Revenue / Unit"
            value={<AnimatedNumber value={revenuePerUnit} prefix="$" decimals={2} />}
            sub="Price efficiency"
            trend={{ dir: yoyPos ? 'up' : 'down', text: `${yoyPos ? '+' : ''}${dashboard.yoy_growth.toFixed(1)}%` }}
          />

          <KpiCard
            accent="amber" icon={AlertTriangle} label="Stockout Risks"
            value={<AnimatedNumber value={stockouts.length} decimals={0} />}
            sub={`${totalItems} total SKUs`}
            trend={stockouts.length > 2 ? { dir: 'down', text: 'Urgent' } : { dir: 'up', text: 'Managed' }}
          />

          <KpiCard
            accent="purple" icon={Zap} label="AI Model R²"
            value={<>{modelLoading ? '…' : <AnimatedNumber value={parseFloat(modelR2)} suffix="%" decimals={1} />}</>}
            sub={`RMSE ${modelRmse}`}
            trend={{ dir: 'up', text: 'Excellent' }}
          />

        </div>

        {/* ══════════════════════════════════════════
            ROW 2 — Left 65% + Right 35%
            ══════════════════════════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: 20, marginBottom: 28 }}>

          {/* Top Revenue Drivers Bar Chart */}
          <motion.div variants={up} className="card" style={{ padding: 28 }}>
            <div className="card-header">
              <div>
                <div className="card-title"><BarChart3 size={16} /> Top Revenue Drivers</div>
                <div className="card-subtitle">Items generating the most projected revenue this period</div>
              </div>
              <button className="btn btn-outline btn-sm">Export</button>
            </div>
            <RevenueBarChart items={dashboard.top_items} />

            {/* Inline mini table */}
            <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              {dashboard.top_items.slice(0, 3).map((item, i) => {
                const maxRev = dashboard.top_items[0].revenue
                const pct = (item.revenue / maxRev) * 100
                return (
                  <div key={item.item_id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <span style={{ fontSize: 11, color: 'var(--tx-3)', width: 18, fontWeight: 700, flexShrink: 0 }}>#{i + 1}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{item.name}</span>
                    <div style={{ width: 100, height: 4, background: 'var(--surface-4)', borderRadius: 99 }}>
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.9, delay: 0.2 + i * 0.1 }}
                        style={{ height: '100%', borderRadius: 99, background: ['var(--blue)', 'var(--green)', 'var(--purple)'][i] }}
                      />
                    </div>
                    <span className="mono" style={{ fontSize: 12, color: 'var(--tx-2)', width: 80, textAlign: 'right' }}>
                      ${item.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* Inventory Health Panel */}
          <motion.div variants={up} className="card" style={{ padding: 28 }}>
            <div className="card-header" style={{ marginBottom: 24 }}>
              <div>
                <div className="card-title"><Activity size={16} /> Inventory Health</div>
                <div className="card-subtitle">Real-time stock classification</div>
              </div>
            </div>

            <HealthRing healthy={healthy.length} stockout={stockouts.length} overstock={overstocks.length} />

            {/* Health Score */}
            <div style={{ marginTop: 20, padding: '12px 16px', background: 'var(--surface-3)', borderRadius: 12, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--tx-3)', fontWeight: 500 }}>Health Score</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: totalItems > 0 && (healthy.length / totalItems) > 0.6 ? 'var(--green)' : 'var(--amber)' }}>
                  {totalItems > 0 ? Math.round((healthy.length / totalItems) * 100) : 0}%
                </span>
              </div>
              <div className="progress-track">
                <motion.div className="progress-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${totalItems > 0 ? (healthy.length / totalItems) * 100 : 0}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  style={{ background: 'linear-gradient(90deg, var(--teal), var(--green))' }}
                />
              </div>
            </div>

            {/* Quick stats */}
            <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Reorder Actions', val: inventory?.items.filter(i => i.reorder_rec > 0).length ?? 0, color: 'var(--amber)' },
                { label: 'Total Demand 30d', val: `${Math.round((inventory?.items.reduce((s, i) => s + i.forecast_30d, 0) ?? 0) / 1000)}k`, color: 'var(--blue-hi)' },
              ].map(stat => (
                <div key={stat.label} style={{ padding: '10px 12px', background: 'var(--surface-3)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--tx-3)', marginBottom: 3 }}>{stat.label}</div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 800, color: stat.color }}>{stat.val}</div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>

        {/* ══════════════════════════════════════════
            ROW 3 — Alerts + SKU Table + Model Health
            ══════════════════════════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 20 }}>

          {/* Stock Alerts Feed */}
          <motion.div variants={up} className="card" style={{ padding: 24 }}>
            <div className="card-header" style={{ marginBottom: 16 }}>
              <div className="card-title">
                <AlertTriangle size={15} style={{ color: 'var(--rose)' }} /> Live Alerts
              </div>
              {stockouts.length > 0 && (
                <span className="badge badge-rose" style={{ fontSize: 11 }}>
                  {stockouts.length} urgent
                </span>
              )}
            </div>

            {criticalAlerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--tx-3)' }}>
                <CheckCircle2 size={28} style={{ color: 'var(--green)', opacity: 0.6, marginBottom: 8 }} />
                <div style={{ fontSize: 13 }}>All clear — no alerts</div>
              </div>
            ) : (
              <div style={{ maxHeight: 340, overflowY: 'auto', paddingRight: 4 }}>
                {criticalAlerts.map((item, i) => <AlertItem key={item.item_id} item={item} i={i} />)}
              </div>
            )}
          </motion.div>

          {/* SKU Performance Table */}
          <motion.div variants={up} className="card" style={{ padding: 24 }}>
            <div className="card-header" style={{ marginBottom: 16 }}>
              <div>
                <div className="card-title"><ShoppingCart size={15} /> SKU Performance</div>
                <div className="card-subtitle">All monitored items with stock & demand data</div>
              </div>
            </div>
            <div className="table-wrap" style={{ maxHeight: 360, overflow: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Stock</th>
                    <th>Forecast (30d)</th>
                    <th>Status</th>
                    <th>Reorder</th>
                  </tr>
                </thead>
                <tbody>
                  {(inventory?.items ?? []).map((item, i) => (
                    <motion.tr key={item.item_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 + i * 0.04 }}>
                      <td><span style={{ fontWeight: 600 }}>Item {item.item_id}</span></td>
                      <td><span className="mono">{item.current_stock.toLocaleString()}</span></td>
                      <td><span className="mono text-blue" style={{ fontWeight: 600 }}>{Math.round(item.forecast_30d).toLocaleString()}</span></td>
                      <td>
                        {item.risk_status === 'Stockout Risk' && <span className="badge badge-rose" style={{ fontSize: 11 }}>Stockout</span>}
                        {item.risk_status === 'Overstock'    && <span className="badge badge-purple" style={{ fontSize: 11 }}>Overstock</span>}
                        {item.risk_status === 'Healthy'      && <span className="badge badge-green" style={{ fontSize: 11 }}>Healthy</span>}
                      </td>
                      <td>
                        {item.reorder_rec > 0
                          ? <span style={{ color: 'var(--amber)', fontWeight: 700, fontSize: 13 }} className="mono">+{item.reorder_rec.toLocaleString()}</span>
                          : <span style={{ color: 'var(--tx-3)', fontSize: 13 }}>—</span>
                        }
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* AI Model Health Panel */}
          <motion.div variants={up} className="card" style={{ padding: 24 }}>
            <div className="card-header" style={{ marginBottom: 20 }}>
              <div className="card-title" style={{ color: 'var(--blue-hi)' }}>
                <Zap size={15} /> AI Engine Status
              </div>
              {!modelLoading && <span className="badge badge-green" style={{ fontSize: 11 }}>Live</span>}
            </div>

            {/* Model stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'R² Accuracy',    val: modelLoading ? '…' : `${modelR2}%`,        color: 'var(--green)',    pct: parseFloat(modelR2) },
                { label: 'RMSE Error',     val: modelLoading ? '…' : modelRmse,              color: 'var(--amber)',   pct: Math.max(0, 100 - parseFloat(modelRmse) * 30) },
                { label: 'Inference Lat.', val: modelLoading ? '…' : `${modelLatency}ms`,   color: 'var(--teal)',    pct: 98 },
                { label: 'WAPE',           val: modelLoading ? '…' : `${(modelSummary?.metrics.wape ?? 0).toFixed(2)}%`, color: 'var(--blue-hi)', pct: 90 },
              ].map((s, i) => (
                <div key={s.label} style={{ padding: '10px 12px', background: 'var(--surface-3)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--tx-2)' }}>{s.label}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, color: s.color }}>{s.val}</span>
                  </div>
                  <div className="progress-track" style={{ height: 3 }}>
                    <motion.div className="progress-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, s.pct)}%` }}
                      transition={{ duration: 0.9, delay: 0.3 + i * 0.12 }}
                      style={{ background: s.color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Model ensemble chips */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--tx-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, fontWeight: 600 }}>
                Engines Available
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['LightGBM', 'XGBoost', 'GRU', 'SARIMA', 'ARMA'].map(m => (
                  <span key={m} className="badge badge-blue" style={{ fontSize: 11 }}>{m}</span>
                ))}
              </div>
            </div>

            {/* Last updated */}
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--tx-3)', fontSize: 11 }}>
              <Clock size={12} /> Updated: {new Date().toLocaleTimeString()}
            </div>
          </motion.div>

        </div>

      </div>
    </motion.div>
  )
}
