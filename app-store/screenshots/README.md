# App Store screenshots — WorthBook

Ready-to-upload **light-mode** marketing screenshots for **App Store Connect**.

> Captured in light theme. Marketing headlines stay in the top band so they never overlap the phone UI.

## Accepted sizes (this listing slot)

App Store Connect for this app expects one of:

| Orientation | Size |
|-------------|------|
| Portrait | **1206 × 2622** |
| Landscape | 2622 × 1206 |
| Portrait | **1179 × 2556** |
| Landscape | 2556 × 1179 |

We ship the two portrait sizes below.

## Upload these (recommended first)

### 1206 × 2622 — `app-store/screenshots/6.7/`

English (`6.7/en/`):

| Order | File | Message |
|------:|------|---------|
| 1 | `01-home.png` | See your full picture |
| 2 | `02-ledger.png` | Log spending in seconds |
| 3 | `03-insights.png` | Charts that stay offline |

Traditional Chinese (`6.7/zh-Hant/`):

| Order | File | Message |
|------:|------|---------|
| 1 | `01-home.png` | 一眼睇晒身家 |
| 2 | `02-ledger.png` | 幾秒記低一筆 |
| 3 | `03-insights.png` | 離線圖表一樣清楚 |

### 1179 × 2556 — `app-store/screenshots/6.1/`

Same three files under `6.1/{en,zh-Hant}/`.

In App Store Connect → **Previews and Screenshots**:

1. Upload the three `6.7/en` images (**1206 × 2622**) into the size class that accepts that dimension.
2. If you localized **繁體中文**, upload `6.7/zh-Hant`.
3. For the **1179 × 2556** class, upload `6.1/{locale}/`.

## Also included

- `raw/` — unframed device captures (1206 × 2622)
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
