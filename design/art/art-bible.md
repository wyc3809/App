# Art Bible — 江湖一生

> **權威風格約束見 [`STYLE-BIBLE.md`](./STYLE-BIBLE.md)**  
> 色彩／字階 token：[`tokens-colors.json`](./tokens-colors.json)、[`tokens-typography.json`](./tokens-typography.json)  
> 素材索引：[`ASSET_INDEX.md`](./ASSET_INDEX.md)  
> 動效片段：[`../ux/css-motions.md`](../ux/css-motions.md)

## 1. Visual Identity Statement

**一筆成江湖，留白即命運。**

- 畫面像一軸未展盡的手卷：紙、墨、印，而非 App 面板。
- 資訊以「書寫」呈現：標題如題簽，選項如批註，軌跡如年譜。
- 朱砂只用在「命運落印」——出生、抉擇確認、死亡蓋棺。

## 2. Color Palette

| Token | Hex | 用法 |
|-------|-----|------|
| `--paper` | `#F3EBDC` | 宣紙底 |
| `--paper-aged` | `#E6D9C4` | 舊紙、卷邊 |
| `--paper-bright` | `#FAF6EE` | 高光紙面 |
| `--ink` | `#1A1A1A` | 正文、標題 |
| `--ink-mid` / `--ink-soft` | `#4A4540` | 次要正文、標籤 |
| `--ink-wash` | `#8A8278` | 旁白、年譜 |
| `--cinnabar` | `#A33A32` | 印章、關鍵 CTA |
| `--antique-gold` | `#8A7355` | 稀有器物細線（克制） |
| `--jade` | `#3D5C4F` | 玉佩點睛 |
| `--pine-smoke` | `#2A3530` | 夜雨遠山 |
| `--mist` | `rgba(26,26,26,0.06)` | 遠山、暈染 |

禁止：紫漸層、霓虹、厚陰影卡片、圓角膠囊按鈕列。

## 3. Lighting & Atmosphere

- 均勻紙面光，無戲劇性打光。
- 底部遠山墨暈 + 角落淡墨漬（`public/ink/decor/` SVG）。
- 霧感靠透明度與 blur，不靠 glow。

## 4. Character Art Direction

- MVP 不畫立繪；以姓名、年齡、門派、印記象徵身份。
- 屬性用漢字直書小標（根骨／悟性…），不用西方 RPG 圖示列。

## 5. Environment & Level Art

- 「場景」= 事件標題 + 一兩句正文；背景永遠是紙與山。
- 事件橫幅：約 900×260 水墨（橋／雨夜客棧等），見 `pickEventBanner`。
- 不切換寫實地圖；歲月用年號／歲數推進。

## 6. UI Visual Language

- 直角或極小圓角（≤2px）；邊框 1px 淡墨線。
- 主按鈕：墨底紙字；次按鈕：空心墨線。
- 選項：左側豎線筆觸，hover 加深。
- 標題字距加寬；分隔用淡墨橫線漸隱（`frames/ink-fade-line.svg`）。

## 7. VFX & Motion

- 入場：墨暈淡入（opacity + slight blur）
- 抉擇：批註式錯落入 + 左側筆觸加深；朱砂印輕蓋（scale 0.85→1）
- 翻月：紙面輕微上移淡出／淡入
- 遠山／霧／飛白：極緩呼吸與掃霧（10–22s）
- 禁止彈跳、霓虹脈衝
- 詳見 `design/ux/css-motions.md`、`design/ux/motion-polish.md`；尊重 `prefers-reduced-motion`

## 8. Asset Standards

- SVG 遠山、孤舟、竹角、墨漬、題簽、印章；紙紋用 CSS noise。
- 字體：題簽「馬善政」；正文／UI Noto Serif TC。
- 字重：正文 400；分卷、按鈕、標籤 600；小節題 700。
- 字階：正文 ≥1rem；批註／標籤 ≥0.8rem；題簽用 display。
- 文案語氣：手卷隱喻（開卷／翻頁／落筆／披掛／掩卷）；禁 App 詞。

## 9. Style Prohibitions

- 儀表板式多欄 stats 牆
- 彩色進度彩虹條
- Emoji 作為主要圖示（可用漢字代替）
- 圓角大卡片堆疊的「現代獨立遊戲」預設皮
