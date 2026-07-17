import { Link } from 'react-router-dom'
import { TrendingUp, PackageSearch, ShieldCheck, ArrowRight, Zap, Cpu, BarChart3 } from 'lucide-react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } } }
const item = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } } }

const FEATURES = [
  { icon: TrendingUp,   title: 'Actionable Insights',       desc: 'Transform raw predictions into immediate inventory decisions via automated Decision Analytics.', color: 'var(--blue)' },
  { icon: PackageSearch, title: 'Multi-Series Forecasting',   desc: 'Simultaneously forecast thousands of store-item combinations across multiple horizon lengths.', color: 'var(--purple)' },
  { icon: ShieldCheck,  title: 'Quantile Confidence',       desc: 'Make risk-adjusted decisions using 90% confidence intervals from our ensemble models.', color: 'var(--amber)' },
  { icon: Zap,          title: 'Sub-ms Inference',          desc: 'Blazing-fast FastAPI backend capable of generating predictions in under a millisecond per row.', color: 'var(--rose)' },
  { icon: Cpu,          title: '4 Inference Engines',        desc: 'Switch between LightGBM, XGBoost, SARIMA, and ARMA on the fly for any forecast.', color: 'var(--green)' },
  { icon: BarChart3,    title: 'Real-Time Analytics',       desc: 'Interactive dashboards with SHAP explanations, model performance metrics, and drift detection.', color: 'var(--cyan)' },
]

const TECH_LOGOS = [
  { name: 'React', icon: '⚛️' }, { name: 'FastAPI', icon: '⚡' }, { name: 'LightGBM', icon: '🌲' },
  { name: 'XGBoost', icon: '📊' }, { name: 'Python', icon: '🐍' }, { name: 'TypeScript', icon: '📘' },
]

const METRICS = [
  { value: '98%', label: 'R² Score' },
  { value: '50K+', label: 'Forecasts Daily' },
  { value: '<1ms', label: 'Avg Inference' },
  { value: '4', label: 'Models' },
]

export default function Landing() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.2])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', overflowX: 'hidden' }}>
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

      <section ref={heroRef} style={{ position: 'relative', overflow: 'hidden', padding: '140px 48px 80px', textAlign: 'center' }}>
        <div style={{ position: 'absolute', top: '10%', left: '15%', width: '35%', height: '60%', background: 'radial-gradient(circle, rgba(79,131,255,0.08) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', top: '20%', right: '10%', width: '40%', height: '60%', background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(40px)' }} />

        <motion.div style={{ y: heroY, opacity: heroOpacity }}>
          <motion.div variants={container} initial="hidden" animate="show" style={{ maxWidth: 840, margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <motion.div variants={item} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px', background: 'var(--blue-glass)', border: '1px solid rgba(79,131,255,0.25)', borderRadius: 100, color: 'var(--blue-hi)', fontSize: 13, fontWeight: 600, marginBottom: 40, boxShadow: '0 0 20px rgba(79,131,255,0.1)' }}>
              <Zap size={14} /> Multi-Model Inference Engine v3.0 Now Live
            </motion.div>

            <motion.h1 variants={item} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 72, fontWeight: 800, lineHeight: 1.05, marginBottom: 24, letterSpacing: '-0.04em', color: 'var(--tx-1)' }}>
              Predict demand.<br />
              <span style={{ background: 'linear-gradient(135deg, var(--blue-hi), var(--purple-hi))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Optimize inventory.</span>
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
          </motion.div>
        </motion.div>
      </section>

      {/* ── Metrics Bar ── */}
      <section style={{ padding: '0 48px 80px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, background: 'var(--surface-1)', borderRadius: 20, border: '1px solid var(--border)', padding: '32px 24px' }}>
          {METRICS.map((m, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--blue-hi)', fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.03em' }}>{m.value}</div>
              <div style={{ fontSize: 14, color: 'var(--tx-3)', fontWeight: 500, marginTop: 4 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section style={{ padding: '80px 48px 120px', borderTop: '1px solid rgba(255,255,255,0.03)', background: 'var(--surface-0)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 40, fontWeight: 800, color: 'var(--tx-1)', letterSpacing: '-0.03em', marginBottom: 16 }}>
              Everything your team needs
            </h2>
            <p style={{ fontSize: 18, color: 'var(--tx-3)', maxWidth: 560, margin: '0 auto', lineHeight: 1.6 }}>
              A complete intelligence toolkit bridging the gap between machine learning and retail operations.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="card"
                style={{ padding: 36, background: 'var(--surface-1)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div style={{ width: 56, height: 56, background: `${f.color}15`, color: f.color, borderRadius: 16, display: 'grid', placeItems: 'center', marginBottom: 24, border: `1px solid ${f.color}30` }}>
                  <f.icon size={26} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--tx-1)', marginBottom: 12, letterSpacing: '-0.01em' }}>{f.title}</h3>
                <p style={{ fontSize: 15, color: 'var(--tx-3)', lineHeight: 1.65 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech Stack ── */}
      <section style={{ padding: '80px 48px', textAlign: 'center' }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 40 }}>Powered by</h3>
        <div style={{ display: 'flex', gap: 48, justifyContent: 'center', flexWrap: 'wrap' }}>
          {TECH_LOGOS.map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600, color: 'var(--tx-2)' }}>
              <span style={{ fontSize: 24 }}>{t.icon}</span> {t.name}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Panel ── */}
      <section style={{ padding: '0 48px 120px' }}>
        <div style={{
          maxWidth: 900, margin: '0 auto', padding: '64px 48px', borderRadius: 28, textAlign: 'center',
          background: 'linear-gradient(135deg, var(--blue)08, var(--purple)08)',
          border: '1px solid rgba(79,131,255,0.15)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '-50%', left: '20%', width: '60%', height: '200%', background: 'radial-gradient(ellipse, rgba(79,131,255,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 36, fontWeight: 800, color: 'var(--tx-1)', letterSpacing: '-0.03em', marginBottom: 16, position: 'relative' }}>
            Ready to transform your demand forecasting?
          </h2>
          <p style={{ fontSize: 17, color: 'var(--tx-3)', maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.6, position: 'relative' }}>
            Join forward-thinking retailers using DemandAI to cut stockouts by 40% and reduce excess inventory.
          </p>
          <Link to="/register" className="btn btn-blue btn-lg" style={{ padding: '16px 40px', fontSize: 16, fontWeight: 600, borderRadius: 'var(--r-full)', position: 'relative' }}>
            Start Free Trial <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '32px 48px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: 'var(--tx-4)' }}>&copy; {new Date().getFullYear()} DemandAI. All rights reserved.</p>
      </footer>
    </div>
  )
}
