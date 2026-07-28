# Jianghu Random Events Pack v1

原創繁體中文武俠隨機事件庫（100 則）。僅用公有領域古典作品之抽象母題，無現代武俠 IP。

## 放置位置

| 檔案 | 路徑 |
|------|------|
| 事件庫 | `content/events/jianghu_random_events_100.json`（Vite 同步：`data/events/`） |
| Schema | `content/schema/jianghu_random_events.schema.json` |
| Godot 載入範例 | `scripts/repositories/jianghu_event_repository.gd` |
| Godot Outcome | `scripts/services/outcome_resolver.gd` |
| Web 倉庫 | `core/life/jianghuEventRepository.ts` |
| Web Outcome | `core/life/outcomeResolver.ts` |

## 執行流程

1. **conditions 過濾**（年齡、required/forbidden flags、地點）
2. **weight 加權抽取**
3. **顯示 choices**（保留包內原文三選）
4. **OutcomeResolver** 依 `op` / `path` / `value` / `chance` 執行
5. **寫入 completion flags**：`completed_event_XXX`（下次過濾排除）

玩家 UI 對 pack 事件顯示「江湖偶遇」，不暴露資料庫標題。
