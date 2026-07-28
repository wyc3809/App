# 江湖引擎 Jianghu Engine™ 2.1

直版 **BitLife 風格**武俠人生模擬器（Web / React），依產品規格 Volume 01、04、07 與 Memory 架構實作核心引擎與可玩原型。

## 設計原則

- 萬物由引擎推演（種子 RNG，禁止 `Math.random()`）
- NPC 與玩家共用同一套角色、屬性、人格與模擬邏輯
- 行動寫入歷史；死亡後世界與 NPC 仍持續運轉

## 手機遊玩（網頁版）

部署後用手機瀏覽器開啟：

**https://wyc3809.github.io/App/**

- 建議用 Chrome（Android）或 Safari（iPhone）
- iPhone：Safari → 分享 → **加入主畫面**，可像 App 全螢幕開啟
- 進度會自動存於本機瀏覽器（換手機需重新開始）

若連結暫時 404，請在 GitHub 倉庫 **Settings → Pages** 確認來源為 **GitHub Actions**，並等 `Deploy to GitHub Pages` 工作流程跑完。

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
