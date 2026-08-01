/**
 * ADR-001: Unified Event Runtime View
 *
 * Status: Accepted
 * Date: 2026-08-01
 *
 * Context
 * -------
 * 江湖一生同時存在兩套事件資料：
 * - Zod `GameEvent` + `GameEffect[]`（catalog / ordinary / road…）
 * - Pack v1 `op/path/value`（jianghu_random_events_100.json）
 * 運行時在 `applyChoice` 以 `tags.includes('pack')` 分叉。
 * 全面改寫 JSON 成本過高，但需要單一「視圖」與單一結算入口，方便短弧／敘事覆蓋／測試。
 *
 * Decision
 * --------
 * 1. 引入 `RuntimeEventView`（`interfaces/eventRuntime.ts`）描述 UI／資格所需欄位與 `resolveMode`。
 * 2. 結算統一走 `resolveChoice`（`core/life/resolveChoice.ts`），內部分 `effects` | `pack` | `combat`。
 * 3. 作者端 JSON **暫不遷移**；Pack 仍由 `jianghuEventRepository` 持有原始 ops。
 * 4. 後續可把 Pack 編譯成 GameEffect IR，而不改玩法 API。
 *
 * Consequences
 * ------------
 * + 新系統（短弧、敘事覆蓋）只依賴 RuntimeView / resolveChoice
 * + 測試可針對結算入口
 * − 雙資料源仍在，編譯器下一階段再收斂
 */

export {};
