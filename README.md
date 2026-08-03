# WorthTracker

Offline-first **net worth & wealth tracking** PWA. Track assets vs liabilities, historical trends, allocation, and multi-currency portfolios — data stays in your browser.

Inspired by WorthTracker-style wealth apps (not expense tracking).

## Stack

| Layer | Tech |
|------|------|
| Framework | Next.js (App Router) + TypeScript |
| Styling | Tailwind CSS (light / dark / system) |
| State | Zustand + `localStorage` persist |
| Charts | Recharts |
| Icons | Lucide React |
| Tests | Vitest |

## Features

- **Net worth dashboard** — assets, liabilities, and privacy-masked balances
- **Accounts** — cash, investments, real estate, crypto, vehicles, mortgages, loans, credit cards
- **Multi-currency** — per-account currency with editable FX rates vs base currency
- **Trend chart** — historical snapshots with 1M / 3M / 6M / 1Y / ALL ranges
- **Allocation** — pie breakdown for assets or liabilities
- **Snapshots** — capture point-in-time portfolio history
- **Settings** — theme, privacy mode, base currency, JSON export, demo data, reset
- **PWA-ready** — installable web app manifest + mobile-first shell

## Local development

```bash
npm install
npm run dev
npm test
npm run build
```

Open [http://localhost:3000](http://localhost:3000).

## Data model

Core types live in `src/lib/types.ts`:

- `Account` — asset or liability with category, currency, value
- `HistoricalSnapshot` — dated net-worth checkpoint
- `Currency` — code, symbol, `exchangeRateToBase`
- `UserSettings` — base currency, privacy, biometric preference, theme

## Privacy

WorthTracker is **local-only**. Portfolio data is stored in `localStorage` under `worthtracker-v1`. Use **Export JSON backup** in Settings before clearing browser data.

## Deploy

### GitHub Pages (separate from the game)

WorthTracker is published under a **dedicated subpath** so it does not overwrite the game at `/App/`:

**https://wyc3809.github.io/App/worthtracker/**

```bash
npm run build:pages   # static export → ./out (basePath /App/worthtracker)
```

The Actions workflow deploys only into `gh-pages/worthtracker/` with `keep_files: true`.

### Other hosts

- Vercel / local static: `npm run build` → `./out` (no base path)
- Cloudflare Pages: manual `workflow_dispatch` (optional secrets)
