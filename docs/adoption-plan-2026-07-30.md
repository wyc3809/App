# Adoption Plan — 江湖一生（2026-07-30）

Scanning project artifacts...

**Detected phase**: Production（`production/stage.txt`）  
**Found**: 3 GDD-ish docs (`game-concept`, `systems-index`, `game-pillars`), 0 ADRs, 0 epic stories, engine configured (Vite/React).

## Format compliance gaps

| Artifact | Status | Impact |
|----------|--------|--------|
| `production/stage.txt` | ✅ written | Unblocks `/help` `/gate-check` |
| `design/gdd/game-pillars.md` | ✅ written | Creative north star |
| Per-system GDDs (8 required sections) | ❌ thin / missing | Medium — reverse-doc later |
| `design/player-journey.md` | ❌ missing | Medium — UX specs assume it |
| ADRs | ❌ missing | Low for current web MVP |
| Epic/stories | ❌ missing | Low — use backlog below |
| Systems index | ⚠️ outdated | Update alongside features |

## Migration priorities

1. **P0 player loop honesty** — death cause, legacy carry, empty-choice escape, stage weight bias  
2. **P0 accessibility** — viewport zoom, mute, modal Esc/focus, hide debug in prod  
3. **P1 session clarity** — story strip, first-run coach, chronicle open on first entries  
4. **P2 docs** — reverse-document combat / events GDDs when touching those systems  

## This sprint (implemented with adopt)

- Pillars + stage  
- Legacy reincarnation  
- Death cause in epitaph  
- Coach + story strip + a11y + audio mute  
- `stageWeightBias` wired  
- Telemetry stubs for funnel  
