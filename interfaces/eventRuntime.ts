import type { EventRequirement, GameEvent } from './lifeEngine';

/** 結算路徑：effects = GameEffect 管線；pack = Pack v1 op/path */
export type EventResolveMode = 'effects' | 'pack';

/** 統一運行時視圖（不改寫來源 JSON） */
export interface RuntimeEventView {
  id: string;
  title: string;
  body?: string;
  tags: string[];
  weight: number;
  requirements?: EventRequirement;
  choices: Array<{
    id: string;
    text: string;
    requirements?: EventRequirement;
  }>;
  resolveMode: EventResolveMode;
}

export function resolveModeOf(event: GameEvent): EventResolveMode {
  return (event.tags ?? []).includes('pack') ? 'pack' : 'effects';
}

export function toRuntimeView(event: GameEvent): RuntimeEventView {
  return {
    id: event.id,
    title: event.title,
    body: event.body,
    tags: event.tags ?? [],
    weight: event.weight ?? 10,
    requirements: event.requirements,
    choices: event.choices.map((c) => ({
      id: c.id,
      text: c.text,
      requirements: c.requirements,
    })),
    resolveMode: resolveModeOf(event),
  };
}

/** 目錄編譯索引：id → event（供覆蓋／短弧查找） */
export function compileEventIndex(events: GameEvent[]): Map<string, GameEvent> {
  const map = new Map<string, GameEvent>();
  for (const e of events) map.set(e.id, e);
  return map;
}
