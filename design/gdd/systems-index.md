# Systems Index — 江湖一生（Leap 1–5）

| System | Owner module | Status |
|--------|----------------|--------|
| Unified event runtime | `interfaces/eventRuntime.ts`, `core/life/resolveChoice.ts` | ADR-001 |
| Event engine | `core/life/eventEngine.ts` | stage-weighted + arcs |
| Narrate overrides | `data/events/narrateOverrides.ts` | high-traffic rewrite |
| Short life arcs | `core/life/arcs.ts` | active |
| Town NPCs | `core/life/npcCatalog.ts` + `content/npcs/` | wired |
| Foe AI styles | `core/life/foeAi.ts` | active |
| Combat presentation | `core/life/combatPresentation.ts` | opening / aftermath UI |
| Ink scene variants | `src/components/ink/sceneVariants.ts` | season + place |
| Legacy / death / coach | `legacy.ts` / `death.ts` / `tutorial.ts` | stable |
| Story chapters | — | **cancelled** |

## Leap packages

1. 統一運行時視圖（不改寫 Pack JSON）
2. 短弧 + 鎮中故人記憶
3. 高頻敘事覆蓋 + `scripts/auditNarrate.mjs`
4. 敵人路數 AI + 餘波提示
5. 季節／地點水墨舞台

見 `docs/architecture/adr-001-unified-event-runtime.md`。
