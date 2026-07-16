import { Link } from 'react-router-dom'
import { TrendingUp, PackageSearch, BrainCircuit, ShieldCheck, ArrowRight, Zap, CheckCircle2, Cpu } from 'lucide-react'
import { motion } from 'framer-motion'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } } }
const item      = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } } }

const FEATURES = [
  { icon: TrendingUp,   title: 'Actionable Insights',       desc: 'Transform raw predictions into immediate inventory decisions via automated Decision Analytics.', color: 'var(--blue)' },
  { icon: PackageSearch, title: 'Multi-Series Forecasting',   desc: 'Simultaneously forecast thousands of store-item combinations across 5 horizon lengths.', color: 'var(--purple)' },
  { icon: ShieldCheck,  title: 'Quantile Confidence',       desc: 'Make risk-adjusted decisions using the 90% confidence intervals from our ensemble models.', color: 'var(--amber)' },
  { icon: Zap,          title: 'Sub-ms Inference',          desc: 'Blazing-fast FastAPI backend capable of generating predictions in ~0.12ms per row.', color: 'var(--rose)' },
  { icon: Cpu,          title: '5 Inference Engines',        desc: 'Switch between LightGBM, XGBoost, Keras GRU, SARIMA, and ARMA on the fly.', color: 'var(--green)' },
]

export default function Landing() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', overflowX: 'hidden' }}>

      {/* ── Navbar ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 48px',
        background: 'rgba(6,6,10,0.75)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, var(--blue), var(--purple))', display: 'grid', placeItems: 'center', fontSize: 16, boxShadow: '0 4px 14px rgba(79,131,255,0.4)' }}>📈</div>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--tx-1)', letterSpacing: '-0.02em' }}>DemandAI</span>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link to="/login"    className="btn btn-ghost" style={{ fontSize: 14, fontWeight: 600 }}>Log in</Link>
          <Link to="/register" className="btn btn-primary" style={{ fontSize: 14, fontWeight: 600, padding: '10px 20px', borderRadius: 'var(--r-full)' }}>Get Started</Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '140px 48px 120px', textAlign: 'center' }}>
        {/* Background glow orbs */}
        <div style={{ position: 'absolute', top: '10%', left: '15%', width: '35%', height: '60%', background: 'radial-gradient(circle, rgba(79,131,255,0.08) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', top: '20%', right: '10%', width: '40%', height: '60%', background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(40px)' }} />

        <motion.div variants={container} initial="hidden" animate="show" style={{ maxWidth: 840, margin: '0 auto', position: 'relative', zIndex: 1 }}>

          <motion.div variants={item} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px', background: 'var(--blue-glass)', border: '1px solid rgba(79,131,255,0.25)', borderRadius: 100, color: 'var(--blue-hi)', fontSize: 13, fontWeight: 600, marginBottom: 40, boxShadow: '0 0 20px rgba(79,131,255,0.1)' }}>
            <Zap size={14} /> Multi-Model Inference Engine v3.0 Now Live
          </motion.div>

          <motion.h1 variants={item} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 72, fontWeight: 800, lineHeight: 1.05, marginBottom: 24, letterSpacing: '-0.04em', color: 'var(--tx-1)' }}>
            Predict demand.<br />
            <span style={{ color: 'var(--tx-3)' }}>Optimize inventory.</span>
          </motion.h1>

          <motion.p variants={item} style={{ fontSize: 19, color: 'var(--tx-2)', margin: '0 auto 48px', maxWidth: 640, lineHeight: 1.6 }}>
            Empower retail operations with multi-horizon forecasts and actionable insights — all in one world-class platform.
          </motion.p>

          <motion.div variants={item} style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/login" className="btn btn-blue btn-lg" style={{ padding: '16px 36px', fontSize: 16, fontWeight: 600, borderRadius: 'var(--r-full)' }}>
              Access Manager Portal <ArrowRight size={18} />
            </Link>
            <Link to="/register" className="btn btn-outline btn-lg" style={{ padding: '16px 36px', fontSize: 16, fontWeight: 600, borderRadius: 'var(--r-full)' }}>
              Request Demo
            </Link>
          </motion.div>

          {/* Social proof chips */}
          <motion.div variants={item} style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 56, flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 40 }}>
            {[
              '98% Test R² Score',
              '5 Model Architectures',
              'Sub-ms Inference',
            ].map(chip => (
              <span key={chip} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, color: 'var(--tx-3)' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--green)' }} /> {chip}
              </span>
            ))}
          </motion.div>

        </motion.div>
      </section>

      {/* ── Features Grid ── */}
      <section style={{ padding: '120px 48px 160px', borderTop: '1px solid rgba(255,255,255,0.03)', background: 'var(--surface-0)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 40, fontWeight: 800, color: 'var(--tx-1)', letterSpacing: '-0.03em', marginBottom: 16 }}>
              Everything your team needs
            </h2>
            <p style={{ fontSize: 18, color: 'var(--tx-3)', maxWidth: 560, margin: '0 auto', lineHeight: 1.6 }}>
              A complete intelligence toolkit bridging the gap between deep learning and retail operations.
            </p>
          </div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            className="landing-grid"
            style={{ gap: 32 }}
          >
            {FEATURES.map((f, i) => (
              <motion.div key={i} variants={item} className="card" style={{ padding: 36, background: 'var(--surface-1)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ width: 56, height: 56, background: `${f.color}15`, color: f.color, borderRadius: 16, display: 'grid', placeItems: 'center', marginBottom: 24, border: `1px solid ${f.color}30` }}>
                  <f.icon size={26} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--tx-1)', marginBottom: 12, letterSpacing: '-0.01em' }}>{f.title}</h3>
                <p style={{ fontSize: 15, color: 'var(--tx-3)', lineHeight: 1.65 }}>{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

    </div>
  )
}
