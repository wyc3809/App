# UX / Motion — 水墨動效潤飾

## Purpose

依 art bible「VFX & Motion」全面強化開卷／行卷／蓋印／翻頁節奏，讓畫面讀作手卷而非 App 面板。

## Motion Language（准許）

| 時機 | 動作 | 時長 | 說明 |
|------|------|------|------|
| 入場 | 墨暈淡入（opacity + slight blur） | 0.45–0.7s | 禁彈跳 |
| 抉擇列表 | 由左批註式錯落入 | 0.28s + stagger 45ms | `--i` 延遲 |
| 蓋印 | 朱砂印 scale 0.85→1，微旋 | 0.75–0.9s | 出生／定奪／終 |
| 翻月 | 紙面上移淡出再淡入 | 0.5s | 僅年／月變更 |
| 分卷切換 | 題簽式 wash-in（clip） | 0.4s | 不整頁 remount |
| 結果匣 | 墨暈升起 + 角印殘影 | 0.4s | 故事先於得失 |
| 遠山／霧 | 極緩呼吸、掃霧 | 10–18s loop | 氛圍，非互動 |

## Prohibitions

- 彈跳、霓虹脈衝、厚陰影卡片彈入
- 紫／靛漸層、圓角膠囊 CTA 列
- 以 glow 代替霧感

## Accessibility

- `prefers-reduced-motion: reduce` → 關閉循環與入場動效，保留即時狀態回饋（選中邊線、蓋印靜態）
- 觸控目標 ≥ 44px；對比維持墨於紙 ≥ 4.5:1

## Screens touched

開卷、立卷、行卷（分卷／事件／戰鬥／結果匣／年譜）、掩卷。
