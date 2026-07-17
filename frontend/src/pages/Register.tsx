import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TrendingUp, Activity, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import { apiClient } from '../api/client'
import { toast } from 'react-hot-toast'

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemFade = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
}

export default function Register() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await apiClient.register(username, password, email || undefined, fullName || undefined)
      toast.success('Account created — please sign in')
      navigate('/login')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-split">
      {/* Left Column: Form */}
      <div className="auth-form-col">
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="auth-form-container">
          <motion.div variants={itemFade}>
            <Link to="/landing" className="sidebar-logo-icon" style={{ display: 'inline-flex', marginBottom: 32, width: 48, height: 48, fontSize: 24, textDecoration: 'none' }}>📈</Link>
          </motion.div>
          
          <motion.h1 variants={itemFade} style={{ fontSize: 32, fontWeight: 800, color: 'var(--t-primary)', marginBottom: 8 }}>Create Account</motion.h1>
          <motion.p variants={itemFade} style={{ color: 'var(--t-secondary)', fontSize: 15, marginBottom: 40 }}>Join DemandAI and optimize your store inventory.</motion.p>

          <motion.form variants={itemFade} onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <input className="input" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            <input className="input" type="email" placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="input" placeholder="Full name (optional)" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <input className="input" type="password" placeholder="Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button className="btn btn-blue w-full" type="submit" disabled={loading}>
              {loading ? <div className="spinner" /> : 'Create account'}
            </button>
          </motion.form>

          <motion.p variants={itemFade} style={{ marginTop: 32, fontSize: 14, color: 'var(--t-muted)', textAlign: 'center' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--t-primary)', fontWeight: 600 }}>Sign In</Link>
          </motion.p>
        </motion.div>
      </div>

      {/* Right Column: Project Info */}
      <div className="auth-info-col">
        <motion.div 
          initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="auth-info-content"
        >
          <h2 style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.1, marginBottom: 24 }}>
            Stop guessing.<br />
            <span className="landing-gradient-text">Start optimizing.</span>
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
            DemandAI combines state-of-the-art LightGBM ensemble models with explainable AI to turn complex predictions into actionable inventory decisions.
          </p>

          <div className="auth-feature-list">
            {[
              { icon: TrendingUp, title: "High-Accuracy Ensembles", desc: "Achieve 98% R² test scores with multi-horizon quantile forecasting." },
              { icon: Activity, title: "Actionable Decision Analytics", desc: "Instantly identify stockout risks and get exact reorder recommendations." },
              { icon: ShieldCheck, title: "Explainable AI (XAI)", desc: "Build trust with automated, human-readable explanations of forecast drivers." },
            ].map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + (i * 0.1) }} className="auth-feature-item">
                <div className="auth-feature-icon"><f.icon size={20} /></div>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{f.title}</h4>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
