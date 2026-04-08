'use client'
import { useTokenStore } from '@/store/tokenStore'
import ColorToken from '@/components/tokens/ColorToken'
import TypographyToken from '@/components/tokens/TypographyToken'
import SpacingToken from '@/components/tokens/SpacingToken'
import Loader from '@/components/shared/Loader'

export default function TokenPanel({ tokenId }) {
  const { activeTab, colors, typography, spacing, loading, error } = useTokenStore()

  if (loading) return (
    <div className="p-4 space-y-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="skeleton h-16 rounded-lg" />
      ))}
    </div>
  )

  if (error) return (
    <div className="p-4">
      <div className="p-3 rounded-lg text-xs" style={{
        background: 'rgba(239,68,68,0.08)',
        border: '1px solid rgba(239,68,68,0.2)',
        color: '#ef4444',
        fontFamily: 'var(--font-mono)',
      }}>
        {error}
      </div>
    </div>
  )

  if (!tokenId) return (
    <div className="p-4 flex items-center justify-center h-full">
      <p className="text-xs text-center" style={{ color: 'var(--app-text-muted)', fontFamily: 'var(--font-mono)' }}>
        No tokens loaded.<br />Scrape a URL to begin.
      </p>
    </div>
  )

  return (
    <div className="p-3 space-y-2">
      {/* Section label */}
      <div className="flex items-center gap-2 px-1 py-2">
        <span className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--app-text-muted)', fontFamily: 'var(--font-mono)' }}>
          {activeTab === 'colors' ? 'Color Tokens' : activeTab === 'typography' ? 'Typography' : 'Spacing'}
        </span>
        <div className="flex-1 h-px" style={{ background: 'var(--app-border)' }} />
      </div>

      {activeTab === 'colors' && <ColorTokens colors={colors} />}
      {activeTab === 'typography' && <TypographyTokens typography={typography} />}
      {activeTab === 'spacing' && <SpacingTokens spacing={spacing} />}
    </div>
  )
}

function ColorTokens({ colors }) {
  const colorEntries = [
    { path: 'colors.primary', label: 'Primary', value: colors.primary },
    { path: 'colors.secondary', label: 'Secondary', value: colors.secondary },
    { path: 'colors.accent', label: 'Accent', value: colors.accent },
    { path: 'colors.background', label: 'Background', value: colors.background },
    { path: 'colors.surface', label: 'Surface', value: colors.surface },
    { path: 'colors.text', label: 'Text', value: colors.text },
    { path: 'colors.textMuted', label: 'Text Muted', value: colors.textMuted },
    { path: 'colors.border', label: 'Border', value: colors.border },
    { path: 'colors.success', label: 'Success', value: colors.success },
    { path: 'colors.error', label: 'Error', value: colors.error },
    { path: 'colors.warning', label: 'Warning', value: colors.warning },
  ]

  return (
    <div className="space-y-1.5">
      {colorEntries.map(entry => (
        <ColorToken key={entry.path} {...entry} />
      ))}

      {/* Palette */}
      {colors.palette?.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-2 px-1 py-2">
            <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--app-text-muted)', fontFamily: 'var(--font-mono)' }}>
              Detected Palette
            </span>
            <div className="flex-1 h-px" style={{ background: 'var(--app-border)' }} />
          </div>
          <div className="flex flex-wrap gap-1.5 px-1">
            {colors.palette.map((color, i) => (
              <div
                key={i}
                title={color}
                className="w-7 h-7 rounded-md border cursor-pointer transition-transform hover:scale-110"
                style={{ background: color, borderColor: 'var(--app-border)' }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TypographyTokens({ typography }) {
  return (
    <div className="space-y-1.5">
      <TypographyToken
        path="typography.headingFont"
        label="Heading Font"
        value={typography.headingFont}
        type="font"
      />
      <TypographyToken
        path="typography.bodyFont"
        label="Body Font"
        value={typography.bodyFont}
        type="font"
      />
      <TypographyToken
        path="typography.monoFont"
        label="Mono Font"
        value={typography.monoFont}
        type="font"
      />
      <TypographyToken
        path="typography.baseSize"
        label="Base Size"
        value={typography.baseSize}
        type="size"
      />

      {/* Line Heights */}
      <div className="mt-3">
        <div className="flex items-center gap-2 px-1 py-2">
          <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--app-text-muted)', fontFamily: 'var(--font-mono)' }}>
            Line Heights
          </span>
          <div className="flex-1 h-px" style={{ background: 'var(--app-border)' }} />
        </div>
        {['tight', 'normal', 'relaxed'].map(key => (
          <TypographyToken
            key={key}
            path={`typography.lineHeights.${key}`}
            label={key.charAt(0).toUpperCase() + key.slice(1)}
            value={typography.lineHeights?.[key]}
            type="number"
          />
        ))}
      </div>
    </div>
  )
}

function SpacingTokens({ spacing }) {
  return (
    <div className="space-y-1.5">
      <SpacingToken
        path="spacing.baseUnit"
        label="Base Unit"
        value={spacing.baseUnit}
      />
      {spacing.named && Object.entries(spacing.named).map(([key, val]) => (
        <SpacingToken
          key={key}
          path={`spacing.named.${key}`}
          label={key.toUpperCase()}
          value={val}
        />
      ))}
    </div>
  )
}
