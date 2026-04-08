'use client'
import { useTokenStore } from '@/store/tokenStore'

export default function ComponentGrid() {
  const { colors, typography, spacing } = useTokenStore()

  if (!colors.primary) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-4xl mb-4">✦</div>
          <p className="text-sm" style={{ color: 'var(--app-text-muted)', fontFamily: 'var(--font-mono)' }}>
            Scrape a URL to see<br />your design system come alive
          </p>
        </div>
      </div>
    )
  }

  const t = {
    primary: colors.primary || '#1a1a1a',
    secondary: colors.secondary || '#4a4a4a',
    accent: colors.accent || '#6366f1',
    background: colors.background || '#ffffff',
    surface: colors.surface || '#f8fafc',
    text: colors.text || '#111111',
    textMuted: colors.textMuted || '#6b7280',
    border: colors.border || '#e2e8f0',
    success: colors.success || '#10b981',
    error: colors.error || '#ef4444',
    warning: colors.warning || '#f59e0b',
    headingFont: typography.headingFont || 'Georgia, serif',
    bodyFont: typography.bodyFont || 'system-ui, sans-serif',
    monoFont: typography.monoFont || 'monospace',
    baseSize: typography.baseSize || '16px',
    weightNormal: typography.weights?.normal || 400,
    weightMedium: typography.weights?.medium || 500,
    weightBold: typography.weights?.bold || 700,
    lineNormal: typography.lineHeights?.normal || 1.5,
    spacingXs: spacing.named?.xs || '4px',
    spacingSm: spacing.named?.sm || '8px',
    spacingMd: spacing.named?.md || '16px',
    spacingLg: spacing.named?.lg || '24px',
    spacingXl: spacing.named?.xl || '32px',
    radius: '8px',
    radiusLg: '12px',
    radiusFull: '9999px',
  }

  const btnBase = {
    fontFamily: t.bodyFont,
    fontSize: t.baseSize,
    fontWeight: t.weightMedium,
    padding: `${t.spacingSm} ${t.spacingMd}`,
    borderRadius: t.radius,
    cursor: 'pointer',
    border: 'none',
    transition: 'opacity 0.15s ease',
    display: 'inline-block',
  }

  const cardBase = {
    background: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: t.radiusLg,
    padding: t.spacingLg,
  }

  const inputBase = {
    background: t.background,
    color: t.text,
    fontFamily: t.bodyFont,
    fontSize: t.baseSize,
    padding: `${t.spacingSm} ${t.spacingMd}`,
    borderRadius: t.radius,
    border: `1px solid ${t.border}`,
    outline: 'none',
    width: '100%',
    display: 'block',
  }

  return (
    <div style={{ background: t.background, minHeight: '100%', padding: t.spacingXl }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: t.spacingXl }}>
        <div style={{ width: '3px', height: '20px', background: t.primary, borderRadius: '2px' }} />
        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: t.textMuted, fontFamily: t.monoFont }}>
          Live Component Preview
        </span>
      </div>

      {/* TYPOGRAPHY */}
      <Section label="Typography Scale" t={t}>
        <div style={{ ...cardBase, display: 'flex', flexDirection: 'column', gap: t.spacingMd }}>
          {[
            { text: 'Heading 1 — Display', size: 'clamp(1.8rem,3.5vw,2.8rem)', weight: t.weightBold, font: t.headingFont },
            { text: 'Heading 2 — Title', size: 'clamp(1.4rem,2.5vw,2rem)', weight: t.weightBold, font: t.headingFont },
            { text: 'Heading 3 — Subtitle', size: '1.25rem', weight: t.weightMedium, font: t.headingFont },
            { text: 'Heading 4 — Section', size: '1rem', weight: t.weightMedium, font: t.headingFont },
            { text: 'Body — The quick brown fox jumps over the lazy dog.', size: t.baseSize, weight: t.weightNormal, font: t.bodyFont },
            { text: 'Caption — Small supporting text', size: '0.75rem', weight: t.weightNormal, font: t.bodyFont },
          ].map(({ text, size, weight, font }) => (
            <div key={text} style={{ fontSize: size, fontWeight: weight, fontFamily: font, color: t.text, lineHeight: t.lineNormal }}>
              {text}
            </div>
          ))}
        </div>
      </Section>

      {/* BUTTONS */}
      <Section label="Buttons" t={t}>
        <div style={{ ...cardBase, display: 'flex', flexWrap: 'wrap', gap: t.spacingSm, alignItems: 'center' }}>
          <button style={{ ...btnBase, background: t.primary, color: t.background }}>Primary</button>
          <button style={{ ...btnBase, background: t.surface, color: t.text, border: `1px solid ${t.border}` }}>Secondary</button>
          <button style={{ ...btnBase, background: 'transparent', color: t.primary, border: `1px solid ${t.primary}` }}>Ghost</button>
          <button style={{ ...btnBase, background: t.accent, color: '#fff' }}>Accent</button>
          <button style={{ ...btnBase, background: t.primary, color: t.background, opacity: 0.35, cursor: 'not-allowed' }} disabled>Disabled</button>
          <button style={{ ...btnBase, background: t.primary, color: t.background, borderRadius: t.radiusFull, padding: `${t.spacingSm} ${t.spacingLg}` }}>✦ Pill</button>
          <button style={{ ...btnBase, background: t.error, color: '#fff' }}>Destructive</button>
          <button style={{ ...btnBase, background: t.success, color: '#fff' }}>Success</button>
        </div>
      </Section>

      {/* INPUTS */}
      <Section label="Form Inputs" t={t}>
        <div style={{ ...cardBase, display: 'flex', flexDirection: 'column', gap: t.spacingMd }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: t.textMuted, fontFamily: t.bodyFont, marginBottom: t.spacingXs }}>Email address</label>
            <input type="email" placeholder="hello@example.com" style={inputBase} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: t.textMuted, fontFamily: t.bodyFont, marginBottom: t.spacingXs }}>Focus state</label>
            <input type="text" placeholder="@username" style={{ ...inputBase, border: `2px solid ${t.primary}`, boxShadow: `0 0 0 3px ${t.primary}22` }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: t.textMuted, fontFamily: t.bodyFont, marginBottom: t.spacingXs }}>
              Password <span style={{ color: t.error }}>*</span>
            </label>
            <input type="password" placeholder="Enter password" style={{ ...inputBase, border: `1px solid ${t.error}` }} />
            <p style={{ fontSize: '0.72rem', color: t.error, fontFamily: t.bodyFont, marginTop: t.spacingXs }}>Password must be at least 8 characters</p>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: t.textMuted, fontFamily: t.bodyFont, marginBottom: t.spacingXs }}>Role</label>
            <select style={{ ...inputBase, cursor: 'pointer' }}>
              <option>Designer</option><option>Developer</option><option>Product Manager</option>
            </select>
          </div>
        </div>
      </Section>

      {/* CARDS */}
      <Section label="Cards" t={t}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: t.spacingMd }}>
          <div style={cardBase}>
            <div style={{ width: '36px', height: '36px', borderRadius: t.radius, background: t.accent, marginBottom: t.spacingMd }} />
            <div style={{ fontSize: '1rem', fontWeight: t.weightBold, fontFamily: t.headingFont, color: t.text, marginBottom: t.spacingXs }}>Default Card</div>
            <p style={{ fontSize: '0.85rem', fontFamily: t.bodyFont, color: t.textMuted, lineHeight: t.lineNormal }}>Standard card with surface background and border tokens applied.</p>
            <button style={{ ...btnBase, background: t.primary, color: t.background, marginTop: t.spacingMd, fontSize: '0.8rem' }}>Learn more</button>
          </div>
          <div style={{ ...cardBase, boxShadow: `0 8px 30px ${t.primary}22`, borderRadius: '16px' }}>
            <div style={{ width: '100%', height: '80px', borderRadius: t.radius, marginBottom: t.spacingMd, background: `linear-gradient(135deg, ${t.primary}, ${t.accent})` }} />
            <div style={{ fontSize: '1rem', fontWeight: t.weightBold, fontFamily: t.headingFont, color: t.text, marginBottom: t.spacingXs }}>Elevated Card</div>
            <p style={{ fontSize: '0.85rem', fontFamily: t.bodyFont, color: t.textMuted, lineHeight: t.lineNormal }}>Gradient hero: primary → accent. Deep shadow.</p>
          </div>
          <div style={{ borderRadius: t.radiusLg, border: `2px solid ${t.primary}`, padding: t.spacingLg }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: t.spacingMd }}>
              <span style={{ fontSize: '0.9rem', fontWeight: t.weightMedium, fontFamily: t.bodyFont, color: t.text }}>Outlined Card</span>
              <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: t.radiusFull, background: t.primary, color: t.background, fontFamily: t.monoFont }}>BADGE</span>
            </div>
            <p style={{ fontSize: '0.85rem', fontFamily: t.bodyFont, color: t.textMuted, lineHeight: t.lineNormal }}>Heavy border using primary. No background fill.</p>
          </div>
        </div>
      </Section>

      {/* COLOR SWATCHES */}
      <Section label="Color System" t={t}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: t.spacingSm }}>
          {[
            { name: 'Primary', value: t.primary },
            { name: 'Secondary', value: t.secondary },
            { name: 'Accent', value: t.accent },
            { name: 'Background', value: t.background },
            { name: 'Surface', value: t.surface },
            { name: 'Text', value: t.text },
            { name: 'Text Muted', value: t.textMuted },
            { name: 'Border', value: t.border },
            { name: 'Success', value: t.success },
            { name: 'Error', value: t.error },
            { name: 'Warning', value: t.warning },
          ].map(({ name, value }) => (
            <div key={name} style={{ borderRadius: t.radius, overflow: 'hidden', border: `1px solid ${t.border}` }}>
              <div style={{ height: '44px', background: value }} />
              <div style={{ padding: '8px 10px', background: t.surface }}>
                <div style={{ fontSize: '0.78rem', fontWeight: t.weightMedium, color: t.text, fontFamily: t.bodyFont }}>{name}</div>
                <div style={{ fontSize: '0.68rem', color: t.textMuted, fontFamily: t.monoFont }}>{value}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* BADGES */}
      <Section label="Badges & Tags" t={t}>
        <div style={{ ...cardBase, display: 'flex', flexWrap: 'wrap', gap: t.spacingSm, alignItems: 'center' }}>
          {[
            { label: 'Primary', bg: t.primary, color: t.background },
            { label: 'Accent', bg: t.accent, color: '#fff' },
            { label: 'Success', bg: t.success, color: '#fff' },
            { label: 'Warning', bg: t.warning, color: '#fff' },
            { label: 'Error', bg: t.error, color: '#fff' },
          ].map(({ label, bg, color }) => (
            <span key={label} style={{ padding: '3px 12px', borderRadius: t.radiusFull, fontSize: '0.72rem', fontWeight: t.weightMedium, fontFamily: t.bodyFont, background: bg, color }}>
              {label}
            </span>
          ))}
          {['Tag', 'Label', 'Token'].map(label => (
            <span key={label} style={{ padding: '3px 12px', borderRadius: t.radiusFull, fontSize: '0.72rem', fontWeight: t.weightMedium, fontFamily: t.monoFont, background: 'transparent', color: t.primary, border: `1px solid ${t.primary}` }}>
              {label}
            </span>
          ))}
        </div>
      </Section>

      {/* ALERTS */}
      <Section label="Alerts" t={t}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: t.spacingSm }}>
          {[
            { label: 'Success', color: t.success, msg: 'Your changes have been saved successfully.' },
            { label: 'Error', color: t.error, msg: 'Something went wrong. Please try again.' },
            { label: 'Warning', color: t.warning, msg: 'This action cannot be undone.' },
          ].map(({ label, color, msg }) => (
            <div key={label} style={{ padding: `${t.spacingSm} ${t.spacingMd}`, borderRadius: t.radius, background: `${color}15`, border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', gap: t.spacingSm }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span style={{ fontSize: '0.78rem', fontWeight: t.weightMedium, color, fontFamily: t.bodyFont }}>{label}: </span>
              <span style={{ fontSize: '0.78rem', color: t.text, fontFamily: t.bodyFont }}>{msg}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* SPACING */}
      <Section label="Spacing Scale" t={t}>
        <div style={{ ...cardBase, display: 'flex', flexDirection: 'column', gap: t.spacingSm }}>
          {Object.entries(spacing.named || {}).map(([key, val]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: t.spacingMd }}>
              <span style={{ width: '36px', fontSize: '0.72rem', color: t.textMuted, fontFamily: t.monoFont }}>{key}</span>
              <div style={{ height: '18px', width: val, background: t.primary, borderRadius: '3px', minWidth: '4px' }} />
              <span style={{ fontSize: '0.72rem', color: t.textMuted, fontFamily: t.monoFont }}>{val}</span>
            </div>
          ))}
        </div>
      </Section>

      <div style={{ height: '48px' }} />
    </div>
  )
}

function Section({ label, t, children }) {
  return (
    <div style={{ marginBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: t.textMuted, fontFamily: t.monoFont, whiteSpace: 'nowrap' }}>
          {label}
        </span>
        <div style={{ flex: 1, height: '1px', background: t.border }} />
      </div>
      {children}
    </div>
  )
}