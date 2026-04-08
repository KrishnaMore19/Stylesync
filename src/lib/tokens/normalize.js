/**
 * Normalizes raw scraped data into structured design tokens
 */
export function normalizeTokens(rawData) {
  return {
    colors: normalizeColors(rawData.colors),
    typography: normalizeTypography(rawData.fonts),
    spacing: normalizeSpacing(rawData.spacing),
  }
}

function normalizeColors(rawColors = {}) {
  return {
    primary: rawColors.primary || '#1a1a1a',
    secondary: rawColors.secondary || '#4a4a4a',
    accent: rawColors.accent || '#6366f1',
    background: rawColors.background || '#ffffff',
    surface: rawColors.surface || '#f8fafc',
    text: rawColors.text || '#0f172a',
    textMuted: rawColors.textMuted || '#64748b',
    border: rawColors.border || '#e2e8f0',
    success: rawColors.success || '#10b981',
    error: rawColors.error || '#ef4444',
    warning: rawColors.warning || '#f59e0b',
    palette: rawColors.palette || [],
  }
}

function normalizeTypography(rawFonts = {}) {
  return {
    headingFont: sanitizeFont(rawFonts.headingFont) || 'Georgia, serif',
    bodyFont: sanitizeFont(rawFonts.bodyFont) || 'system-ui, sans-serif',
    monoFont: sanitizeFont(rawFonts.monoFont) || 'monospace',
    baseSize: rawFonts.baseSize || '16px',
    scaleRatio: rawFonts.scaleRatio || '1.25',
    weights: rawFonts.weights || { light: 300, normal: 400, medium: 500, semibold: 600, bold: 700 },
    lineHeights: rawFonts.lineHeights || { tight: 1.2, normal: 1.5, relaxed: 1.75 },
    detected: rawFonts.detected || [],
  }
}

function normalizeSpacing(rawSpacing = {}) {
  return {
    unit: rawSpacing.unit || 4,
    baseUnit: rawSpacing.baseUnit || '4px',
    scale: rawSpacing.scale || [0, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128],
    named: rawSpacing.named || {
      xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px', '2xl': '48px',
    },
  }
}

function sanitizeFont(font) {
  if (!font) return null
  return font.replace(/[<>'"]/g, '').trim()
}
