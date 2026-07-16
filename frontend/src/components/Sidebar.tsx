import { NavLink } from 'react-router-dom'
import { LayoutDashboard, TrendingUp, Cpu, Network, LogOut, Store, ChevronDown, Database, History, FileText } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import { useState } from 'react'

export default function Sidebar() {
  const { globalStoreId, setGlobalStoreId, logout, user } = useAuth()
  const [storeOpen, setStoreOpen] = useState(false)

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `nav-item${isActive ? ' active' : ''}`

  return (
    <motion.div
      initial={{ x: -264, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="sidebar"
    >
      {/* ── Logo ─────────────────────────────────────────────── */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">📈</div>
        <span className="sidebar-logo-text">DemandAI</span>
      </div>

      {/* ── Store Selector ─────────────────────────────────────── */}
      <div className="store-selector-wrap">
        <div className="nav-label" style={{ marginBottom: 8 }}>
          <Store size={10} /> Current Store
        </div>
        <div style={{ position: 'relative' }}>
          <select
            className="select"
            value={globalStoreId}
            onChange={e => setGlobalStoreId(Number(e.target.value))}
            style={{ fontSize: 13, paddingRight: 32 }}
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map(id => (
              <option key={id} value={id}>Store #{id} — Downtown</option>
            ))}
          </select>
          <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--tx-3)', pointerEvents: 'none' }} />
        </div>

        {/* Store status pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '6px 10px', background: 'var(--green-bg)', border: '1px solid var(--green-bdr)', borderRadius: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px var(--green)' }} />
          <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>Online · AI Active</span>
        </div>
      </div>

      {/* ── Navigation ─────────────────────────────────────── */}
      <nav className="nav-section" style={{ flex: 1 }}>
        <div className="nav-label">Main Menu</div>
        <NavLink to="/" end className={navClass}>
          <LayoutDashboard size={16} className="nav-icon" />
          Dashboard
        </NavLink>
        <NavLink to="/forecast" className={navClass}>
          <TrendingUp size={16} className="nav-icon" />
          Forecast
        </NavLink>
        <NavLink to="/analytics" className={navClass}>
          <Network size={16} className="nav-icon" />
          Analytics
        </NavLink>
        <NavLink to="/model-performance" className={navClass}>
          <Cpu size={16} className="nav-icon" />
          Model Performance
        </NavLink>
        <NavLink to="/dataset" className={navClass}>
          <Database size={16} className="nav-icon" />
          Dataset Explorer
        </NavLink>
        <NavLink to="/history" className={navClass}>
          <History size={16} className="nav-icon" />
          Forecast History
        </NavLink>
        <NavLink to="/reports" className={navClass}>
          <FileText size={16} className="nav-icon" />
          Reports
        </NavLink>
      </nav>

      {/* ── User + Sign Out ───────────────────────────────────── */}
      <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: '1px solid var(--border)' }}>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 10px', marginBottom: 6 }}>
            {/* Avatar */}
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, var(--blue), var(--purple))', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 13, fontWeight: 700, color: 'white' }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
              <div style={{ fontSize: 11, color: 'var(--tx-3)', marginTop: 1 }}>{user.role}</div>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="nav-item w-full"
          style={{ color: 'var(--rose)', justifyContent: 'flex-start', width: '100%' }}
        >
          <LogOut size={15} className="nav-icon" style={{ color: 'var(--rose)' }} />
          Sign Out
        </button>
      </div>
    </motion.div>
  )
}
