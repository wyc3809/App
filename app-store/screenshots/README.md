# App Store screenshots — WorthBook

Ready-to-upload **light-mode** marketing screenshots for **App Store Connect**.

> Captured in light theme. Marketing headlines stay in the top band so they never overlap the phone UI.

## Upload these (recommended first)

### iPhone 6.7" (1290 × 2796) — required for modern iPhones

English (`app-store/screenshots/6.7/en/`):

| Order | File | Message |
|------:|------|---------|
| 1 | `01-home.png` | See your full picture |
| 2 | `02-ledger.png` | Log spending in seconds |
| 3 | `03-insights.png` | Charts that stay offline |

Traditional Chinese (`app-store/screenshots/6.7/zh-Hant/`):

| Order | File | Message |
|------:|------|---------|
| 1 | `01-home.png` | 一眼睇晒身家 |
| 2 | `02-ledger.png` | 幾秒記低一筆 |
| 3 | `03-insights.png` | 離線圖表一樣清楚 |

### iPhone 6.1" (1179 × 2556)

Same three files under `app-store/screenshots/6.1/{en,zh-Hant}/`.

In App Store Connect → your app → **iOS App** → version → **Previews and Screenshots**:

1. Select **6.7" Display** → upload the three `6.7/en` images in order.
2. If you localized **繁體中文**, switch locale and upload `6.7/zh-Hant`.
3. Repeat for **6.1" Display** (or let Connect derive media where allowed).

Apple requires **at least one** screenshot per size class; **3** is a strong first set.

## Also included

- `raw/` — unframed device captures (for redesigning headlines later)
- `manifest.json` — generation metadata
- Regenerator: `scripts/generate-app-store-screenshots.mjs`

```bash
npm run build
npm run screenshots:app-store
```

## Suggested listing copy (short)

**Subtitle (≤30):** `Private net worth tracker` / `私密淨值與記帳`

**Promotional text (EN):**  
Track net worth, accounts, and a daily ledger — 100% on your iPhone. No account. No cloud.

**推廣文字：**  
追蹤淨值、帳戶與日常記帳——資料只留在你的 iPhone。無需註冊、無雲端。

Full copy-paste pack (keywords, privacy answers, review notes) lives in PR #45 / `docs/APP_STORE_CONNECT_LISTING.md` when merged.
