# WorthBook

Offline-first net worth & wealth tracking PWA (Next.js + TypeScript).

## Technology Stack

- **Framework**: Next.js (App Router) + React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS (class-based dark mode)
- **State / Persistence**: Zustand + localStorage (`worthtracker-v1`)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Tests**: Vitest
- **Build**: `npm run build` / `npm test` / `npm run dev`

## Product Focus

Track **Total Net Worth** (Assets vs Liabilities), historical trends, asset allocation, and multi-currency portfolios. Not an expense tracker.

## Project Structure

| Path | Role |
|------|------|
| `src/app/` | Routes: dashboard, accounts, history, settings |
| `src/components/` | UI shell, charts, account forms |
| `src/lib/` | Types, store, currency math, demo data |
| `public/` | PWA manifest + icons |

## Coding Preferences

- Keep portfolio math deterministic and unit-tested (`src/lib/*.test.ts`)
- Prefer extending Zustand store + typed schemas over ad-hoc UI state
- Data is local-only — never send balances to a server
- Mobile-first shell (`max-w-lg`) with light/dark design tokens in `globals.css`
