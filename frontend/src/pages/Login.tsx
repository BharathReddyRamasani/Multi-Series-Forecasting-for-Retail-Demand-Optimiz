import { Link } from 'react-router-dom'
import { TrendingUp, Activity, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { SignIn } from '@clerk/clerk-react'

const c = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }
const up = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } } }

export default function Login() {
  return (
    <div className="auth-split">

      {/* ── Left: Login Form ───────────────────────────────── */}
      <div className="auth-form-col">
        <motion.div variants={c} initial="hidden" animate="show" className="auth-form-container">

          {/* Logo */}
          <motion.div variants={up} style={{ marginBottom: 36 }}>
            <Link to="/landing" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--blue), var(--purple))', display: 'grid', placeItems: 'center', fontSize: 18, boxShadow: '0 4px 14px rgba(79,131,255,0.4)' }}>📈</div>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--tx-1)', letterSpacing: '-0.02em' }}>DemandAI</span>
            </Link>
          </motion.div>

          <motion.h1 variants={up} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 28, fontWeight: 800, color: 'var(--tx-1)', marginBottom: 8, letterSpacing: '-0.025em' }}>
            Welcome back
          </motion.h1>
          <motion.p variants={up} style={{ color: 'var(--tx-3)', fontSize: 14, marginBottom: 36 }}>
            Sign in to access your store intelligence hub.
          </motion.p>

          <motion.div variants={up} style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
            <SignIn routing="path" path="/login" signUpUrl="/register" />
          </motion.div>

          <motion.p variants={up} style={{ marginTop: 28, fontSize: 13, color: 'var(--tx-3)', textAlign: 'center' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--tx-1)', fontWeight: 600 }}>Request access</Link>
          </motion.p>

          {/* Trust badges */}
          <motion.div variants={up} style={{ marginTop: 40, display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['SOC 2 Ready', 'GDPR Safe', 'AES-256'].map(t => (
              <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--tx-3)' }}>
                <CheckCircle2 size={12} style={{ color: 'var(--green)' }} />{t}
              </span>
            ))}
          </motion.div>

        </motion.div>
      </div>

      {/* ── Right: Feature Showcase ────────────────────────── */}
      <div className="auth-info-col">
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="auth-info-content"
        >
          <div style={{ marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 12px', background: 'var(--blue-glass)', border: '1px solid rgba(79,131,255,0.25)', borderRadius: 'var(--r-full)', fontSize: 12, color: 'var(--blue-hi)', fontWeight: 600 }}>
            ⚡ AI Inference Engine Active
          </div>

          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 36, fontWeight: 800, lineHeight: 1.15, marginBottom: 20, letterSpacing: '-0.03em', marginTop: 16 }}>
            Enterprise forecasting,<br />
            <span style={{ color: 'var(--tx-3)' }}>built for decisions.</span>
          </h2>

          <p style={{ fontSize: 15, color: 'var(--tx-2)', lineHeight: 1.7, marginBottom: 36, maxWidth: 460 }}>
            DemandAI combines LightGBM ensemble models with deep learning and explainable AI — turning complex predictions into inventory actions your team can act on immediately.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: TrendingUp, title: 'High-Accuracy Ensembles', desc: '98% R² test score across 500+ store-item combinations', color: 'var(--blue)' },
              { icon: Activity, title: 'Real-time Decision Analytics', desc: 'Stockout risk, reorder qty, and excess stock — all at a glance', color: 'var(--green)' },
              { icon: ShieldCheck, title: 'Explainable AI (XAI)', desc: 'Per-forecast SHAP explanations your team will actually trust', color: 'var(--purple)' },
            ].map((f, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                style={{ display: 'flex', gap: 14, padding: '14px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)' }}
              >
                <div style={{ width: 38, height: 38, borderRadius: 10, background: `${f.color}18`, display: 'grid', placeItems: 'center', color: f.color, flexShrink: 0, border: `1px solid ${f.color}30` }}>
                  <f.icon size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx-1)', marginBottom: 3 }}>{f.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--tx-3)', lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 32, marginTop: 36, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
            {[{ val: '500+', label: 'SKUs Tracked' }, { val: '5', label: 'AI Models' }, { val: '0.12ms', label: 'Inference' }].map(s => (
              <div key={s.label}>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 26, fontWeight: 800, color: 'var(--tx-1)', letterSpacing: '-0.03em' }}>{s.val}</div>
                <div style={{ fontSize: 12, color: 'var(--tx-3)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

        </motion.div>
      </div>

    </div>
  )
}
