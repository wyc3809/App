# 江湖引擎 Jianghu Engine™ 2.1

直版 **BitLife 風格**武俠人生模擬器（Web / React），依產品規格 Volume 01、04、07 與 Memory 架構實作核心引擎與可玩原型。

## 設計原則

- 萬物由引擎推演（種子 RNG，禁止 `Math.random()`）
- NPC 與玩家共用同一套角色、屬性、人格與模擬邏輯
- 行動寫入歷史；死亡後世界與 NPC 仍持續運轉

## 手機打不開？（重要）

目前 GitHub 倉庫 **App 是私人（Private）**。在免費方案下，**私人倉庫的 GitHub Pages 不會對外公開**，手機用瀏覽器開 `https://wyc3809.github.io/App/` 會一直 **404**（與你有沒有設定 Pages 無關）。

請任選一種方式：

### 方式 A：公開倉庫（最簡單，推薦）

1. 打開 https://github.com/wyc3809/App/settings  
2. 最下方 **Danger Zone → Change repository visibility → Public**  
3. 再打開 https://github.com/wyc3809/App/settings/pages  
4. **Source**：Deploy from a branch → 分支 **`gh-pages`** → **`/ (root)`** → Save  
5. 等 2 分鐘，手機開：**https://wyc3809.github.io/App/**

### 方式 B：Vercel（倉庫可維持私人）

1. 註冊 https://vercel.com ，用 GitHub 登入  
2. **Add New Project** → 選 `wyc3809/App`  
3. Build Command：`npm run build`（或 `npm run build:mobile`）  
4. Output Directory：`dist`  
5. Environment：`VITE_BASE` = `/`  
6. Deploy 後用手機開 Vercel 給的網址（例如 `https://app-xxx.vercel.app`）

專案已含 `vercel.json`、`netlify.toml`，也可一鍵部署 Netlify。

### 方式 C：Cloudflare Pages

在 GitHub 倉庫 **Settings → Secrets** 新增：

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

然後在 Actions 手動執行 **Deploy to Cloudflare Pages**。

---

## 手機遊玩（公開 Pages 成功後）

**https://wyc3809.github.io/App/**

- iPhone：Safari → 分享 → **加入主畫面**
- 進度存在本機瀏覽器

若連結暫時無法開啟，請先完成上方 **方式 A** 的公開倉庫與 Pages 設定。

## 本地開發

```bash
npm install
npm run dev
```

```bash
npm run build
npm test
```

## 目錄（對應規格）

| 路徑 | 說明 |
|------|------|
| `core/` | Attribute、Personality、Memory、Simulation、Gameplay |
| `interfaces/` | GameState 與元件介面 |
| `src/` | 直版 UI（420px 手機視窗） |
| `tests/` | 種子確定性與屬性測試 |

- **門派**：拜入、功勳晉升、門派差事、捐獻、脫離；門派世界模擬（掌門繼承、庫藏、對立）
- **自然存檔**：每次行動自動 delta 存檔至 `localStorage`，關閉頁面時再寫入；首頁「延續江湖」

1. 點「踏入江湖」建立世界與角色  
2. 使用練武、修內、遊歷、決鬥等行動推進人生  
3. 「過一年」快轉模擬（Fast：1 tick = 5 分鐘）  
4. 死亡後可「轉世再入江湖」；其餘 NPC 與傳聞仍會更新  

## 後續 Volume

可擴充：ECS 排程、Delta Save、Combat / Quest / Faction 完整模組、Health Engine 等。
