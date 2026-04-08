import * as cheerio from 'cheerio'

const TIMEOUT = 15000
const CSS_FETCH_TIMEOUT = 8000

export async function scrapeUrl(url) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
      },
    })

    clearTimeout(timeoutId)
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)

    const html = await response.text()
    return parseHtml(html, url)
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') throw new Error('Request timed out after 15 seconds')
    throw error
  }
}

// ─── FETCH EXTERNAL CSS ──────────────────────────────────────────────────────
// This is the #1 fix: modern sites (Stripe, Linear, Vercel, Figma) store
// ALL their design tokens in external .css bundles, never in <style> tags.

async function fetchExternalStylesheets($, parsed) {
  const hrefs = []

  $('link[rel="stylesheet"]').each((_, el) => {
    let href = $(el).attr('href') || ''
    if (!href || href.startsWith('data:')) return
    if (href.startsWith('//')) href = `${parsed.protocol}${href}`
    else if (href.startsWith('/')) href = `${parsed.origin}${href}`
    else if (!href.startsWith('http')) href = `${parsed.origin}/${href}`
    hrefs.push(href)
  })

  // Fetch up to 6 stylesheets concurrently (largest ones first heuristic)
  const results = await Promise.allSettled(
    hrefs.slice(0, 6).map(href =>
      fetchWithTimeout(href, CSS_FETCH_TIMEOUT).catch(() => '')
    )
  )

  return results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value)
    .join('\n')
}

async function fetchWithTimeout(url, ms) {
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), ms)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36' },
    })
    clearTimeout(id)
    if (!res.ok) return ''
    return await res.text()
  } catch {
    clearTimeout(id)
    return ''
  }
}

// ─── MAIN PARSER ─────────────────────────────────────────────────────────────

async function parseHtml(html, baseUrl) {
  const $ = cheerio.load(html)
  const parsed = new URL(baseUrl)

  // Fetch external CSS — this is what makes token extraction accurate
  const externalCss = await fetchExternalStylesheets($, parsed)

  // All CSS content: inline style tags + external sheets
  const allCss = $('style').map((_, el) => $(el).text()).get().join('\n') + '\n' + externalCss

  return {
    title: $('title').text().trim() || $('meta[property="og:title"]').attr('content') || '',
    favicon: extractFavicon($, parsed),
    colors: extractColors($, html, allCss),
    fonts: extractFonts($, allCss),
    spacing: extractSpacing($, allCss),
    images: extractImages($, parsed),
    meta: {
      description: $('meta[name="description"]').attr('content') || '',
      themeColor: $('meta[name="theme-color"]').attr('content') || '',
    },
  }
}

// ─── FAVICON ─────────────────────────────────────────────────────────────────

function extractFavicon($, parsed) {
  const favicon =
    $('link[rel="icon"]').attr('href') ||
    $('link[rel="shortcut icon"]').attr('href') ||
    $('link[rel="apple-touch-icon"]').attr('href')

  if (!favicon) return `${parsed.origin}/favicon.ico`
  if (favicon.startsWith('http')) return favicon
  if (favicon.startsWith('//')) return `${parsed.protocol}${favicon}`
  return `${parsed.origin}${favicon}`
}

// ─── COLOR EXTRACTION ────────────────────────────────────────────────────────

function extractColors($, html, allCss) {
  // Step 1: Extract semantic CSS custom properties (most reliable)
  // These are variables like --color-primary, --brand-blue, --accent, etc.
  const semanticMap = extractSemanticCssVars(allCss)

  // Step 2: Collect ALL hex/rgb colors from CSS
  const colorSet = new Set()

  const colorPropRegex = /(?:^|[{;,\s])(?:color|background(?:-color)?|border(?:-color)?|fill|stroke|outline-color|caret-color|text-decoration-color|column-rule-color|accent-color)\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))/gm
  let m

  // From inline HTML styles
  while ((m = colorPropRegex.exec(html)) !== null) colorSet.add(m[1].trim())

  // From all CSS (inline + external)
  colorPropRegex.lastIndex = 0
  while ((m = colorPropRegex.exec(allCss)) !== null) colorSet.add(m[1].trim())

  // From meta theme-color
  const themeColor = $('meta[name="theme-color"]').attr('content')
  if (themeColor && themeColor.startsWith('#')) colorSet.add(themeColor)

  // Normalize and deduplicate
  const hexColors = [...colorSet]
    .map(normalizeColor)
    .filter(Boolean)
    .filter((c, i, arr) => arr.indexOf(c) === i)
    .filter(c => c !== '#000000' && c !== '#ffffff' && c !== '#000' && c !== '#fff') // skip pure black/white noise
    .slice(0, 80)

  return categorizeColors(hexColors, semanticMap, themeColor)
}

