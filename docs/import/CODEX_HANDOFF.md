# Codex Handoff

## Current State
- Windows/Godot bootstrap foundation has been created.
- Content validation passes with starter JSON data.
- Godot parse and GDScript tests are blocked until Godot 4 is installed or added to PATH.
- Playable web preview now has stronger event fallout: conditions such as bleeding, internal injury, fracture, poison, limp and old scars can be applied by risky events and combat.
- Home HUD bars have a stronger ink-wash visual treatment, with condition chips shown under the vitals.
- Jianghu Random Events Pack v1 has been added to the Godot content pipeline with 100 events, schema, repository filtering/weighted draw and a lightweight outcome resolver.
- PlayablePreview now loads the same 100-event JSON over HTTP and uses it for monthly event draws before falling back to the older built-in event pool.
- PlayablePreview now hides random-event-pack debug labels and hides pack event titles in the event card.
- Random pack choices are rewritten at load time using category-specific choice banks, so events no longer show the same generic option set.
- Random pack events are now treated as special events using a seeded countdown. They appear roughly once every 10-18 monthly advances instead of most months.
- Monthly settlement and event outcomes now display quantified changes for HP, internal energy, stamina, fatigue, money, reputation, caps, mood and injuries where applicable.
- Added world-state simulation for order, danger, economy, rumors, and seasonal mood.
- Added chapter/story progression with current chapter goal and quantified progress.
- Added ordinary monthly event generator so non-special months have more varied market, clinic, training, road, family, rumor, and reflection scenes.
- Added cultivation actions: rumor gathering, chivalry work, and retreat/reflection.
- Added online reference notes documenting public-domain/open-access research sources and design takeaways.

## Next Task
Build the playable Character Creation vertical slice:
- name entry
- birthplace locked to 千燈鎮
- generated attributes
- generated talents/personality
- start game into portrait home screen
- monthly advance button in the center
- autosave only

## Commands
```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\tools\bootstrap\bootstrap-windows.ps1
python .\JianghuLife\tools\content_validation\validate_content.py .\JianghuLife\content
```

## Latest Verification
- `node` JavaScript parse check for `PlayablePreview/index.html`: passed.
- Content validation: passed.
- Random events pack check: passed, 100 events and all choices >= 3.
- PlayablePreview JavaScript parse: passed.
- PlayablePreview HTTP check for `/content/events/jianghu_random_events_100.json`: passed, HTTP 200.
- PlayablePreview HTTP check for revised HTML: passed, no visible event-library status card.
- PlayablePreview JavaScript parse after special-event frequency and quantified-result changes: passed.
- HTTP check confirmed revised HTML exposes `specialEventCountdown` and `monthlyResult`.
- JavaScript parse passed after world/story/ordinary-event enhancements.
- Content validation passed after enhancement.
- HTTP check confirmed revised HTML exposes `makeWorldState` and `makeOrdinaryWorldEvent`.
- Godot parse/tests: still blocked until Godot is installed.

## AI Export
- Created root `AI_IMPORT_BRIEF.md` for importing this project into another AI.
- Created `JianghuLife/PROJECT_EXPORT_MANIFEST.md`.
- Created reusable export script: `tools/export/create_ai_export.py`.
- Latest zip export: `Exports/JianghuLife_AI_Import_Package_20260728-084004.zip`.
- SHA256: `9de77d8dc7052fba56c573873e7b7316d7f7a134697e4c98403c8a4f9852fb6c`.
- Zip integrity check: passed.
