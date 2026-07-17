import { NavLink } from 'react-router-dom'
import { LayoutDashboard, TrendingUp, Cpu, Network, Store, Database, History, FileText, Package, BarChart2, Settings, LogOut } from 'lucide-react'
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
          <BarChart2 size={16} className="nav-icon" />
          Analytics
        </NavLink>
        <NavLink to="/stores" className={navClass}>
          <Store size={16} className="nav-icon" />
          Stores
        </NavLink>
        <NavLink to="/items" className={navClass}>
          <Database size={16} className="nav-icon" />
          Items
        </NavLink>
        <NavLink to="/inventory" className={navClass}>
          <Package size={16} className="nav-icon" />
          Inventory
        </NavLink>
        <NavLink to="/decision-intelligence" className={navClass}>
          <Network size={16} className="nav-icon" />
          Decision Intelligence
        </NavLink>
        <NavLink to="/model-performance" className={navClass}>
          <Cpu size={16} className="nav-icon" />
          Model Performance
        </NavLink>
        <NavLink to="/history" className={navClass}>
          <History size={16} className="nav-icon" />
          Forecast History
        </NavLink>
        <NavLink to="/dataset" className={navClass}>
          <Database size={16} className="nav-icon" />
          Dataset Explorer
        </NavLink>
        <NavLink to="/settings" className={navClass}>
          <Settings size={16} className="nav-icon" />
          Settings
        </NavLink>
      </nav>

      {/* ── User + Sign Out ───────────────────────────────────── */}
      <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 10px', marginBottom: 6 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--blue), var(--purple))', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: 13 }}>
            {(user?.username || 'U').charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: 'var(--tx-1)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.full_name || user?.username || 'Guest'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--tx-3)' }}>{(user?.roles || []).join(', ')}</div>
          </div>
          <button className="icon-btn" title="Sign out" onClick={logout} style={{ background: 'transparent', border: 'none', color: 'var(--tx-3)', cursor: 'pointer' }}>
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
