'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Zap, Lock, Layers, Download, Globe, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

export default function HomePage() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  // Fix hydration: only animate after client is mounted
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleScrape = async (e) => {
    e.preventDefault()
    if (!url.trim()) return toast.error('Enter a URL first')

    let finalUrl = url.trim()
    if (!finalUrl.startsWith('http')) finalUrl = 'https://' + finalUrl

    setLoading(true)
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: finalUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Scraping failed')
      toast.success('Design tokens extracted!')
      router.push(`/dashboard?siteId=${data.siteId}&tokenId=${data.tokenId}`)
    } catch (err) {
      toast.error(err.message)
      setLoading(false)
    }
  }

  const examples = [
    { label: 'Stripe', url: 'https://stripe.com' },
    { label: 'Linear', url: 'https://linear.app' },
    { label: 'Vercel', url: 'https://vercel.com' },
    { label: 'Figma', url: 'https://figma.com' },
  ]

  const features = [
    { icon: Globe, label: 'Intelligent Scraping', desc: 'Handles SSR, SPAs & static sites' },
    { icon: Layers, label: 'Token Extraction', desc: 'Colors, typography & spacing' },
    { icon: Lock, label: 'Lock & Version', desc: 'Freeze tokens across re-scrapes' },
    { icon: Download, label: 'Export Ready', desc: 'CSS vars, JSON, Tailwind config' },
  ]

  // Shared animation config — only runs after mount to prevent hydration mismatch
  const fadeUp = mounted
    ? { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 } }
    : { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 } }

  const fadeIn = mounted
    ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
    : { initial: { opacity: 1 }, animate: { opacity: 1 } }

  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: 'var(--app-bg)' }}>

      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '400px',
          background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* ── Header ── */}
      <header
        className="relative z-10 flex items-center justify-between px-8 py-5"
        style={{
          borderBottom: '1px solid var(--app-border)',
          backdropFilter: 'blur(8px)',
          background: 'rgba(8,8,8,0.7)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, var(--app-accent), #6d28d9)',
              boxShadow: '0 0 16px rgba(139,92,246,0.35)',
            }}
          >
            <Sparkles size={14} className="text-white" />
          </div>
          <span
            className="text-sm font-semibold tracking-widest uppercase"
            style={{ color: 'var(--app-text)', fontFamily: 'var(--font-mono)', letterSpacing: '0.18em' }}
          >
            StyleSync
          </span>
        </div>

        <div
          className="flex items-center gap-2 px-3 py-1 rounded-full text-xs"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--app-border)',
            color: 'var(--app-text-muted)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          v1.0 — Beta
        </div>
      </header>

      {/* ── Hero ── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-10">

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-3xl w-full"
        >
          {/* Badge */}
          <motion.div
            {...fadeIn}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs mb-5"
            style={{
              background: 'rgba(139,92,246,0.08)',
              border: '1px solid rgba(139,92,246,0.25)',
              color: 'var(--app-accent)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <Zap size={10} />
            Extract design tokens in seconds
          </motion.div>

          {/* Headline */}
          <h1
            className="mb-5 leading-[0.92] tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--app-text)' }}
          >
            <span className="block text-6xl md:text-7xl">Any Website.</span>
            <span
              className="block text-6xl md:text-7xl italic"
              style={{
                color: 'transparent',
                backgroundImage: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
              }}
            >
              Any Style.
            </span>
            <span className="block text-6xl md:text-7xl">Your System.</span>
          </h1>

          {/* Subheading */}
          <p
            className="text-sm md:text-base mb-8 max-w-lg mx-auto"
            style={{
              color: 'var(--app-text-muted)',
              fontFamily: 'var(--font-body)',
              lineHeight: '1.7',
            }}
          >
            Paste a URL. StyleSync scrapes, analyzes, and extracts the complete design DNA —
            colors, typography, spacing — into a living, editable design system.
          </p>

          {/* ── URL Input ── */}
          <form onSubmit={handleScrape} className="max-w-2xl mx-auto mb-5">
            <div
              className="flex items-center gap-2 p-2 rounded-2xl transition-all"
              style={{
                background: 'var(--app-surface)',
                border: '1px solid var(--app-border)',
                boxShadow: '0 0 0 0 transparent',
              }}
              onFocus={(e) => {
                e.currentTarget.style.border = '1px solid rgba(139,92,246,0.45)'
                e.currentTarget.style.boxShadow = '0 0 0 4px rgba(139,92,246,0.08)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.border = '1px solid var(--app-border)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div className="pl-3 pr-1 flex-shrink-0" style={{ color: 'var(--app-text-muted)' }}>
                <Globe size={15} />
              </div>

              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://stripe.com"
                className="flex-1 bg-transparent text-sm outline-none min-w-0"
                style={{ color: 'var(--app-text)', fontFamily: 'var(--font-mono)' }}
              />

              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50 flex-shrink-0"
                style={{
                  background: loading
                    ? 'rgba(139,92,246,0.5)'
                    : 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                  color: 'white',
                  fontFamily: 'var(--font-body)',
                  boxShadow: loading ? 'none' : '0 2px 16px rgba(139,92,246,0.35)',
                  transition: 'all 0.2s ease',
                }}
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing…
                  </>
                ) : (
                  <>
                    Extract
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick examples */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span
              className="text-xs"
              style={{ color: 'var(--app-text-muted)', fontFamily: 'var(--font-mono)' }}
            >
              try →
            </span>
            {examples.map((ex) => (
              <button
                key={ex.label}
                onClick={() => setUrl(ex.url)}
                className="px-3 py-1 rounded-lg text-xs transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--app-border)',
                  color: 'var(--app-text-muted)',
                  fontFamily: 'var(--font-mono)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'
                  e.currentTarget.style.color = 'var(--app-accent)'
                  e.currentTarget.style.background = 'rgba(139,92,246,0.06)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--app-border)'
                  e.currentTarget.style.color = 'var(--app-text-muted)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                }}
              >
                {ex.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Feature Cards ── */}
        <motion.div
          {...fadeIn}
          transition={{ delay: mounted ? 0.3 : 0, duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-10 max-w-3xl w-full"
        >
          {features.map(({ icon: Icon, label, desc }, i) => (
            <motion.div
              key={label}
              {...fadeUp}
              transition={{ delay: mounted ? 0.35 + i * 0.07 : 0, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="group p-4 rounded-2xl cursor-default transition-all"
              style={{
                background: 'var(--app-surface)',
                border: '1px solid var(--app-border)',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)'
                e.currentTarget.style.boxShadow = '0 0 24px rgba(139,92,246,0.08)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--app-border)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
                style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.15)' }}
              >
                <Icon size={15} style={{ color: 'var(--app-accent)' }} />
              </div>
              <div
                className="text-sm font-medium mb-1"
                style={{ color: 'var(--app-text)', fontFamily: 'var(--font-body)' }}
              >
                {label}
              </div>
              <div
                className="text-xs leading-relaxed"
                style={{ color: 'var(--app-text-muted)', fontFamily: 'var(--font-body)' }}
              >
                {desc}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* ── Footer ── */}
      <footer
        className="relative z-10 px-8 py-4 flex items-center justify-between"
        style={{ borderTop: '1px solid var(--app-border)' }}
      >
        <span
          className="text-xs"
          style={{ color: 'var(--app-text-muted)', fontFamily: 'var(--font-mono)' }}
        >
          StyleSync © 2026
        </span>
        <span
          className="text-xs"
          style={{ color: 'var(--app-text-muted)', fontFamily: 'var(--font-mono)' }}
        >
          Purple Merit Technologies — Assessment
        </span>
      </footer>
    </main>
  )
}