// ─── SEMANTIC CSS VARIABLE EXTRACTION ────────────────────────────────────────
// This is the #2 fix: sites that use design tokens expose them as CSS vars.
// Stripe uses --colorBackgroundPrimary, Linear uses --color-accent, etc.

function extractSemanticCssVars(css) {
  const map = {
    primary: null,
    secondary: null,
    accent: null,
    background: null,
    surface: null,
    text: null,
    textMuted: null,
    border: null,
  }

  // Match: --something-primary: #hex or rgb(...)
  // The regex captures the var name and its hex/rgb value
  const varRegex = /--([\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+[^)]*\))/g
  let m

  // Store all CSS vars for analysis
  const allVars = {}
  while ((m = varRegex.exec(css)) !== null) {
    const name = m[1].toLowerCase()
    const color = normalizeColor(m[2])
    if (color) allVars[name] = color
  }

  // Map semantic meaning from var names
  for (const [name, color] of Object.entries(allVars)) {
    // Background signals
    if (!map.background && /^(bg|background|page|canvas|base)(-color|-bg|-background)?$/.test(name)) {
      map.background = color
    }
    if (!map.background && /(background|bg)[-_](primary|default|base|page|light|white|main)/.test(name)) {
      map.background = color
    }

    // Surface signals
    if (!map.surface && /(surface|card|panel|layer|elevated|secondary[-_]bg|bg[-_]secondary)/.test(name)) {
      map.surface = color
    }

    // Primary / brand color
    if (!map.primary && /^(primary|brand|main)(-color|-foreground|-default)?$/.test(name)) {
      map.primary = color
    }
    if (!map.primary && /(primary|brand)[-_](color|default|base|500|600)/.test(name)) {
      map.primary = color
    }

    // Accent
    if (!map.accent && /^(accent|highlight|cta|interactive)(-color|-default)?$/.test(name)) {
      map.accent = color
    }

    // Secondary
    if (!map.secondary && /^secondary(-color|-default)?$/.test(name)) {
      map.secondary = color
    }

    // Text / foreground
    if (!map.text && /^(text|foreground|on[-_]bg|content)(-primary|-default|-color|-base)?$/.test(name)) {
      map.text = color
    }
    if (!map.text && /(foreground|text)[-_](primary|default|base|high)/.test(name)) {
      map.text = color
    }

    // Muted text
    if (!map.textMuted && /(muted|secondary|tertiary|disabled|subtle|placeholder|low)/.test(name) && /text|foreground|label/.test(name)) {
      map.textMuted = color
    }

    // Border
    if (!map.border && /^(border|divider|separator|outline|stroke)(-color|-default)?$/.test(name)) {
      map.border = color
    }
  }

  return map
}

// ─── COLOR CATEGORIZATION ────────────────────────────────────────────────────
// This is the #3 fix: use semantic map first, then fall back to brightness analysis

