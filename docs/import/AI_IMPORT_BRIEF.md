# Jianghu Life AI Import Brief

This archive contains the current Jianghu Life / 江湖一生 project state for continuation by another AI assistant or developer.

## Current Product Direction

Jianghu Life is an original wuxia life-simulation game. The current playable version is a portrait mobile web preview under:

`JianghuLife/PlayablePreview/index.html`

The longer-term Windows development target is Godot 4 with GDScript and JSON content. The Godot project foundation exists under:

`JianghuLife/project.godot`

Do not claim that iOS build, signing, TestFlight, App Store submission, Xcode, or iOS Simulator validation has been completed from Windows. Final iOS export requires legal macOS, Xcode, Apple Developer signing assets, and Godot iOS export workflow.

## How To Run The Current Playable Preview

From the repository root:

```powershell
cd JianghuLife\PlayablePreview
python -m http.server 8787 --bind 0.0.0.0
```

Open:

```text
http://localhost:8787
```

For a phone on the same Wi-Fi, use the machine LAN IP with port `8787`.

## Current Playable Features

- Portrait mobile layout.
- Autosave through browser localStorage only.
- Monthly progression only.
- Character creation with birthplace locked to 千燈鎮.
- Home / character / jianghu / cultivation style tabs.
- Martial arts ranks: 略有小成, 駕輕就熟, 融會貫通, 神乎其技.
- Sect / faction actions.
- Equipment system and special gear.
- Lineage / next-generation inheritance foundation.
- Combat loop.
- Injuries and lasting conditions: bleeding, internal injury, fracture, poison, limp, old scars.
- Medical recovery action.
- Ink-wash inspired UI bars and condition chips.
- Quantified monthly settlement and event result deltas where appropriate.
- World state simulation: order, danger, economy, rumors, seasonal mood.
- Chapter/story progression with current chapter, goal, and quantified progress.
- Ordinary monthly event generator for market, clinic, training hall, road danger, family letters, rumors, and night-rain reflection scenes.
- Additional cultivation actions: rumor gathering, chivalry work, and retreat/reflection.
- Jianghu Random Events Pack v1 is loaded by the preview over HTTP.
- The 100 random pack events are treated as special events using a seeded countdown. They appear roughly every 10-18 monthly advances, not every month.
- Pack event titles and library labels are hidden from the player-facing event card.
- Pack choices are rewritten at load time using category-specific choice banks, so choices vary by event category.

## Important Files

### Playable Preview

- `JianghuLife/PlayablePreview/index.html`
- `JianghuLife/PlayablePreview/content/events/jianghu_random_events_100.json`

### Godot Foundation

- `JianghuLife/project.godot`
- `JianghuLife/scenes/app/root.tscn`
- `JianghuLife/scripts/core/seeded_rng.gd`
- `JianghuLife/scripts/core/game_clock.gd`
- `JianghuLife/scripts/core/domain_event_bus.gd`
- `JianghuLife/scripts/core/app_container.gd`
- `JianghuLife/scripts/repositories/content_repository.gd`
- `JianghuLife/scripts/repositories/jianghu_event_repository.gd`
- `JianghuLife/scripts/services/save_service.gd`
- `JianghuLife/scripts/services/outcome_resolver.gd`
- `JianghuLife/scripts/domain/**/*.gd`

### Content

- `JianghuLife/content/events/jianghu_random_events_100.json`
- `JianghuLife/content/schema/jianghu_random_events.schema.json`
- `JianghuLife/content/events/starter_events.json`
- `JianghuLife/content/npcs/starter_npcs.json`
- `JianghuLife/content/locations/starter_locations.json`
- `JianghuLife/content/items/starter_items.json`
- `JianghuLife/content/martial_arts/starter_martial_arts.json`
- `JianghuLife/content/talents/starter_talents.json`
- `JianghuLife/content/backgrounds/starter_backgrounds.json`

### Validation And Tests

- `JianghuLife/tools/content_validation/validate_content.py`
- `JianghuLife/tests/run_tests.gd`
- `JianghuLife/tests/unit/test_seeded_rng.gd`
- `JianghuLife/tests/unit/test_game_clock.gd`
- `JianghuLife/tests/unit/test_jianghu_event_repository.gd`
- `tools/quality/*.ps1`

### Handoff Docs

- `JianghuLife/CODEX_HANDOFF.md`
- `JianghuLife/docs/BUILD_PROGRESS.md`
- `JianghuLife/docs/game_design/RANDOM_EVENTS_PACK.md`
- `JianghuLife/docs/game_design/VERTICAL_SLICE.md`
- `JianghuLife/docs/architecture/ARCHITECTURE.md`
- `JianghuLife/AGENTS.md`
- `AGENTS.md`

## Verification Commands

JavaScript parse check:

```powershell
node -e "const fs=require('fs'); const s=fs.readFileSync('JianghuLife/PlayablePreview/index.html','utf8'); const m=s.match(/<script>([\s\S]*)<\/script>/); new Function(m?m[1]:''); console.log('JS parse OK');"
```

Content validation:

```powershell
python JianghuLife\tools\content_validation\validate_content.py JianghuLife\content
```

Random events pack check:

```powershell
node -e "const fs=require('fs'); const data=JSON.parse(fs.readFileSync('JianghuLife/PlayablePreview/content/events/jianghu_random_events_100.json','utf8')); console.log(data.library_id, data.events.length)"
```

Godot checks, after Godot 4 is installed and in PATH:

```powershell
godot --headless --path JianghuLife --editor --quit
godot --headless --path JianghuLife -s tests/run_tests.gd
```

## Known Environment Status

- Git, Git LFS, Node.js, npm, Python, and VS Code were present.
- `winget` was not available in the active shell during setup.
- `godot` was not available in PATH, so Godot parse and GDScript tests were not executed.
- The playable preview was verified through JavaScript parse checks and HTTP checks.

## Recommended Next Task

Continue from the playable preview first, then migrate stable logic into Godot:

1. Add a player-facing event result panel that clearly separates narrative feedback from quantified stat changes.
2. Add richer NPC relationship scenes that depend on trust/friendship/fear.
3. Connect ordinary monthly generator to NPC memories and rumors.
4. Connect JianghuEventRepository and OutcomeResolver into the Godot scene flow once Godot is installed.
5. Build the Godot character creation vertical slice using the existing web preview as reference.

## Rules For The Next AI

- Do not remove autosave or deterministic RNG.
- Do not show debug labels such as event library name in the player UI.
- Keep special 100-pack events rare, roughly every 10-18 monthly advances.
- Keep player-facing choices varied by event category.
- Quantify values that should be quantified: age, money, HP, internal energy, stamina, fatigue, reputation, caps, injury count.
- Preserve some mystery for chances, hidden talents, rare encounter probability, and non-obvious AI decisions.
- Do not introduce copyrighted wuxia characters, factions, techniques, or locations from modern IP.
- Treat mojibake in terminal output as a display/encoding issue unless file content itself is confirmed corrupt. Use UTF-8 reads/writes.
