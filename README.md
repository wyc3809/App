# 江湖一生 Jianghu Life Engine V1.0

**BitLife × 武俠人生模擬** — 玩家體驗可重玩的武俠人生，內容由 **JSON 事件引擎** 驅動。

## 核心循環

出生 → 家庭 → 成長 → 拜師 → 江湖 → 戀愛 → 門派 → 戰鬥 → 財富 → 老年 → 死亡 → 人生總結 → 傳承

## 技術棧

| 層級 | 技術 |
|------|------|
| UI | React + TypeScript + Vite |
| 狀態 | Zustand |
| 校驗 | Zod |
| 存檔 | IndexedDB（localStorage 備援） |
| 隨機 | 種子 PCG32（禁止 `Math.random()`） |
| 測試 | Vitest |

## Codex 模組順序

1. `interfaces/lifeEngine.ts` — GameState、GameEvent、Zod
2. `core/random.ts` — Seeded RNG
3. `core/life/eventEngine.ts` — 事件抽取與選擇結算
4. `core/life/requirements.ts` / `effects.ts` — 條件與效果
5. `core/life/saveIndexedDb.ts` — 存檔
6. `src/components/LifeDebugPanel.tsx` — 除錯面板
7. `data/events/catalog.ts` — **50** 個事件
8. `src/components/LifeGameScreen.tsx` — 直版 UI

## 事件資料格式

```ts
GameEvent {
  id,
  title,
  requirements?,
  choices: [{ id, text, outcomes: [{ effects }] }]
}
```

效果類型包含：`narrate`、`attr`、`money`、`health`、`martial`、`joinSect`、`learnSkill`、`lover`、`die` 等。

## 本地開發

```bash
npm install
npm run dev
npm test
npm run build
```

## 遺留引擎（2.x）

`core/world.ts`、`core/gameplay.ts` 等 tick 模擬引擎仍保留於倉庫，供後續與人生引擎合併或對照；目前 **預設入口為 V1 人生模式**（`src/App.tsx`）。

## Claude Code Game Studios

本專案已安裝 [Claude Code Game Studios](https://github.com/Donchitos/Claude-Code-Game-Studios)
（49 agents · 73 skills · hooks · rules）。

```bash
# 需安裝 Claude Code CLI
npm install -g @anthropic-ai/claude-code
claude
# 然後執行 /start 或 /adopt
```

主設定見根目錄 `CLAUDE.md`，代理與技能在 `.claude/`。

## 部署

與先前相同：GitHub Pages（`npm run build:pages`）、Vercel、Netlify、Cloudflare — 見 `vercel.json` / `netlify.toml`。

### 雙產品注意（jianghu vs WorthTracker）

- **本分支／此 repo 根目錄**是 Vite「江湖一生」遊戲。
- `main` 上可能另有 **WorthTracker**（Next.js）；**勿把 WorthTracker 根目錄直接 merge 進遊戲根**。
- GitHub Pages（`gh-pages`）若同時託管兩者：遊戲在 `/App/`，WorthTracker 在 `/App/worthtracker/`。
- 手動部署請用 `bash scripts/deploy-pages.sh`（會 `build:pages` 並在切到 `gh-pages` 時**保留 `worthtracker/`**）。
- CI：`npm test` + `npm run audit:narrate`（禁詞／非 catalog 空洞模板）。
