'use client'
import { useState, useRef, useEffect } from 'react'
import { HexColorPicker } from 'react-colorful'
import { Lock, Unlock } from 'lucide-react'
import { useTokenStore } from '@/store/tokenStore'

export default function ColorToken({ path, label, value }) {
  const { updateToken, toggleLock, lockedPaths } = useTokenStore()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [localValue, setLocalValue] = useState(value || '#000000')
  const isLocked = lockedPaths.has(path)
  const containerRef = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => { setLocalValue(value || '#000000') }, [value])

  // Close picker on outside click
  useEffect(() => {
    if (!pickerOpen) return
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [pickerOpen])

  const handleChange = (color) => {
    if (isLocked) return
    setLocalValue(color)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateToken(path, color)
    }, 80)
  }

  const handleHexInput = (e) => {
    const val = e.target.value
    setLocalValue(val)
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        updateToken(path, val)
      }, 200)
    }
  }

  const handleLock = (e) => {
    e.stopPropagation()
    toggleLock(path, localValue)
  }

  return (
    <div
      ref={containerRef}
      className={`relative rounded-lg p-2.5 transition-all ${isLocked ? 'token-locked' : ''}`}
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: `1px solid ${isLocked ? 'rgba(139,92,246,0.3)' : 'var(--app-border)'}`,
      }}
    >
      <div className="flex items-center gap-2">
        {/* Color swatch - click to open picker */}
        <button
          onClick={() => !isLocked && setPickerOpen(v => !v)}
          className="w-8 h-8 rounded-md flex-shrink-0 border transition-transform hover:scale-105"
          style={{
            background: localValue,
            borderColor: 'rgba(255,255,255,0.1)',
            cursor: isLocked ? 'not-allowed' : 'pointer',
          }}
        />

        {/* Label + hex input */}
        <div className="flex-1 min-w-0">
          <div className="text-xs mb-0.5" style={{ color: 'var(--app-text-muted)', fontFamily: 'var(--font-mono)' }}>
            {label}
          </div>
          <input
            type="text"
            value={localValue}
            onChange={handleHexInput}
            disabled={isLocked}
            className="w-full text-xs bg-transparent outline-none disabled:opacity-50"
            style={{ color: 'var(--app-text)', fontFamily: 'var(--font-mono)' }}
          />
        </div>

        {/* Lock button */}
        <button
          onClick={handleLock}
          className="w-6 h-6 flex items-center justify-center rounded transition-all hover:opacity-80"
          style={{
            color: isLocked ? 'var(--app-accent)' : 'var(--app-text-muted)',
            animation: isLocked ? 'lock-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
          }}
          title={isLocked ? 'Unlock token' : 'Lock token'}
        >
          {isLocked ? <Lock size={11} /> : <Unlock size={11} />}
        </button>
      </div>

      {/* Color picker dropdown */}
      {pickerOpen && !isLocked && (
        <div className="absolute left-0 top-full mt-2 z-50 rounded-xl overflow-hidden shadow-2xl"
          style={{ border: '1px solid var(--app-border)', background: '#1a1a1a' }}>
          <div className="p-3">
            <HexColorPicker color={localValue} onChange={handleChange} />
            <div className="mt-2 flex items-center gap-2">
              <div className="w-5 h-5 rounded" style={{ background: localValue }} />
              <input
                type="text"
                value={localValue}
                onChange={handleHexInput}
                className="flex-1 text-xs px-2 py-1 rounded outline-none"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--app-border)',
                  color: 'var(--app-text)',
                  fontFamily: 'var(--font-mono)',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
