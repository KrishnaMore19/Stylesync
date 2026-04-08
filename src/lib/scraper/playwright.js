// src/lib/scraper/playwright.js
// Used as fallback when Cheerio fails (JS-heavy SPAs, React/Next/Vue sites)

export async function scrapeUrlWithPlaywright(url) {
  let browser = null

  try {
    // Dynamic import so Playwright doesn't break if not installed
    const { chromium } = await import('playwright')

    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process', // important for Railway/Vercel
      ],
    })

    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1440, height: 900 },
    })

    const page = await context.newPage()

    // Capture all CSS file URLs loaded by the page
    const cssUrls = []
    page.on('response', (response) => {
      const url = response.url()
      const ct = response.headers()['content-type'] || ''
      if (ct.includes('text/css') || url.endsWith('.css')) {
        cssUrls.push(url)
      }
    })

    // Navigate and wait for network to settle
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 25000,
    })

    // Extra wait for lazy-loaded fonts/styles
    await page.waitForTimeout(1500)

    const parsed = new URL(url)

    // ── Extract everything via page.evaluate (runs inside browser) ──
    const pageData = await page.evaluate(() => {
      const results = {
        title: document.title || '',
        metaDescription: document.querySelector('meta[name="description"]')?.content || '',
        themeColor: document.querySelector('meta[name="theme-color"]')?.content || '',
        favicon: '',
        colors: new Set(),
        fonts: new Set(),
        cssVars: {},
        inlineCss: '',
        images: [],
      }

      // Favicon
      const faviconEl =
        document.querySelector('link[rel="icon"]') ||
        document.querySelector('link[rel="shortcut icon"]') ||
        document.querySelector('link[rel="apple-touch-icon"]')
      results.favicon = faviconEl?.href || ''

      // ── CSS Custom Properties from :root ──
      // This is the most accurate way to get design tokens from modern sites
      const rootStyle = getComputedStyle(document.documentElement)
      const cssVarNames = [
        '--color-primary', '--color-secondary', '--color-accent',
        '--color-background', '--color-surface', '--color-text',
        '--color-border', '--primary', '--secondary', '--accent',
        '--background', '--foreground', '--muted', '--border',
        '--brand', '--brand-primary', '--color-brand',
        '--colorBackgroundPrimary', '--colorBackgroundSecondary',
        '--colorText', '--colorBorder',
      ]
      cssVarNames.forEach(v => {
        const val = rootStyle.getPropertyValue(v).trim()
        if (val) results.cssVars[v] = val
      })

      // Also scan all CSS vars dynamically
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules || []) {
            if (rule.selectorText === ':root' || rule.selectorText === 'html') {
              const text = rule.cssText
              const varRegex = /--([\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))/g
              let m
              while ((m = varRegex.exec(text)) !== null) {
                results.cssVars['--' + m[1]] = m[2]
              }
            }
          }
        } catch {
          // Cross-origin stylesheets throw — skip
        }
      }

      // ── Computed styles from key elements ──
      const selectors = [
        'body', 'header', 'nav', 'main', 'footer',
        'h1', 'h2', 'h3', 'p', 'a', 'button',
        '[class*="btn"]', '[class*="card"]', '[class*="hero"]',
        '[class*="primary"]', '[class*="secondary"]',
      ]

      selectors.forEach(sel => {
        const el = document.querySelector(sel)
        if (!el) return
        const style = getComputedStyle(el)
        const colorProps = [
          'color', 'backgroundColor', 'borderColor',
          'outlineColor', 'caretColor', 'fill',
        ]
        colorProps.forEach(prop => {
          const val = style[prop]
          if (val && val !== 'rgba(0, 0, 0, 0)' && val !== 'transparent') {
            results.colors.add(val)
          }
        })

        // Fonts
        const ff = style.fontFamily
        if (ff) results.fonts.add(ff.split(',')[0].replace(/['"]/g, '').trim())
      })

      // Convert Sets to arrays (can't serialize Set via evaluate)
      results.colors = [...results.colors]
      results.fonts = [...results.fonts]

      // ── Inline CSS from <style> tags ──
      results.inlineCss = [...document.querySelectorAll('style')]
        .map(s => s.textContent)
        .join('\n')

      // ── Images ──
      results.images = [...document.querySelectorAll('img')]
        .map(img => img.src)
        .filter(src => src && src.startsWith('http'))
        .slice(0, 10)

      return results
    })

    // ── Fetch external CSS files captured from network ──
    let externalCss = ''
    await Promise.allSettled(
      cssUrls.slice(0, 8).map(async (cssUrl) => {
        try {
          const res = await fetch(cssUrl)
          if (res.ok) externalCss += await res.text() + '\n'
        } catch {
          // ignore
        }
      })
    )

    const allCss = pageData.inlineCss + '\n' + externalCss

    // ── Build favicon URL ──
    let favicon = pageData.favicon
    if (!favicon) favicon = `${parsed.origin}/favicon.ico`

    return {
      title: pageData.title,
      favicon,
      colors: extractColorsFromPlaywright(pageData.colors, pageData.cssVars, pageData.themeColor, allCss),
      fonts: extractFontsFromPlaywright(pageData.fonts, allCss),
      spacing: extractSpacingFromPlaywright(allCss),
      images: pageData.images,
      meta: {
        description: pageData.metaDescription,
        themeColor: pageData.themeColor,
      },
      _source: 'playwright', // flag so you know which scraper was used
    }
  } finally {
    if (browser) await browser.close()
  }
}

