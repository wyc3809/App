# Testing

WorthBook requires automated tests for every feature.

## Commands

```bash
npm test              # Vitest unit tests (src/**/*.test.ts)
npm run test:e2e      # Playwright end-to-end tests
npm run test:all      # unit + e2e
```

## Policy

1. **Every feature** ships with automated coverage before merge:
   - Pure logic → Vitest unit test under `src/lib/*.test.ts`
   - Store / state flows → `src/lib/store.test.ts` (happy-dom)
   - User-visible flows → Playwright E2E under `e2e/`
2. Do not merge UI or data-path changes without a new or updated test.
3. Prefer deterministic seeds / fixtures over live network.

## E2E

Playwright builds the static export and serves `out/` automatically (see `playwright.config.ts`).
Dev HMR is avoided so Zustand persist hydration stays stable.

```bash
npx playwright install chromium   # once per machine
npm run test:e2e
```

Critical paths covered: Home branding, Settings via ⋮, Ledger keypad entry, Insights chart chips, Add Account cancel, CSV import.
