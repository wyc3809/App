# Systems Index — 江湖一生 V1（重構後）

| System | Owner module | Status |
|--------|----------------|--------|
| Seeded RNG | `core/random.ts` | stable |
| Life GameState | `core/life/gameState.ts` | rewrite |
| Requirements | `core/life/requirements.ts` | stable |
| Effects | `core/life/effects.ts` | enhance |
| Event Engine | `core/life/eventEngine.ts` | rewrite orchestration |
| Presentation / chronicle | `core/life/chronicle.ts` | new |
| Life stages | `core/life/stages.ts` | new |
| Event catalog | `data/events/catalog.ts` | keep 50+ |
| Save | `core/life/saveIndexedDb.ts` | stable |
| UI shell | `src/components/ink/*` | rewrite |

## Core fantasy

玩家不是打關卡，而是在水墨手卷上寫下一篇可重玩的江湖人生。
