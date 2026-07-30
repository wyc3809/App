# Game Pillars: 江湖一生

## Document Status
- **Version**: 1.0
- **Last Updated**: 2026-07-30
- **Approved By**: creative-director (brownfield adopt)
- **Status**: Approved

---

## Core Fantasy

> 你不是在打關卡，而是在宣紙手卷上寫下一篇可重玩的江湖人生：從少年出鎮、抉擇、交手、眷屬與門派，到掩卷傳承——每一世留下可被下一世感知的墨跡。

---

## Target MDA Aesthetics

| Rank | Aesthetic | How Our Game Delivers It |
| ---- | ---- | ---- |
| 1 | Narrative | 按月事件、墓誌、年譜與章節心志 |
| 2 | Fantasy | 武俠身份、門派、武學、華山論劍 |
| 3 | Discovery | 奇遇池、傳聞、首領、裝備效果 |
| 4 | Challenge | 回合交手、路遇節奏、老年生死 |
| N/A | Fellowship | 僅非同步幽靈論劍；非即時多人社交 |

---

## The Pillars

### Pillar 1: 手卷即人生

**One-Sentence Definition**: 主介面必須讀作宣紙手卷（時間軸＋抉擇＋印章），不得讀作儀表板或卡片牆。

**Target Aesthetics Served**: Narrative, Fantasy

**Design Test**: 若拿掉導航後第一屏仍像通用 App 統計頁，則違反本支柱。

#### Serving This Pillar
- 鎮居優先事件／翻頁；年譜與提示預設收合
- 結果匣先故事後數值；朱砂印定奪

#### Violating This Pillar
- 首屏堆疊屬性條、排程、統計卡
- 戰鬥 HUD 與全局氣血雙重儀表搶戲

---

### Pillar 2: 抉擇留下墨跡

**One-Sentence Definition**: 每個重要選擇必須改變可感知狀態（屬性、關係、傳聞、生死或下一世傳承），禁止純裝飾選項。

**Target Aesthetics Served**: Narrative, Discovery

**Design Test**: 若兩選結果文案不同但狀態完全相同，必須合併或補效果。

#### Serving This Pillar
- 傳承閉環：家族／傳功旗標影響轉世開局
- 死因寫入墓誌，死亡不是同一句空話

#### Violating This Pillar
- 「轉世再入江湖」等同全新隨機開局、無視前世
- 空抉擇列表卡死無退路

---

### Pillar 3: 江湖有節奏

**One-Sentence Definition**: 日常翻頁、路遇、奇遇、首領、論劍各有可預期的時間節奏；老年與章節推進可被玩家感覺到。

**Target Aesthetics Served**: Challenge, Discovery

**Design Test**: 事件權重必須隨人生階段偏置；玩家應能在鎮居看到當前章節心志。

#### Serving This Pillar
- `stageWeightBias` 接入抽選
- 故事章節條常駐鎮居

#### Violating This Pillar
- 童年標籤事件永遠抽不到卻仍佔目錄門面
- 章節只在後端加數、UI 完全隱形

---

### Pillar 4: 筆觸可感、可及

**One-Sentence Definition**: 按壓、印章、音效與動效服務水墨語言；同時必須可縮放、可靜音、可鍵盤關閉結果匣。

**Target Aesthetics Served**: Sensation (supporting), Submission

**Design Test**: 無法捏合縮放、無法關音、結果匣無法 Esc 關閉 → 未達本支柱。

---

## Anti-Pillars

- **NOT 課金碾壓 P2W**: 數值成長來自人生抉擇與修煉，不靠付費直購戰力。
- **NOT 開放世界探索**: 空間是地點標籤與事件池，不做地圖漫遊。
- **NOT 即時動作操作**: 交手是回合敘事，不做連招手速競技。

---

## Pillar Conflict Resolution

| Priority | Pillar | Rationale |
| ---- | ---- | ---- |
| 1 | 手卷即人生 | 品牌與辨識度 |
| 2 | 抉擇留下墨跡 | 核心循環誠實 |
| 3 | 江湖有節奏 | 長線可玩 |
| 4 | 筆觸可感、可及 | 打磨與可信度 |

---

## Reference Games

| Reference | What We Take | What We Do Differently |
| ---- | ---- | ---- |
| BitLife | 一生時間軸＋摘要＋重開 | 武俠系統深度與水墨敘事 |
| 太吾繪卷 | 傳承／後代感 | 單人一卷、輕量瀏覽器 |
| 墨骨 / 水墨視覺遊戲 | 留白與印章語言 | 人生模擬非動作關卡 |
