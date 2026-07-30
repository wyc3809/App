# Systems Index — 江湖一生 V1（重構後）

| System | Owner module | Status |
|--------|----------------|--------|
| Seeded RNG | `core/random.ts` | stable |
| Life GameState | `core/life/gameState.ts` | stable |
| Legacy / reincarnation | `core/life/legacy.ts` | new |
| Death cause | `core/life/death.ts` | new |
| Requirements | `core/life/requirements.ts` | stable |
| Effects | `core/life/effects.ts` | enhance |
| Event Engine | `core/life/eventEngine.ts` | stage-weighted pick |
| Life stages | `core/life/stages.ts` | wired into pick |
| Presentation / chronicle | `core/life/chronicle.ts` | stable |
| Event catalog | `data/events/*` | keep 50+ / pack / bosses |
| Combat | `core/life/combat.ts` + `combatCore.ts` | stable |
| Huashan contest | `core/life/huashan.ts` | stable |
| Tutorial coach | `core/life/tutorial.ts` | new |
| Telemetry stubs | `src/telemetry/events.ts` | new |
| Save | `core/life/saveIndexedDb.ts` | stable |
| UI shell | `src/components/ink/*` | polish |

## Core fantasy

玩家不是打關卡，而是在水墨手卷上寫下一篇可重玩的江湖人生。

## Pillars

見 `design/gdd/game-pillars.md`。
