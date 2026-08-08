import type { GameEffect, GameEvent, EventChoice, EventOutcome } from '@interfaces/lifeEngine';

const LS_KEY = 'jianghu_event_overrides_v1';

/** 手機可改的精簡補丁（唔使整份 GameEvent JSON） */
export type ChoicePatch = {
  text?: string;
  /** 主結果敘事 */
  narrate?: string;
  money?: number;
  health?: number;
  martial?: number;
  reputation?: number;
  qi?: number;
  maxQi?: number;
  maxHealth?: number;
};

export type EventPatch = {
  title?: string;
  body?: string;
  /** 抽中權重；0 = 實質停用 */
  weight?: number;
  /** 標記停用（同時把 weight 視作 0） */
  disabled?: boolean;
  choices?: Record<string, ChoicePatch>;
};

export type EventOverrideStore = {
  version: 1;
  updatedAt: number;
  patches: Record<string, EventPatch>;
};

let memory: EventOverrideStore = { version: 1, updatedAt: 0, patches: {} };
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  for (const fn of listeners) fn();
}

export function subscribeEventOverrides(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getEventOverrideStore(): EventOverrideStore {
  return memory;
}

export function getEventPatch(id: string): EventPatch | undefined {
  return memory.patches[id];
}

export function listPatchedEventIds(): string[] {
  return Object.keys(memory.patches);
}

function persist() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(memory));
  } catch {
    /* quota / private mode */
  }
}

export function loadEventOverrides(): EventOverrideStore {
  if (loaded) return memory;
  loaded = true;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as EventOverrideStore;
      if (parsed?.version === 1 && parsed.patches && typeof parsed.patches === 'object') {
        memory = {
          version: 1,
          updatedAt: Number(parsed.updatedAt) || Date.now(),
          patches: parsed.patches,
        };
      }
    }
  } catch {
    memory = { version: 1, updatedAt: 0, patches: {} };
  }
  return memory;
}

export function saveEventPatch(eventId: string, patch: EventPatch): void {
  loadEventOverrides();
  const clean = sanitizePatch(patch);
  if (isEmptyPatch(clean)) {
    delete memory.patches[eventId];
  } else {
    memory.patches[eventId] = clean;
  }
  memory.updatedAt = Date.now();
  persist();
  emit();
}

export function removeEventPatch(eventId: string): void {
  loadEventOverrides();
  delete memory.patches[eventId];
  memory.updatedAt = Date.now();
  persist();
  emit();
}

export function clearAllEventPatches(): void {
  memory = { version: 1, updatedAt: Date.now(), patches: {} };
  persist();
  emit();
}

/** 測試用：模擬重新載入頁面 */
export function resetEventOverrideRuntime(): void {
  memory = { version: 1, updatedAt: 0, patches: {} };
  loaded = false;
}

export function importEventOverrideStore(raw: unknown): { ok: true; count: number } | { ok: false; error: string } {
  try {
    const parsed = raw as EventOverrideStore;
    if (!parsed || parsed.version !== 1 || typeof parsed.patches !== 'object') {
      return { ok: false, error: '格式不正確（需要 version:1 + patches）' };
    }
    const next: Record<string, EventPatch> = {};
    for (const [id, p] of Object.entries(parsed.patches)) {
      if (!id || !p || typeof p !== 'object') continue;
      const clean = sanitizePatch(p);
      if (!isEmptyPatch(clean)) next[id] = clean;
    }
    memory = { version: 1, updatedAt: Date.now(), patches: next };
    persist();
    emit();
    return { ok: true, count: Object.keys(next).length };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : '匯入失敗' };
  }
}

export function exportEventOverrideStore(): string {
  loadEventOverrides();
  return JSON.stringify(memory, null, 2);
}

function sanitizePatch(patch: EventPatch): EventPatch {
  const out: EventPatch = {};
  if (typeof patch.title === 'string') out.title = patch.title;
  if (typeof patch.body === 'string') out.body = patch.body;
  if (typeof patch.weight === 'number' && Number.isFinite(patch.weight)) {
    out.weight = Math.max(0, Math.round(patch.weight));
  }
  if (patch.disabled === true) out.disabled = true;
  if (patch.choices && typeof patch.choices === 'object') {
    const choices: Record<string, ChoicePatch> = {};
    for (const [cid, ch] of Object.entries(patch.choices)) {
      if (!cid || !ch) continue;
      const c: ChoicePatch = {};
      if (typeof ch.text === 'string') c.text = ch.text;
      if (typeof ch.narrate === 'string') c.narrate = ch.narrate;
      for (const k of ['money', 'health', 'martial', 'reputation', 'qi', 'maxQi', 'maxHealth'] as const) {
        if (typeof ch[k] === 'number' && Number.isFinite(ch[k])) c[k] = Math.round(ch[k]!);
      }
      if (Object.keys(c).length) choices[cid] = c;
    }
    if (Object.keys(choices).length) out.choices = choices;
  }
  return out;
}

function isEmptyPatch(p: EventPatch): boolean {
  return (
    p.title === undefined &&
    p.body === undefined &&
    p.weight === undefined &&
    !p.disabled &&
    (!p.choices || !Object.keys(p.choices).length)
  );
}

