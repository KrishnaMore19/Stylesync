'use client'
import { useTokenStore } from '@/store/tokenStore'
import { Palette, Type, Maximize2, Sparkles, Home } from 'lucide-react'
import Link from 'next/link'

const tabs = [
  { id: 'colors', label: 'Colors', icon: Palette },
  { id: 'typography', label: 'Type', icon: Type },
  { id: 'spacing', label: 'Space', icon: Maximize2 },
]

export default function Sidebar() {
  const { activeTab, setActiveTab } = useTokenStore()

  return (
    <aside
      className="w-14 flex-shrink-0 flex flex-col items-center py-4 gap-1 border-r"
      style={{ background: 'var(--app-surface)', borderColor: 'var(--app-border)' }}
    >
      {/* Logo */}
      <Link href="/" className="w-8 h-8 rounded-lg flex items-center justify-center mb-4 transition-opacity hover:opacity-70"
        style={{ background: 'var(--app-accent)' }}>
        <Sparkles size={14} className="text-white" />
      </Link>

      <div className="w-6 border-b mb-2" style={{ borderColor: 'var(--app-border)' }} />

      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setActiveTab(id)}
          title={label}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-all relative group"
          style={{
            background: activeTab === id ? 'rgba(139,92,246,0.15)' : 'transparent',
            color: activeTab === id ? 'var(--app-accent)' : 'var(--app-text-muted)',
          }}
        >
          <Icon size={15} />
          {/* Tooltip */}
          <span className="absolute left-full ml-2 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50"
            style={{ background: '#1a1a1a', color: 'var(--app-text)', border: '1px solid var(--app-border)', fontFamily: 'var(--font-mono)' }}>
            {label}
          </span>
        </button>
      ))}

      <div className="flex-1" />

      <Link href="/" title="Home"
        className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:opacity-70"
        style={{ color: 'var(--app-text-muted)' }}>
        <Home size={15} />
      </Link>
    </aside>
  )
}
