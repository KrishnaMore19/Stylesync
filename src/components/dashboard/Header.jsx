'use client'
import { useState } from 'react'
import { useTokenStore } from '@/store/tokenStore'
import { Download, RefreshCw, ExternalLink, ChevronDown, Check } from 'lucide-react'
import toast from 'react-hot-toast'

const FORMAT_OPTIONS = [
  { value: 'css', label: 'CSS Variables', ext: '.css' },
  { value: 'json', label: 'JSON Tokens', ext: '.json' },
  { value: 'tailwind', label: 'Tailwind Config', ext: '.js' },
]

export default function Header({ siteId, tokenId }) {
  const { siteMeta, exportTokens, loading } = useTokenStore()
  const [exportOpen, setExportOpen] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState('css')

  const handleExport = async () => {
    if (!tokenId) return toast.error('No tokens to export')
    await exportTokens(selectedFormat)
    setExportOpen(false)
    toast.success('Export downloaded!')
  }

  return (
    <header
      className="h-12 flex items-center justify-between px-4 border-b flex-shrink-0"
      style={{ background: 'var(--app-surface)', borderColor: 'var(--app-border)' }}
    >
      {/* Site info */}
      <div className="flex items-center gap-3">
        {siteMeta?.favicon && (
          <img src={siteMeta.favicon} alt="" className="w-4 h-4 rounded-sm" onError={e => e.target.style.display = 'none'} />
        )}
        <div>
          <span className="text-sm font-medium" style={{ color: 'var(--app-text)', fontFamily: 'var(--font-body)' }}>
            {siteMeta?.title || 'Untitled Site'}
          </span>
          {siteMeta?.url && (
            <a href={siteMeta.url} target="_blank" rel="noopener noreferrer"
              className="ml-2 text-xs flex-inline items-center gap-1 hover:opacity-70 transition-opacity"
              style={{ color: 'var(--app-text-muted)', fontFamily: 'var(--font-mono)' }}>
              {new URL(siteMeta.url).hostname}
              <ExternalLink size={9} className="inline ml-0.5" />
            </a>
          )}
        </div>
        {siteMeta?.extractionStatus === 'fallback' && (
          <span className="px-2 py-0.5 rounded text-xs" style={{
            background: 'rgba(245,158,11,0.1)',
            color: '#f59e0b',
            border: '1px solid rgba(245,158,11,0.2)',
            fontFamily: 'var(--font-mono)',
          }}>
            simulated
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Export dropdown */}
        <div className="relative">
          <div className="flex items-stretch rounded-lg overflow-hidden border" style={{ borderColor: 'var(--app-border)' }}>
            <button
              onClick={handleExport}
              disabled={!tokenId}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs transition-all disabled:opacity-40"
              style={{ background: 'rgba(139,92,246,0.1)', color: 'var(--app-accent)', fontFamily: 'var(--font-mono)' }}
            >
              <Download size={12} />
              Export {FORMAT_OPTIONS.find(f => f.value === selectedFormat)?.ext}
            </button>
            <button
              onClick={() => setExportOpen(v => !v)}
              className="px-2 border-l transition-all"
              style={{ background: 'rgba(139,92,246,0.1)', color: 'var(--app-accent)', borderColor: 'rgba(139,92,246,0.2)' }}
            >
              <ChevronDown size={12} />
            </button>
          </div>

          {exportOpen && (
            <div className="absolute right-0 top-full mt-1 rounded-lg overflow-hidden z-50 w-40"
              style={{ background: '#1a1a1a', border: '1px solid var(--app-border)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
              {FORMAT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setSelectedFormat(opt.value); setExportOpen(false) }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-all hover:opacity-80"
                  style={{ color: 'var(--app-text)', fontFamily: 'var(--font-mono)' }}
                >
                  {opt.label}
                  {selectedFormat === opt.value && <Check size={10} style={{ color: 'var(--app-accent)' }} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