function categorizeColors(hexColors, semanticMap = {}, themeColor = null) {
  if (hexColors.length === 0 && !Object.values(semanticMap).some(Boolean)) {
    return getDefaultPalette()
  }

  // Classify all colors
  const classified = hexColors.map(hex => {
    const brightness = getBrightness(hex)
    const { h, s, l } = getHsl(hex)
    return {
      hex,
      brightness,
      h, s, l,
      isNearWhite: brightness > 230,
      isNearBlack: brightness < 25,
      isVeryLight: brightness > 200,
      isLight: brightness > 128,
      isDark: brightness <= 128,
      isGray: s < 12,
      isColored: s >= 20,
    }
  }).filter(Boolean)

  const lightColors = classified.filter(c => c.isVeryLight).sort((a, b) => b.brightness - a.brightness)
  const darkColors = classified.filter(c => c.brightness < 80).sort((a, b) => a.brightness - b.brightness)
  const coloredSorted = classified
    .filter(c => c.isColored && c.brightness > 30 && c.brightness < 230)
    .sort((a, b) => b.s - a.s)

  // ── Use semantic map values first (most accurate), then fall back ──

  const background = semanticMap.background
    || lightColors[0]?.hex
    || '#ffffff'

  const surface = semanticMap.surface
    || lightColors[1]?.hex
    || lightenHex(background, -10)
    || '#f5f5f5'

  const text = semanticMap.text
    || darkColors[0]?.hex
    || '#111111'

  const textMuted = semanticMap.textMuted
    || darkColors[1]?.hex
    || '#6b7280'

  const border = semanticMap.border
    || classified.find(c => c.brightness >= 175 && c.brightness < 215 && c.isGray)?.hex
    || '#e2e8f0'

  // For primary/accent, theme-color meta tag is also a very reliable signal
  const themeNormalized = themeColor ? normalizeColor(themeColor) : null

  const accent = semanticMap.accent
    || themeNormalized
    || coloredSorted[0]?.hex
    || '#6366f1'

  const primary = semanticMap.primary
    || coloredSorted[0]?.hex
    || accent

  const secondary = semanticMap.secondary
    || coloredSorted[1]?.hex
    || '#4a4a4a'

  // Build full palette from all colors found (most saturated first for visual interest)
  const palette = [
    ...new Set([
      primary, accent, secondary,
      ...coloredSorted.map(c => c.hex),
      ...darkColors.map(c => c.hex),
    ])
  ].filter(Boolean).slice(0, 12)

  return {
    primary,
    secondary,
    accent,
    background,
    surface,
    text,
    textMuted,
    border,
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    palette,
  }
}

function getDefaultPalette() {
  return {
    primary: '#1a1a1a',
    secondary: '#4a4a4a',
    accent: '#6366f1',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#0f172a',
    textMuted: '#64748b',
    border: '#e2e8f0',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    palette: [],
  }
}

// ─── FONT EXTRACTION ─────────────────────────────────────────────────────────
// Improved: now also reads @font-face declarations from external CSS

