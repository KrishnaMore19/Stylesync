'use client'
import { useState, useRef } from 'react'
import { Lock, Unlock } from 'lucide-react'
import { useTokenStore } from '@/store/tokenStore'

const COMMON_FONTS = [
  'Georgia, serif', 'Playfair Display, serif', 'Merriweather, serif',
  'Inter, sans-serif', 'DM Sans, sans-serif', 'Outfit, sans-serif',
  'Helvetica Neue, sans-serif', 'system-ui, sans-serif',
  'JetBrains Mono, monospace', 'Fira Code, monospace',
]

export default function TypographyToken({ path, label, value, type }) {
  const { updateToken, toggleLock, lockedPaths } = useTokenStore()
  const [localValue, setLocalValue] = useState(value || '')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const isLocked = lockedPaths.has(path)
  const debounceRef = useRef(null)

  const handleChange = (val) => {
    if (isLocked) return
    setLocalValue(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => updateToken(path, val), 300)
  }

  const handleLock = () => toggleLock(path, localValue)

  return (
    <div
      className="rounded-lg p-2.5 transition-all"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: `1px solid ${isLocked ? 'rgba(139,92,246,0.3)' : 'var(--app-border)'}`,
      }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs" style={{ color: 'var(--app-text-muted)', fontFamily: 'var(--font-mono)' }}>
          {label}
        </span>
        <button onClick={handleLock} className="transition-all hover:opacity-80"
          style={{ color: isLocked ? 'var(--app-accent)' : 'var(--app-text-muted)' }}>
          {isLocked ? <Lock size={10} /> : <Unlock size={10} />}
        </button>
      </div>

      {type === 'font' ? (
        <div className="relative">
          <input
            type="text"
            value={localValue}
            onChange={e => handleChange(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            disabled={isLocked}
            className="w-full text-xs px-2 py-1.5 rounded outline-none disabled:opacity-50"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--app-border)',
              color: 'var(--app-text)',
              fontFamily: localValue || 'var(--font-mono)',
            }}
          />
          {/* Font preview */}
          <div className="mt-1.5 text-sm px-1 truncate" style={{
            fontFamily: localValue,
            color: 'var(--app-text)',
            opacity: 0.7,
          }}>
            The quick brown fox
          </div>
          {/* Suggestions */}
          {showSuggestions && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-lg overflow-hidden z-50 max-h-40 overflow-y-auto"
              style={{ background: '#1a1a1a', border: '1px solid var(--app-border)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
              {COMMON_FONTS.filter(f => f.toLowerCase().includes(localValue.toLowerCase())).map(font => (
                <button key={font} onMouseDown={() => handleChange(font)}
                  className="w-full text-left px-3 py-2 text-xs hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--app-text)', fontFamily: font }}>
                  {font}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type={type === 'number' ? 'number' : 'text'}
            value={localValue}
            onChange={e => handleChange(e.target.value)}
            disabled={isLocked}
            step={type === 'number' ? '0.05' : undefined}
            min={type === 'number' ? '0.5' : undefined}
            max={type === 'number' ? '3' : undefined}
            className="flex-1 text-xs px-2 py-1.5 rounded outline-none disabled:opacity-50"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--app-border)',
              color: 'var(--app-text)',
              fontFamily: 'var(--font-mono)',
            }}
          />
        </div>
      )}
    </div>
  )
}
