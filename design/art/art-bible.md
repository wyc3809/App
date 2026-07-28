# Art Bible — 江湖一生

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
| `--ink` | `#1A1A1A` | 正文、標題 |
| `--ink-mid` | `#4A4540` | 次要文字 |
| `--ink-wash` | `#8A8278` | 註解、旁白 |
| `--cinnabar` | `#A33A32` | 印章、關鍵 CTA |
| `--mist` | `rgba(26,26,26,0.06)` | 遠山、暈染 |

禁止：紫漸層、霓虹、厚陰影卡片、圓角膠囊按鈕列。

## 3. Lighting & Atmosphere

- 均勻紙面光，無戲劇性打光。
- 底部遠山墨暈 + 角落淡墨漬。
- 霧感靠透明度與 blur，不靠 glow。

## 4. Character Art Direction

- MVP 不畫立繪；以姓名、年齡、門派、印記象徵身份。
- 屬性用漢字直書小標（根骨／悟性…），不用西方 RPG 圖示列。

## 5. Environment & Level Art

- 「場景」= 事件標題 + 一兩句正文；背景永遠是紙與山。
- 不切換寫實地圖；歲月用年號／歲數推進。

## 6. UI Visual Language

- 直角或極小圓角（≤2px）；邊框 1px 淡墨線。
- 主按鈕：墨底紙字；次按鈕：空心墨線。
- 選項：左側豎線筆觸，hover 加深。
- 標題字距加寬；分隔用淡墨橫線漸隱。

## 7. VFX & Motion

- 入場：墨暈淡入（opacity + slight blur）
- 抉擇：朱砂印輕蓋（scale 0.85→1）
- 翻年：紙面輕微上移淡出／淡入
- 禁止彈跳、霓虹脈衝

## 8. Asset Standards

- SVG 遠山、印章；紙紋用 CSS noise。
- 字體：標題「馬善政」或「站酷小薇」；正文 Noto Serif TC。

## 9. Style Prohibitions

- 儀表板式多欄 stats 牆
- 彩色進度彩虹條
- Emoji 作為主要圖示（可用漢字代替）
- 圓角大卡片堆疊的「現代獨立遊戲」預設皮
