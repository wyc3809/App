## Jianghu Random Events Pack v1 — Godot 4 載入／過濾／加權抽取範例
## 建議路徑：res://scripts/repositories/jianghu_event_repository.gd
## 配套內容：
##   res://content/events/jianghu_random_events_100.json
##   res://content/schema/jianghu_random_events.schema.json
## 流程：conditions 過濾 → weight 加權抽取 → 顯示 choices
##       → OutcomeResolver 執行 outcomes → 寫入 completion flags

class_name JianghuEventRepository
extends RefCounted

const PACK_PATH := "res://content/events/jianghu_random_events_100.json"

var _library: Dictionary = {}
var _events: Array = []


func load_pack(path: String = PACK_PATH) -> bool:
	if not FileAccess.file_exists(path):
		push_error("JianghuEventRepository: missing %s" % path)
		return false
	var raw := FileAccess.get_file_as_string(path)
	var parsed = JSON.parse_string(raw)
	if typeof(parsed) != TYPE_DICTIONARY:
		push_error("JianghuEventRepository: invalid JSON root")
		return false
	_library = parsed
	_events = parsed.get("events", [])
	return _events.size() == int(parsed.get("event_count", 0))


func get_library_meta() -> Dictionary:
	return {
		"library_id": _library.get("library_id", ""),
		"version": _library.get("version", ""),
		"language": _library.get("language", ""),
		"event_count": _events.size(),
	}


## player_context 預期欄位：age, location, flags (Dictionary)
func filter_by_conditions(player_context: Dictionary) -> Array:
	var eligible: Array = []
	for event in _events:
		if _passes_conditions(event, player_context):
			eligible.append(event)
	return eligible


func pick_weighted(eligible: Array, rng: RandomNumberGenerator) -> Dictionary:
	if eligible.is_empty():
		return {}
	var total := 0.0
	for event in eligible:
		total += float(event.get("weight", 1))
	if total <= 0.0:
		return eligible[rng.randi_range(0, eligible.size() - 1)]
	var roll := rng.randf() * total
	for event in eligible:
		roll -= float(event.get("weight", 1))
		if roll <= 0.0:
			return event
	return eligible.back()


func pick_event(player_context: Dictionary, rng: RandomNumberGenerator) -> Dictionary:
	var eligible := filter_by_conditions(player_context)
	return pick_weighted(eligible, rng)


func mark_completed(player_flags: Dictionary, event_id: String) -> void:
	player_flags["completed_%s" % event_id] = true
	player_flags["done_%s" % event_id] = true


func _passes_conditions(event: Dictionary, ctx: Dictionary) -> bool:
	var cond: Dictionary = event.get("conditions", {})
	var age := int(ctx.get("age", 0))
	var min_age = cond.get("min_age", null)
	var max_age = cond.get("max_age", null)
	if min_age != null and age < int(min_age):
		return false
	if max_age != null and age > int(max_age):
		return false

	var flags: Dictionary = ctx.get("flags", {})
	for required in cond.get("required_flags", []):
		if not flags.get(str(required), false):
			return false
	for forbidden in cond.get("forbidden_flags", []):
		if flags.get(str(forbidden), false):
			return false

	var allowed: Array = cond.get("allowed_locations", [])
	if not allowed.is_empty():
		var loc := str(ctx.get("location", ""))
		if loc not in allowed:
			return false

	return true
