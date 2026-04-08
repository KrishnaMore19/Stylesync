import { NextResponse } from 'next/server'
import { scrapeUrl } from '@/lib/scraper/cheerio'
import { normalizeTokens } from '@/lib/tokens/normalize'
import { getPrisma } from '@/lib/db/prisma'

// ─── SMART SCRAPER: Cheerio first → Playwright fallback ──────────────────────
// Cheerio is fast (0.5–2s) but fails on JS-heavy sites (React, Next, Vue)
// Playwright is slower (5–15s) but works on everything

async function smartScrape(url) {
  let cheerioResult = null
  let cheerioError = null

  // ── Step 1: Try Cheerio ──
  try {
    cheerioResult = await scrapeUrl(url)
  } catch (err) {
    cheerioError = err
    console.warn('[Scraper] Cheerio failed:', err.message)
  }

  // ── Step 2: Check if Cheerio gave us useful data ──
  // If colors palette is empty or all defaults → Cheerio didn't extract enough
  const cheerioIsUseful =
    cheerioResult &&
    cheerioResult.colors &&
    cheerioResult.colors.palette &&
    cheerioResult.colors.palette.length >= 3

  if (cheerioIsUseful) {
    console.log('[Scraper] ✅ Cheerio succeeded with', cheerioResult.colors.palette.length, 'colors')
    return { ...cheerioResult, _source: 'cheerio' }
  }

  // ── Step 3: Fall back to Playwright ──
  console.log('[Scraper] ⚡ Switching to Playwright (Cheerio got insufficient data)')

  try {
    const { scrapeUrlWithPlaywright } = await import('@/lib/scraper/playwright')
    const playwrightResult = await scrapeUrlWithPlaywright(url)
    console.log('[Scraper] ✅ Playwright succeeded')
    return playwrightResult
  } catch (playwrightError) {
    console.error('[Scraper] ❌ Playwright also failed:', playwrightError.message)

    // If Cheerio gave us SOMETHING (even partial), return it
    if (cheerioResult) {
      console.log('[Scraper] ↩️ Returning partial Cheerio result')
      return { ...cheerioResult, _source: 'cheerio-partial' }
    }

    // Both failed — throw so route.js can handle fallback
    throw new Error(
      `Both scrapers failed. Cheerio: ${cheerioError?.message}. Playwright: ${playwrightError.message}`
    )
  }
}

// ─── API ROUTE ────────────────────────────────────────────────────────────────

export async function POST(request) {
  try {
    const { url } = await request.json()
    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 })

    // Validate URL
    let parsedUrl
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    const prisma = getPrisma()

    // Create scraped site record
    const site = await prisma.scrapedSite.create({
      data: { url: parsedUrl.href, extractionStatus: 'processing' },
    })

    try {
      // Smart scrape: Cheerio → Playwright fallback
      const rawData = await smartScrape(parsedUrl.href)

      // Normalize into design tokens
      const tokens = normalizeTokens(rawData)

      // Update site record
      await prisma.scrapedSite.update({
        where: { id: site.id },
        data: {
          title: rawData.title || parsedUrl.hostname,
          favicon: rawData.favicon,
          extractionStatus: 'completed',
        },
      })

      // Save design tokens
      const designToken = await prisma.designToken.create({
        data: {
          siteId: site.id,
          colors: tokens.colors,
          typography: tokens.typography,
          spacing: tokens.spacing,
        },
      })

      return NextResponse.json({
        success: true,
        siteId: site.id,
        tokenId: designToken.id,
        tokens,
        scrapeSource: rawData._source || 'unknown', // tells frontend which scraper was used
        meta: {
          title: rawData.title,
          favicon: rawData.favicon,
          url: parsedUrl.href,
        },
      })
    } catch (scrapeError) {
      // Both scrapers failed — update DB and return fallback tokens
      await prisma.scrapedSite.update({
        where: { id: site.id },
        data: {
          extractionStatus: 'failed',
          errorMessage: scrapeError.message,
        },
      })

      const fallbackTokens = generateFallbackTokens(parsedUrl.hostname)
      const designToken = await prisma.designToken.create({
        data: {
          siteId: site.id,
          colors: fallbackTokens.colors,
          typography: fallbackTokens.typography,
          spacing: fallbackTokens.spacing,
        },
      })

      await prisma.scrapedSite.update({
        where: { id: site.id },
        data: { extractionStatus: 'fallback', title: parsedUrl.hostname },
      })

      return NextResponse.json({
        success: true,
        siteId: site.id,
        tokenId: designToken.id,
        tokens: fallbackTokens,
        fallback: true,
        scrapeSource: 'fallback',
        fallbackReason: scrapeError.message,
        meta: { title: parsedUrl.hostname, url: parsedUrl.href },
      })
    }
  } catch (error) {
    console.error('Scrape API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// ─── FALLBACK TOKENS ──────────────────────────────────────────────────────────

function generateFallbackTokens(hostname) {
  return {
    colors: {
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
    },
    typography: {
      headingFont: 'Inter, sans-serif',
      bodyFont: 'Inter, sans-serif',
      monoFont: 'JetBrains Mono, monospace',
      baseSize: '16px',
      scaleRatio: '1.25',
      weights: { light: 300, normal: 400, medium: 500, semibold: 600, bold: 700 },
      lineHeights: { tight: 1.2, normal: 1.5, relaxed: 1.75 },
    },
    spacing: {
      unit: 4,
      scale: [0, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128],
      baseUnit: '4px',
      named: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px' },
    },
  }
}