'use client'
import { useState, useRef } from 'react'
import { Lock, Unlock } from 'lucide-react'
import { useTokenStore } from '@/store/tokenStore'

export default function SpacingToken({ path, label, value }) {
  const { updateToken, toggleLock, lockedPaths } = useTokenStore()
  const [localValue, setLocalValue] = useState(value || '0px')
  const isLocked = lockedPaths.has(path)
  const dragRef = useRef(null)
  const startXRef = useRef(null)
  const startValRef = useRef(null)

  const getPxValue = (v) => parseInt(v) || 0

  const handleDragStart = (e) => {
    if (isLocked) return
    startXRef.current = e.clientX
    startValRef.current = getPxValue(localValue)
    window.addEventListener('mousemove', handleDragMove)
    window.addEventListener('mouseup', handleDragEnd)
    document.body.style.cursor = 'ew-resize'
    document.body.style.userSelect = 'none'
  }

  const handleDragMove = (e) => {
    const delta = Math.round((e.clientX - startXRef.current) / 4)
    const newVal = Math.max(0, Math.min(256, startValRef.current + delta))
    const newStr = `${newVal}px`
    setLocalValue(newStr)
    updateToken(path, newStr)
  }

  const handleDragEnd = () => {
    window.removeEventListener('mousemove', handleDragMove)
    window.removeEventListener('mouseup', handleDragEnd)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  const handleInput = (e) => {
    if (isLocked) return
    const val = e.target.value
    setLocalValue(val)
    if (/^\d+px$/.test(val) || /^\d+$/.test(val)) {
      const normalized = /^\d+$/.test(val) ? `${val}px` : val
      updateToken(path, normalized)
    }
  }

  const pxVal = getPxValue(localValue)
  const barWidth = Math.min(100, (pxVal / 128) * 100)

  return (
    <div className="rounded-lg p-2.5 transition-all"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: `1px solid ${isLocked ? 'rgba(139,92,246,0.3)' : 'var(--app-border)'}`,
      }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs" style={{ color: 'var(--app-text-muted)', fontFamily: 'var(--font-mono)' }}>
          {label}
        </span>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={localValue}
            onChange={handleInput}
            disabled={isLocked}
            className="w-14 text-xs text-right px-1 py-0.5 rounded outline-none disabled:opacity-50"
            style={{
              background: 'transparent',
              color: 'var(--app-text)',
              fontFamily: 'var(--font-mono)',
            }}
          />
          <button onClick={() => toggleLock(path, localValue)}
            style={{ color: isLocked ? 'var(--app-accent)' : 'var(--app-text-muted)' }}>
            {isLocked ? <Lock size={10} /> : <Unlock size={10} />}
          </button>
        </div>
      </div>

      {/* Visual bar with drag handle */}
      <div className="relative h-6 rounded overflow-hidden cursor-ew-resize"
        style={{ background: 'rgba(255,255,255,0.04)' }}
        onMouseDown={handleDragStart}
        ref={dragRef}
      >
        <div className="h-full rounded transition-all duration-75"
          style={{
            width: `${barWidth}%`,
            background: isLocked
              ? 'linear-gradient(90deg, rgba(139,92,246,0.4), rgba(139,92,246,0.2))'
              : 'linear-gradient(90deg, rgba(139,92,246,0.6), rgba(99,102,241,0.3))',
          }}
        />
        {/* Drag handle */}
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-0.5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-px h-3 rounded-full" style={{ background: 'rgba(255,255,255,0.3)' }} />
          ))}
        </div>
      </div>
    </div>
  )
}
