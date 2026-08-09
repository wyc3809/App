# WorthBook

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

- **Net worth dashboard** — assets, liabilities, privacy-masked balances, multi-year trend ranges
- **Accounts** — cash, investments, real estate, crypto, vehicles, mortgages, loans, credit cards
- **Ledger** — income / expense bookkeeping with optional account linking (auto balance + type flip)
- **Value history** — per-account dated balances; tap a row to edit linked ledger entries
- **Multi-currency** — per-account currency with editable FX rates vs base currency
- **Backup** — JSON export / import, demo portfolio, reset
- **Privacy** — local-only storage + in-app privacy policy
- **PWA** — installable manifest, icons, offline static cache, mobile safe areas

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
- `AccountValueEntry` — dated balance / ledger-linked history row
- `Transaction` — income or expense ledger entry
- `HistoricalSnapshot` — dated net-worth checkpoint
- `Currency` — code, symbol, `exchangeRateToBase`
- `UserSettings` — base currency, privacy, biometric preference, theme

## Privacy

WorthBook is **local-only**. Portfolio data is stored in `localStorage` under `worthtracker-v1` (legacy key kept for existing saves). See **Settings → Privacy policy**. Use **Export JSON backup** before clearing browser data.

## Deploy

### Native (App Store)

See **[docs/APP_STORE.md](docs/APP_STORE.md)**. No Mac? Use **[docs/IOS-CLOUD-BUILD.md](docs/IOS-CLOUD-BUILD.md)** (Codemagic / GitHub Actions). — Capacitor wraps `npm run build:native` → `out/` for iOS / Android. Biometric lock, Share-sheet backup, and native haptics are wired for that path.

### GitHub Pages (separate from the game)

WorthBook is published under a **dedicated subpath** so it does not overwrite the game at `/App/`:

**https://wyc3809.github.io/App/worthtracker/**

```bash
npm run build:pages   # static export → ./out (basePath /App/worthtracker)
```

The Actions workflow deploys only into `gh-pages/worthtracker/` with `keep_files: true`.

### Other hosts

- Vercel / local static: `npm run build` → `./out` (no base path)
- Cloudflare Pages: manual `workflow_dispatch` (optional secrets)
