# 素材索引

本倉庫落地路徑以 `public/ink/` 與 `design/art/` 為準。風格鐵律見 [`STYLE-BIBLE.md`](./STYLE-BIBLE.md)。

## 文件

| 檔案 | 用途 |
|------|------|
| `STYLE-BIBLE.md` | 視覺＋文字鐵律 |
| `art-bible.md` | 實作摘要（指向 STYLE-BIBLE） |
| `tokens-colors.json` | 色票 |
| `tokens-typography.json` | 字級 |
| `../ux/css-motions.md` | 動效片段 |

## SVG · 裝飾 `public/ink/decor/`

| 檔名 | 說明 |
|------|------|
| `mountains-wide.svg` | 日間遠山底 |
| `ink-blots.svg` | 墨漬 |
| `bamboo-corner.svg` | 竹角飾 |
| `boat-mist.svg` | 孤舟煙波 |
| `event-banner-rain-inn.svg` | 夜雨投店橫幅 |
| `event-banner-bridge.svg` | 橋上有人橫幅 |

## SVG · 圖示 `public/ink/icons/`

劍、傘、酒旗、玉佩、石橋、卷軸、燈籠、山門、`stages-strip.svg`（十階意象條）

## SVG · 框線 `public/ink/frames/`

`scroll-frame.svg` · `title-slip.svg` · `ink-fade-line.svg` · `brush-stroke.svg`

## 程式接線

- 路徑助手：`src/ui/inkAssets.ts`（`inkUrl` / `pickEventBanner`）
- 遠山底：`InkScrollBackdrop`（`InkDecor.tsx`）
- 開卷題簽／十階：`InkStartScreen.tsx`
- 事件橫幅：`InkPlayScreen` + `InkEventBanner`
