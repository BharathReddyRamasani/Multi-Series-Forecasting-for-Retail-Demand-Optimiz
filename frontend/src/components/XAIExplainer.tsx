import React from 'react'
import type { ExplainResponse } from '../api/client'
import { TrendingUp, TrendingDown, Target, Info } from 'lucide-react'

interface Props {
  xaiData?: ExplainResponse
  isLoading: boolean
}

export default function XAIExplainer({ xaiData, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-title"><Target size={16} /> Why? (XAI)</span>
        </div>
        <div className="loading-center" style={{ height: 180 }}>
          <div className="spinner"/>
        </div>
      </div>
    )
  }

  if (!xaiData) return null

  // Sort values absolute impact, but we want positive drivers first, then negative
  const posDrivers = xaiData.shap_values.filter(s => s.value > 0).sort((a, b) => b.value - a.value)
  const negDrivers = xaiData.shap_values.filter(s => s.value < 0).sort((a, b) => a.value - b.value)
  
  const formatFeature = (f: string) => {
    return f.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div className="card">
      <div className="card-header" style={{ marginBottom: 12 }}>
        <span className="card-title"><Target size={16} /> Top Prediction Drivers</span>
        <span style={{fontSize: 11, color: 'var(--tx-3)'}}>Explainable AI</span>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {posDrivers.slice(0, 3).map((driver, i) => (
          <div key={`pos-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'rgba(0, 217, 126, 0.05)', borderRadius: 6, border: '1px solid rgba(0, 217, 126, 0.1)' }}>
            <TrendingUp size={16} color="#00d97e" />
            <div style={{ flex: 1, fontSize: 13, color: 'var(--tx-1)' }}>
              {formatFeature(driver.feature)}
            </div>
            <div style={{ fontWeight: 600, color: '#00d97e', fontSize: 13 }}>+{driver.value.toFixed(1)}</div>
          </div>
        ))}
        
        {negDrivers.slice(0, 2).map((driver, i) => (
          <div key={`neg-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'rgba(255, 77, 109, 0.05)', borderRadius: 6, border: '1px solid rgba(255, 77, 109, 0.1)' }}>
            <TrendingDown size={16} color="#ff4d6d" />
            <div style={{ flex: 1, fontSize: 13, color: 'var(--tx-1)' }}>
              {formatFeature(driver.feature)}
            </div>
            <div style={{ fontWeight: 600, color: '#ff4d6d', fontSize: 13 }}>{driver.value.toFixed(1)}</div>
          </div>
        ))}
        
        {posDrivers.length === 0 && negDrivers.length === 0 && (
          <div style={{ color: 'var(--tx-3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
            No strong drivers found.
          </div>
        )}
      </div>
      
      <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--tx-3)', display: 'flex', gap: 6 }}>
        <Info size={14} />
        Values indicate the unit impact on the final forecast prediction.
      </div>
    </div>
  )
}