// ─── COLOR EXTRACTION (Playwright version) ───────────────────────────────────
// We get computed RGB values from the browser — much more accurate than regex

function extractColorsFromPlaywright(computedColors, cssVars, themeColor, allCss) {
  // Step 1: Parse CSS vars for semantic colors
  const semanticMap = {
    primary: null, secondary: null, accent: null,
    background: null, surface: null, text: null,
    textMuted: null, border: null,
  }

  const semanticPatterns = {
    primary: /(^|[-_])(primary|brand|main)([-_]|$)/i,
    secondary: /(^|[-_])secondary([-_]|$)/i,
    accent: /(^|[-_])(accent|highlight|cta)([-_]|$)/i,
    background: /(^|[-_])(background|bg|page|canvas)([-_]|$)/i,
    surface: /(^|[-_])(surface|card|panel|layer)([-_]|$)/i,
    text: /(^|[-_])(text|foreground|content)([-_]|$)/i,
    textMuted: /(muted|secondary|tertiary|subtle|placeholder)/i,
    border: /(^|[-_])(border|divider|separator|stroke)([-_]|$)/i,
  }

  for (const [varName, value] of Object.entries(cssVars)) {
    const normalized = normalizeColor(value)
    if (!normalized) continue
    for (const [key, pattern] of Object.entries(semanticPatterns)) {
      if (!semanticMap[key] && pattern.test(varName)) {
        semanticMap[key] = normalized
      }
    }
  }

  // Step 2: Normalize all computed browser colors
  const allHex = computedColors
    .map(normalizeColor)
    .filter(Boolean)
    .filter((c, i, arr) => arr.indexOf(c) === i)

  // Step 3: Also extract from raw CSS text (same as Cheerio)
  const cssColorRegex = /(?:color|background(?:-color)?|border(?:-color)?|fill)\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/gm
  let m
  while ((m = cssColorRegex.exec(allCss)) !== null) {
    const hex = normalizeColor(m[1])
    if (hex) allHex.push(hex)
  }

  const uniqueHex = [...new Set(allHex)]
    .filter(c => c !== '#000000' && c !== '#ffffff')

  // Categorize
  const classified = uniqueHex.map(hex => {
    const brightness = getBrightness(hex)
    const { s } = getHsl(hex)
    return { hex, brightness, s }
  })

  const lightColors = classified.filter(c => c.brightness > 200).sort((a, b) => b.brightness - a.brightness)
  const darkColors = classified.filter(c => c.brightness < 60).sort((a, b) => a.brightness - b.brightness)
  const coloredSorted = classified
    .filter(c => c.s >= 20 && c.brightness > 30 && c.brightness < 230)
    .sort((a, b) => b.s - a.s)

  const themeNorm = themeColor ? normalizeColor(themeColor) : null

  const background = semanticMap.background || lightColors[0]?.hex || '#ffffff'
  const surface = semanticMap.surface || lightColors[1]?.hex || '#f8fafc'
  const text = semanticMap.text || darkColors[0]?.hex || '#111111'
  const textMuted = semanticMap.textMuted || darkColors[1]?.hex || '#6b7280'
  const border = semanticMap.border || '#e2e8f0'
  const accent = semanticMap.accent || themeNorm || coloredSorted[0]?.hex || '#6366f1'
  const primary = semanticMap.primary || coloredSorted[0]?.hex || accent
  const secondary = semanticMap.secondary || coloredSorted[1]?.hex || '#4a4a4a'

  const palette = [...new Set([primary, accent, secondary, ...coloredSorted.map(c => c.hex)])]
    .filter(Boolean).slice(0, 12)

  return {
    primary, secondary, accent,
    background, surface, text, textMuted, border,
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    palette,
  }
}

