# Claude Code Game Studios -- 江湖一生 (Jianghu Life Engine)

Indie game development managed through 49 coordinated Claude Code subagents.
This repo has **adopted** [Claude Code Game Studios](https://github.com/Donchitos/Claude-Code-Game-Studios)
on top of an existing playable V1.

> **Split products**: Git `main` in this remote is **WorthBook** (Next.js). Jianghu
> work stays on Jianghu branches only — never merge the two app trees.
> See `docs/PRODUCT-SEPARATION.md`.

## Technology Stack

- **Engine / Runtime**: Web (Vite + React 19)
- **Language**: TypeScript
- **State**: Zustand
- **Validation**: Zod
- **Persistence**: IndexedDB (+ localStorage fallback)
- **RNG**: Seeded PCG32 (`core/random.ts`) — never `Math.random()` in simulation
- **Tests**: Vitest
- **Version Control**: Git
- **Build**: `npm run build` / `npm test` / `npm run dev`

> Engine-specialist agents for Godot / Unity / Unreal remain available for
> reference, but this project is a **browser life-sim**. Prefer
> `gameplay-programmer`, `ui-programmer`, `systems-designer`, `qa-tester`.

## Game Concept (current)

- **Title**: 江湖一生 · Jianghu Life Engine V1.0
- **Genre**: BitLife × 武俠人生模擬（事件驅動）
- **Loop**: 出生 → 家庭 → 成長 → 拜師 → 江湖 → 戀愛 → 門派 → 戰鬥 → 財富 → 老年 → 死亡 → 總結 → 傳承
- **Content model**: JSON / TS event catalog (`data/events/catalog.ts`) — 50 events MVP
- **UI**: 水墨風直版手機窗（`src/styles.css`）

## Project Structure (game code)

| Path | Role |
|------|------|
| `src/` | React UI（`LifeGameScreen`, Zustand store） |
| `core/life/` | Event engine, requirements, effects, save |
| `core/` | Shared RNG, ids, legacy tick sim |
| `data/events/` | Event database |
| `interfaces/` | Zod + TypeScript contracts |
| `tests/` | Vitest |
| `design/` | GDDs / registry（CCGS） |
| `docs/` | Architecture / ADRs / workflow（CCGS） |
| `production/` | Sprint / session state（CCGS） |
| `.claude/` | 49 agents · 73 skills · hooks · rules |

@.claude/docs/directory-structure.md

## Technical Preferences

@.claude/docs/technical-preferences.md

## Coordination Rules

@.claude/docs/coordination-rules.md

## Collaboration Protocol

**User-driven collaboration, not autonomous execution.**
Every task follows: **Question -> Options -> Decision -> Draft -> Approval**

- Agents MUST ask before large multi-file rewrites of the playable MVP
- Prefer extending `data/events/catalog.ts` over hardcoding story in UI
- Keep seeded RNG deterministic; add Vitest for engine changes
- No commits without user instruction (local Cloud Agent workflows may differ)

See `docs/COLLABORATIVE-DESIGN-PRINCIPLE.md` for full protocol.

> **First Claude Code session?** Run `/start` or `/adopt`（既有專案）或
> `/project-stage-detect` 來對齊目前階段。

## Coding Standards

@.claude/docs/coding-standards.md

## Context Management

@.claude/docs/context-management.md