function upsertNumeric(effects: GameEffect[], type: GameEffect['type'], amount: number | undefined): GameEffect[] {
  if (amount === undefined) return effects;
  const next = effects.filter((e) => e.type !== type);
  // 0 也寫入，方便明確「唔加減」；刪除可喺編輯器清欄
  next.push({ type, amount } as GameEffect);
  return next;
}

function applyChoicePatch(choice: EventChoice, patch: ChoicePatch): EventChoice {
  let text = patch.text !== undefined ? patch.text : choice.text;
  let outcomes = choice.outcomes.map((o) => ({
    ...o,
    effects: o.effects.map((e) => ({ ...e })),
  }));

  const fairIdx = outcomes.findIndex((o) => !String(o.id || '').endsWith('_ill'));
  const idx = fairIdx >= 0 ? fairIdx : 0;
  const fair = outcomes[idx];
  if (fair) {
    let effects = [...fair.effects];
    if (patch.narrate !== undefined) {
      let replaced = false;
      effects = effects.map((e) => {
        if (!replaced && e.type === 'narrate') {
          replaced = true;
          return { ...e, text: patch.narrate! };
        }
        return e;
      });
      if (!replaced) effects = [{ type: 'narrate', text: patch.narrate }, ...effects];
    }
    effects = upsertNumeric(effects, 'money', patch.money);
    effects = upsertNumeric(effects, 'health', patch.health);
    effects = upsertNumeric(effects, 'martial', patch.martial);
    effects = upsertNumeric(effects, 'reputation', patch.reputation);
    effects = upsertNumeric(effects, 'qi', patch.qi);
    effects = upsertNumeric(effects, 'maxQi', patch.maxQi);
    effects = upsertNumeric(effects, 'maxHealth', patch.maxHealth);
    outcomes[idx] = { ...fair, effects };
  }

  return { ...choice, text, outcomes };
}

export function applyEventPatch(event: GameEvent, patch: EventPatch | undefined): GameEvent {
  if (!patch) return event;
  const next: GameEvent = {
    ...event,
    choices: event.choices.map((c) => ({ ...c, outcomes: c.outcomes.map((o) => ({ ...o, effects: [...o.effects] })) })),
  };
  if (patch.title !== undefined) next.title = patch.title;
  if (patch.body !== undefined) next.body = patch.body;
  if (patch.disabled) next.weight = 0;
  else if (patch.weight !== undefined) next.weight = patch.weight;
  if (patch.choices) {
    next.choices = next.choices.map((ch) => {
      const cp = patch.choices![ch.id];
      return cp ? applyChoicePatch(ch, cp) : ch;
    });
  }
  return next;
}

export function applyEventPatches(events: GameEvent[]): GameEvent[] {
  loadEventOverrides();
  if (!Object.keys(memory.patches).length) return events;
  return events.map((ev) => applyEventPatch(ev, memory.patches[ev.id]));
}

/** 從現有事件抽出可編輯草稿（方便表單預填） */
export function draftPatchFromEvent(event: GameEvent): EventPatch {
  const existing = getEventPatch(event.id);
  const choices: Record<string, ChoicePatch> = {};
  for (const ch of event.choices) {
    const fair = ch.outcomes.find((o) => !String(o.id || '').endsWith('_ill')) || ch.outcomes[0];
    const num = (type: string) => {
      const hit = fair?.effects.find((e) => e.type === type) as { amount?: number } | undefined;
      return hit?.amount;
    };
    const narr = fair?.effects.find((e) => e.type === 'narrate') as { text?: string } | undefined;
    const base: ChoicePatch = {
      text: ch.text,
      narrate: narr?.text,
      money: num('money'),
      health: num('health'),
      martial: num('martial'),
      reputation: num('reputation'),
      qi: num('qi'),
      maxQi: num('maxQi'),
      maxHealth: num('maxHealth'),
    };
    const overlay = existing?.choices?.[ch.id];
    if (overlay) {
      const cleaned: ChoicePatch = { ...overlay };
      delete (cleaned as ChoicePatch & { riskPercent?: number }).riskPercent;
      choices[ch.id] = { ...base, ...cleaned };
    } else {
      choices[ch.id] = base;
    }
  }
  return {
    title: existing?.title ?? event.title,
    body: existing?.body ?? event.body ?? '',
    weight: existing?.weight ?? event.weight ?? 10,
    disabled: existing?.disabled ?? false,
    choices,
  };
}

export function summarizeOutcome(outcome: EventOutcome | undefined): string {
  if (!outcome) return '—';
  const bits: string[] = [];
  for (const e of outcome.effects) {
    if (e.type === 'narrate') continue;
    if ('amount' in e && typeof e.amount === 'number') {
      bits.push(`${e.type}${e.amount > 0 ? '+' : ''}${e.amount}`);
    } else if (e.type === 'learnSkill') {
      bits.push(`習得${e.name || e.skillId}`);
    }
  }
  return bits.join('；') || '敘事為主';
}
