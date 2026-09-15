# App Store screenshots — WorthBook

Ready-to-upload **light-mode** marketing screenshots for **App Store Connect**.

> Captured in light theme. Marketing headlines stay in the top band so they never overlap the phone UI. Bottom tab bar is fully visible.

## Sizes

| Folder | Size | Slot |
|--------|------|------|
| `6.7/` | **1242 × 2688** | iPhone 6.5" Display |
| `6.1/` | **1179 × 2556** | iPhone 6.1" Display |

## Upload these (recommended first)

### 1242 × 2688 — `app-store/screenshots/6.7/`

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

1. Upload the three `6.7/en` images (**1242 × 2688**) into the **6.5" Display** slot.
2. If you localized **繁體中文**, upload `6.7/zh-Hant`.
3. For the **6.1"** class, upload `6.1/{locale}/`.

## Also included

- `raw/` — unframed device captures (1242 × 2688)
- `manifest.json` — generation metadata
- Regenerator: `scripts/generate-app-store-screenshots.mjs`

```bash
npm run build
npm run screenshots:app-store
```