// ─── FONT EXTRACTION (Playwright version) ────────────────────────────────────

function extractFontsFromPlaywright(computedFonts, allCss) {
  const fonts = new Set()

  // Add computed fonts from browser (most accurate)
  const GENERIC = new Set([
    'inherit', 'initial', 'unset', 'sans-serif', 'serif', 'monospace',
    'cursive', 'fantasy', 'system-ui', '-apple-system', 'BlinkMacSystemFont',
    'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Helvetica',
    'ui-sans-serif', 'ui-serif', 'ui-monospace',
  ])

  computedFonts.forEach(f => {
    const clean = f.trim()
    if (clean.length > 1 && !GENERIC.has(clean)) fonts.add(clean)
  })

  // Also parse @font-face from CSS
  const fontFaceRegex = /@font-face\s*\{[^}]*font-family\s*:\s*['"]?([^'";}\n]+)/gi
  let m
  while ((m = fontFaceRegex.exec(allCss)) !== null) {
    fonts.add(m[1].trim().replace(/['"]/g, ''))
  }

  const fontList = [...fonts].filter(f => !GENERIC.has(f))
  const monoFont = fontList.find(f => /mono|code|courier|console/i.test(f))

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

function extractSpacingFromPlaywright(allCss) {
  const spaceVarRegex = /--(spacing|space|gap)[-_]?(unit|base|1|xs)?\s*:\s*(\d+(?:\.\d+)?)(px|rem)/gi
  let m
  let baseUnit = 4
  while ((m = spaceVarRegex.exec(allCss)) !== null) {
    const val = parseFloat(m[3])
    baseUnit = m[4] === 'rem' ? val * 16 : val
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

// ─── COLOR UTILITIES (shared) ─────────────────────────────────────────────────

function normalizeColor(color) {
  if (!color) return null
  color = color.trim()
  if (/^#[0-9a-fA-F]{3,8}$/.test(color)) {
    if (color.length === 4) {
      return '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3]
    }
    return color.toLowerCase().slice(0, 7)
  }
  const rgbMatch = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0')
    const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0')
    const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0')
    return `#${r}${g}${b}`
  }
  const hslMatch = color.match(/hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/)
  if (hslMatch) return hslToHex(parseFloat(hslMatch[1]), parseFloat(hslMatch[2]), parseFloat(hslMatch[3]))
  return null
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = n => {
    const k = (n + h / 30) % 12
    return Math.round(255 * (l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)))
  }
  return `#${f(0).toString(16).padStart(2, '0')}${f(8).toString(16).padStart(2, '0')}${f(4).toString(16).padStart(2, '0')}`
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