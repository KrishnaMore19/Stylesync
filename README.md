# StyleSync

> Transform any website into an interactive, living design system.

**Purple Merit Technologies — Full Stack Vibe Coder Intern Assessment**

---

## Overview

StyleSync scrapes any URL and extracts its complete design DNA — color palettes, typographic scales, and spacing rhythms — into a Figma-like dashboard where tokens can be locked, edited, and previewed on a live component library.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + CSS Custom Properties |
| State | Zustand |
| Database | PostgreSQL (via Prisma ORM) |
| Scraping (fast) | Cheerio (static HTML analysis) |
| Scraping (fallback) | Playwright (headless Chrome for SPAs) |
| Animations | Framer Motion |
| Color Picker | react-colorful |
| Deployment | Vercel + Railway/Supabase |

---

## How Scraping Works

StyleSync uses a **two-stage smart scraper**:

```
User submits URL
      ↓
Stage 1: Cheerio (fast, ~1–2s)
  - Fetches raw HTML + external CSS files
  - Parses CSS custom properties, colors, fonts
  - Works great for static sites
      ↓
Got 3+ colors? ──YES──→ Done ✅
      │
      NO
      ↓
Stage 2: Playwright (thorough, ~8–15s)
  - Launches headless Chrome
  - Waits for full JS execution (React/Vue/Next.js)
  - Reads computed styles directly from the browser
  - Extracts CSS variables from :root
  - Captures network-loaded CSS files
      ↓
     Done ✅
```

This means **static sites are fast**, and **JS-heavy SPAs (Stripe, Linear, Vercel) always work**.

---

## Features

- **Ingest** — Paste any URL; smart dual-scraper handles static and JS-heavy sites
- **Extract** — Colors, typography hierarchy, and spacing system
- **Visualize** — Figma-like dashboard with real-time token editing
- **Lock & Version** — Lock tokens to prevent override; full audit trail
- **Preview** — Live component grid driven by CSS variables
- **Export** — CSS variables, JSON tokens, or Tailwind config

---

## Setup Instructions

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or Supabase)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/stylesync.git
cd stylesync
```

### 2. Install dependencies

```bash
npm install
```

### 3. Install Playwright browser (Chromium)

```bash
npm run playwright:install
# or manually:
npx playwright install chromium --with-deps
```

> This downloads a ~120MB Chromium binary. Only needed once.

### 4. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/stylesync"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Using Supabase (recommended):**
1. Create a free project at [supabase.com](https://supabase.com)
2. Go to Settings → Database → Connection string
3. Copy the URI and paste as `DATABASE_URL`

### 5. Set up the database

```bash
npm run db:generate
npm run db:push
```

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment

### Vercel (Frontend + API)

> ⚠️ Playwright does NOT work on Vercel serverless functions (no Chromium binary allowed).
> Use Railway for full Playwright support.

```bash
npm i -g vercel
vercel
```

If deploying on Vercel, Cheerio-only mode still works for many sites.

### Railway (Recommended — Full Playwright Support)

1. Connect your GitHub repo at [railway.app](https://railway.app)
2. Add a PostgreSQL plugin
3. Set `DATABASE_URL` from Railway's connection string
4. Add this to your Railway start command:

```bash
npx playwright install chromium --with-deps && npm start
```

Or add a `Dockerfile`:

```dockerfile
FROM mcr.microsoft.com/playwright:v1.43.0-jammy
WORKDIR /app
COPY . .
RUN npm install
RUN npm run db:generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Render

Use the Playwright Docker image above as your base.

---

## Database Schema

```
scraped_sites        — URL, title, favicon, extraction status
design_tokens        — JSONB: colors, typography, spacing per site
locked_tokens        — Junction table: frozen tokens per session
version_history      — Audit log: before/after values with timestamps
```

See `prisma/schema.prisma` for full schema.

---

## API Routes

| Method | Route | Description |
|---|---|---|
| POST | `/api/scrape` | Smart scrape (Cheerio → Playwright fallback) |
| GET | `/api/tokens?tokenId=` | Fetch design tokens |
| POST | `/api/tokens` | Update a token value |
| POST | `/api/lock` | Lock/unlock a token |
| GET | `/api/export?tokenId=&format=` | Export (css/json/tailwind) |

### Scrape Response

```json
{
  "success": true,
  "tokenId": "...",
  "scrapeSource": "playwright",  // "cheerio" | "playwright" | "cheerio-partial" | "fallback"
  "tokens": { "colors": {}, "typography": {}, "spacing": {} },
  "meta": { "title": "Stripe", "favicon": "...", "url": "..." }
}
```

---

## Project Structure

```
stylesync/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── page.jsx
│   │   ├── dashboard/page.jsx
│   │   └── api/
│   │       ├── scrape/route.js      ← Smart scraper (updated)
│   │       ├── tokens/route.js
│   │       ├── lock/route.js
│   │       └── export/route.js
│   ├── lib/
│   │   ├── scraper/
│   │   │   ├── cheerio.js           ← Stage 1: fast static scraper
│   │   │   └── playwright.js        ← Stage 2: headless browser fallback
│   │   ├── db/prisma.js
│   │   └── tokens/normalize.js
│   ├── store/tokenStore.js
│   └── components/
│       ├── dashboard/
│       ├── tokens/
│       ├── preview/
│       └── shared/
└── README.md
```

---

## Scraper Comparison

| Site Type | Cheerio Works? | Playwright Works? |
|---|---|---|
| Wikipedia, news blogs | ✅ Yes | ✅ Yes |
| Stripe, Linear, Vercel | ❌ No (React SPA) | ✅ Yes |
| Next.js sites | ❌ Often fails | ✅ Yes |
| Sites with bot protection | ❌ No | ⚠️ Sometimes |
| Paywalled sites | ❌ No | ❌ No |

---

## Troubleshooting

**Playwright not found:**
```bash
npm run playwright:install
```

**Timeout errors on heavy sites:**
Increase timeout in `playwright.js` → `page.goto(..., { timeout: 30000 })`

**Colors still showing as defaults:**
The site likely uses inline SVG or canvas for colors. Check `scrapeSource` in the API response — if it says `"fallback"`, both scrapers were blocked.

**Railway deployment fails:**
Make sure you're using the Playwright Docker image as your base.

---

## Screenshots

> Include screenshots of extracted style guides from:
> 1. A corporate site (e.g., stripe.com)
> 2. A creative portfolio
> 3. An e-commerce page

---

## License

Built for Purple Merit Technologies assessment. Not for commercial use.