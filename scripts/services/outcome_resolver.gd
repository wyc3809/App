## Pack outcome 執行範例（Godot 4）
## 建議路徑：res://scripts/services/outcome_resolver.gd
## 依 op / path / value / chance 套用結果，並可搭配 completion flag。

class_name OutcomeResolver
extends RefCounted


## rng 需提供 randf()；state 為可變 Dictionary（player / event_flags / memories…）
func resolve(state: Dictionary, outcomes: Array, rng: RandomNumberGenerator) -> Array[String]:
	var logs: Array[String] = []
	for raw in outcomes:
		if typeof(raw) != TYPE_DICTIONARY:
			continue
		var chance := float(raw.get("chance", 1.0))
		if chance < 1.0 and rng.randf() > chance:
			continue
		var line := _apply_one(state, raw)
		if line != "":
			logs.append(line)
	return logs


func _apply_one(state: Dictionary, outcome: Dictionary) -> String:
	var op := str(outcome.get("op", ""))
	var path := str(outcome.get("path", ""))
	var value = outcome.get("value", 0)

	match op:
		"add":
			_add_path(state, path, value)
			return "調整 %s（%s）" % [path, str(value)]
		"set_flag":
			var key := path if path != "" else str(value)
			_ensure_dict(state, "event_flags")[key] = true
			_ensure_dict(state, "player").get("flags", {})
			if not state["player"].has("flags"):
				state["player"]["flags"] = {}
			state["player"]["flags"][key] = true
			return "旗標：%s" % key
		"create_memory":
			_ensure_array(state, "memories").append(str(value))
			return str(value)
		"add_item":
			_ensure_array(state, "inventory").append(str(value))
			return "獲得：%s" % str(value)
		"skill_check":
			# 僅記錄檢定意圖；實際成功與否由 chance 已處理
			return str(outcome.get("note", "技能檢定結束"))
		"roll_event":
			_ensure_array(state, "follow_up_pool").append(str(value))
			return "後續機緣：%s" % str(value)
		_:
			return ""


func _add_path(state: Dictionary, path: String, value) -> void:
	var parts := path.split(".")
	var cursor = state
	for i in range(parts.size() - 1):
		var key := parts[i]
		if typeof(cursor) != TYPE_DICTIONARY:
			return
		if not cursor.has(key) or typeof(cursor[key]) != TYPE_DICTIONARY:
			cursor[key] = {}
		cursor = cursor[key]
	if typeof(cursor) != TYPE_DICTIONARY or parts.is_empty():
		return
	var leaf := parts[parts.size() - 1]
	var current = cursor.get(leaf, 0)
	if typeof(current) in [TYPE_INT, TYPE_FLOAT] and typeof(value) in [TYPE_INT, TYPE_FLOAT]:
		cursor[leaf] = current + value
	else:
		cursor[leaf] = value


func _ensure_dict(state: Dictionary, key: String) -> Dictionary:
	if not state.has(key) or typeof(state[key]) != TYPE_DICTIONARY:
		state[key] = {}
	return state[key]


func _ensure_array(state: Dictionary, key: String) -> Array:
	if not state.has(key) or typeof(state[key]) != TYPE_ARRAY:
		state[key] = []
	return state[key]
