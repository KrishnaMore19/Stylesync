'use client'
import { AlertTriangle, RefreshCw, Edit3 } from 'lucide-react'

export default function ErrorMessage({ message, onRetry, onManual }) {
  const isCors = message?.toLowerCase().includes('cors') ||
    message?.toLowerCase().includes('block') ||
    message?.toLowerCase().includes('403') ||
    message?.toLowerCase().includes('timeout')

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-64 p-8 text-center">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
        <AlertTriangle size={20} style={{ color: '#ef4444' }} />
      </div>

      <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--app-text)', fontFamily: 'var(--font-body)' }}>
        {isCors ? 'This site blocks scanners' : 'Extraction failed'}
      </h3>

      <p className="text-xs mb-6 max-w-xs" style={{ color: 'var(--app-text-muted)', fontFamily: 'var(--font-body)', lineHeight: '1.6' }}>
        {isCors
          ? 'The site uses bot protection or CORS policies. We generated simulated tokens based on heuristics.'
          : message || 'Something went wrong during extraction.'}
      </p>

      <div className="flex gap-2">
        {onRetry && (
          <button onClick={onRetry}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--app-text)', border: '1px solid var(--app-border)', fontFamily: 'var(--font-mono)' }}>
            <RefreshCw size={11} /> Retry
          </button>
        )}
        {onManual && (
          <button onClick={onManual}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all hover:opacity-80"
            style={{ background: 'rgba(139,92,246,0.1)', color: 'var(--app-accent)', border: '1px solid rgba(139,92,246,0.2)', fontFamily: 'var(--font-mono)' }}>
            <Edit3 size={11} /> Enter tokens manually
          </button>
        )}
      </div>
    </div>
  )
}
