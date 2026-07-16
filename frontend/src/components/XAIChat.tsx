import React, { useState, useEffect } from 'react'
import type { ExplainResponse } from '../api/client'
import { MessageSquare, Sparkles, Send } from 'lucide-react'

interface Props {
  xaiData?: ExplainResponse
  isLoading: boolean
}

interface Message {
  role: 'user' | 'ai'
  content: string
}

export default function XAIChat({ xaiData, isLoading }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  
  useEffect(() => {
    if (xaiData) {
      setMessages([
        {
          role: 'ai',
          content: `Hi! I've analyzed this forecast. The demand is projected at ${Math.round(xaiData.prediction)} units. What would you like to know about it?`
        }
      ])
    }
  }, [xaiData])
  
  const handleSend = () => {
    if (!input.trim() || !xaiData) return
    
    const userMsg = input
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    
    setTimeout(() => {
      let aiMsg = "I am a rule-based assistant. I can only interpret the SHAP values provided by the model."
      
      const lower = userMsg.toLowerCase()
      if (lower.includes('why') || lower.includes('reason') || lower.includes('decrease') || lower.includes('increase')) {
        aiMsg = xaiData.insight_text
      } else if (lower.includes('top') || lower.includes('highest')) {
        const top = xaiData.shap_values.sort((a,b) => Math.abs(b.value) - Math.abs(a.value))[0]
        aiMsg = `The single most important factor is ${top.feature.replace(/_/g, ' ')}, driving the prediction by ${top.value.toFixed(1)} units.`
      } else if (lower.includes('risk') || lower.includes('confident') || lower.includes('reliable')) {
        aiMsg = `The confidence is derived from the variance of the prediction intervals across historical training data.`
      } else {
        aiMsg = `According to the SHAP analysis: ${xaiData.insight_text}`
      }
      
      setMessages(prev => [...prev, { role: 'ai', content: aiMsg }])
    }, 1000)
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 400 }}>
      <div className="card-header" style={{ marginBottom: 0, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
        <span className="card-title text-purple" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={16} /> Forecast Explanation Assistant
        </span>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {isLoading && (
          <div className="loading-center">
            <div className="spinner" />
          </div>
        )}
        
        {!isLoading && messages.map((msg, i) => (
          <div key={i} style={{ 
            display: 'flex', 
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' 
          }}>
            <div style={{
              maxWidth: '85%',
              padding: '10px 14px',
              borderRadius: msg.role === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
              background: msg.role === 'user' ? 'var(--blue)' : 'var(--surface-3)',
              color: msg.role === 'user' ? '#fff' : 'var(--tx-1)',
              fontSize: 13,
              lineHeight: 1.5
            }}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>
      
      <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <input 
          className="input" 
          value={input} 
          onChange={e => setInput(e.target.value)}
          placeholder="Why did demand decrease?"
          style={{ flex: 1 }}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
        />
        <button className="btn btn-blue" onClick={handleSend} disabled={!input.trim()}>
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
