# 江湖一生 · 文字編輯指南（手機友好）

本目錄下的 JSON／Markdown 即為「可用文字閱讀與修改」的系統與劇本。
你可在手機打開檔案、改字，再把修改內容貼給 AI（例如：「把青雲劍派第三套武學改成……」），由 AI 幫你寫回檔案。

## 檔案一覽

| 檔案 | 用途 |
|------|------|
| `sects/sects.json` | 五大門派、地位名稱、每派四套武學解鎖條件 |
| `martial/catalog.json` | 全部武學名稱、特色文案、戰鬥特效／內功被動 |
| `family/rules.json` | 生育機率、一生孩子上限、年齡與冷卻 |
| `story/chapters.json` | 主線章節標題與目標（劇本大綱） |
| `sects/sects.json` 的 `natureGate` | 門派心性門檻（俠邪狂惡） |
| `events/...` 的 `minNature`/`maxNature`/`nature`/`world` | 奇遇門檻與心性／天下效果 |
| `events/jianghu_random_events_100.json` | 江湖偶遇事件包（條件／選項／結果） |
| `events/starter_events.json` | 較早期的事件範例 |
| `systems/overview.md` | 各系統說明（給人讀的總覽） |

## 門派地位與四套武學

每個門派固定 **四套** 武學，對應地位：

0. 外門弟子 — 拜入即學  
1. 內門弟子 — 地位升至內門後學（或奇遇）  
2. 真傳弟子 — 真傳後學（或奇遇）  
3. 門中執事 — 執事後學（或奇遇）

改 `sects/sects.json` 的 `arts` 陣列即可換「哪一套對應哪一階」。
改 `martial/catalog.json` 可改招式名稱、說明與 **實際戰鬥數值**。

## 戰鬥特效欄位（外功 move）

可在 `move` 裡使用（皆為選填，數值會真實影響戰鬥）：

- `qiCost` 內息消耗  
- `power` 傷害倍率  
- `hitBonus` 命中加成  
- `healSelf` 命中後自療氣血  
- `applyBlind` 令敵下回合命中下降  
- `pierce` 0–1，無視部分防禦  
- `multiHit` 連擊次數（≥2）  
- `qiDrain` 耗敵內息  
- `bleedChance` / `bleedDamage` / `bleedTurns` 流血  
- `stunChance` 暈眩（敵跳過一回合）  
- `defenseBreak` 暫時削敵防  
- `lifesteal` 0–1，傷害吸血  

內功用 `passive`：`attack` `defense` `maxHp` `maxQi` `hitBonus` `qiRegen` `reflect`

## 生育規則

見 `family/rules.json`：

- `lifetimeChildrenMin` / `lifetimeChildrenMax`：開局隨機決定此人一生最多幾個孩子（1–5）  
- `monthlyBirthChance`：有伴侶時每月機率（刻意偏低）  
- `minAge` / `maxAge` / `cooldownMonths`

## 怎麼用手機改劇本

1. 打開對應 JSON，用文字編輯器改標題、正文、選項、效果。  
2. 把「改了什麼」用訊息告訴 AI，例如：

```
請改 martial/catalog.json：
- 青雲「破雲刺」的 pierce 改成 0.45，並加上 qiDrain 18
- 天刀門第四套改名「回風絕刀」，說明改成……
```

3. AI 會直接改倉庫檔案；重新部署後手機即可玩到新內容。

## 注意

- 武學／門派請用原創名稱，勿抄襲特定遊戲／小說專有 IP。  
- 改完 JSON 後需通過建置與測試；格式錯誤會導致遊戲讀不到內容。  