function extractFonts($, allCss) {
  const fonts = new Set()

  // 1. Google Fonts from <link> tags
  $('link[href*="fonts.googleapis.com"]').each((_, el) => {
    const href = $(el).attr('href') || ''
    const familyMatch = href.match(/family=([^&]+)/)
    if (familyMatch) {
      decodeURIComponent(familyMatch[1])
        .split('|')
        .forEach(f => fonts.add(f.split(':')[0].split(';')[0].replace(/\+/g, ' ').trim()))
    }
  })

  // 2. @font-face src names (most reliable for self-hosted fonts)
  const fontFaceRegex = /@font-face\s*\{[^}]*font-family\s*:\s*['"]?([^'";}\n]+)/gi
  let m
  while ((m = fontFaceRegex.exec(allCss)) !== null) {
    fonts.add(m[1].trim().replace(/['"]/g, ''))
  }

  // 3. font-family property values
  const fontFamilyRegex = /font-family\s*:\s*(['"]?)([^'";,\n{}]+)\1/gi
  while ((m = fontFamilyRegex.exec(allCss)) !== null) {
    const font = m[2].trim().replace(/['"]/g, '').split(',')[0].trim()
    if (font && !font.startsWith('var(') && font.length > 1) fonts.add(font)
  }

  const GENERIC = new Set([
    'inherit', 'initial', 'unset', 'revert', 'sans-serif', 'serif', 'monospace',
    'cursive', 'fantasy', 'system-ui', '-apple-system', 'BlinkMacSystemFont',
    'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Helvetica',
    'ui-sans-serif', 'ui-serif', 'ui-monospace',
  ])

  const fontList = [...fonts].filter(f => {
    const clean = f.trim()
    return clean.length > 1 && !GENERIC.has(clean) && !GENERIC.has(clean.toLowerCase())
  })

  const monoFont = fontList.find(f => /mono|code|courier|console|fixed/i.test(f))

  return {
    headingFont: fontList[0] || 'Georgia, serif',
    bodyFont: fontList[1] || fontList[0] || 'system-ui, sans-serif',
    monoFont: monoFont || 'monospace',
    baseSize: '16px',
    scaleRatio: '1.25',
    weights: { light: 300, normal: 400, medium: 500, semibold: 600, bold: 700 },
    lineHeights: { tight: 1.2, normal: 1.5, relaxed: 1.75 },
    detected: fontList,
  }
}

// ─── SPACING EXTRACTION ───────────────────────────────────────────────────────
// Improved: try to detect spacing unit from CSS custom properties

function extractSpacing($, allCss) {
  // Try to detect base spacing unit from CSS vars like --spacing-unit, --space-1
  const spaceVarRegex = /--(spacing|space|gap)[-_]?(unit|base|1|xs|sm)?\s*:\s*(\d+(?:\.\d+)?)(px|rem)/gi
  let m
  let baseUnit = 4 // default
  while ((m = spaceVarRegex.exec(allCss)) !== null) {
    const val = parseFloat(m[3])
    const unit = m[4]
    if (unit === 'rem') baseUnit = val * 16
    else baseUnit = val
    break
  }

  baseUnit = [4, 8, 6, 5, 10].includes(baseUnit) ? baseUnit : 4

  return {
    unit: baseUnit,
    baseUnit: `${baseUnit}px`,
    scale: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 20, 24].map(n => n * baseUnit),
    named: {
      xs: `${baseUnit}px`,
      sm: `${baseUnit * 2}px`,
      md: `${baseUnit * 4}px`,
      lg: `${baseUnit * 6}px`,
      xl: `${baseUnit * 8}px`,
      '2xl': `${baseUnit * 12}px`,
      '3xl': `${baseUnit * 16}px`,
    },
  }
}

// ─── IMAGE EXTRACTION ─────────────────────────────────────────────────────────

function extractImages($, parsed) {
  const images = []
  $('img').each((_, el) => {
    let src = $(el).attr('src') || $(el).attr('data-src') || ''
    if (!src) return
    if (src.startsWith('data:')) return
    if (src.startsWith('//')) src = `${parsed.protocol}${src}`
    else if (src.startsWith('/')) src = `${parsed.origin}${src}`
    if (src.startsWith('http')) images.push(src)
  })
  return images.slice(0, 10)
}

// ─── COLOR UTILITIES ──────────────────────────────────────────────────────────

function normalizeColor(color) {
  if (!color) return null
  color = color.trim()

  // Already hex
  if (/^#[0-9a-fA-F]{3,8}$/.test(color)) {
    if (color.length === 4) {
      // #abc → #aabbcc
      return '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3]
    }
    return color.toLowerCase().slice(0, 7)
  }

  // RGB / RGBA (with optional spaces after commas)
  const rgbMatch = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0')
    const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0')
    const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0')
    return `#${r}${g}${b}`
  }

  // HSL → convert to hex
  const hslMatch = color.match(/hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/)
  if (hslMatch) {
    return hslToHex(parseFloat(hslMatch[1]), parseFloat(hslMatch[2]), parseFloat(hslMatch[3]))
  }

  return null
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = n => {
    const k = (n + h / 30) % 12
    return Math.round(255 * (l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)))
  }
  return `#${f(0).toString(16).padStart(2,'0')}${f(8).toString(16).padStart(2,'0')}${f(4).toString(16).padStart(2,'0')}`
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null
}

function getBrightness(hex) {
  const rgb = hexToRgb(hex)
  if (!rgb) return 128
  return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000
}

function getHsl(hex) {
  const rgb = hexToRgb(hex)
  if (!rgb) return { h: 0, s: 0, l: 0 }
  const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function darkenHex(hex, amount) {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const r = Math.max(0, rgb.r - amount).toString(16).padStart(2, '0')
  const g = Math.max(0, rgb.g - amount).toString(16).padStart(2, '0')
  const b = Math.max(0, rgb.b - amount).toString(16).padStart(2, '0')
  return `#${r}${g}${b}`
}

function lightenHex(hex, amount) {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const r = Math.min(255, Math.max(0, rgb.r + amount)).toString(16).padStart(2, '0')
  const g = Math.min(255, Math.max(0, rgb.g + amount)).toString(16).padStart(2, '0')
  const b = Math.min(255, Math.max(0, rgb.b + amount)).toString(16).padStart(2, '0')
  return `#${r}${g}${b}`
}