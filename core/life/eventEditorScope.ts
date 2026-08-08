import type { GameEvent } from '@interfaces/lifeEngine';

/**
 * 手機事件編修器唔開放嘅事件：
 * - 故人短弧／回訪（動態或標記 arc）
 * - 挑戰帖／戰書類，以及「回帖改期」「改日再說」等改期選項
 */
export function isEventEditorExcluded(
  ev: Pick<GameEvent, 'id' | 'title' | 'tags' | 'choices'>,
): boolean {
  const tags = ev.tags ?? [];
  if (tags.includes('arc')) return true;
  if (ev.id.startsWith('arc_visit_')) return true;
  if (/挑戰帖|戰書/.test(ev.title)) return true;
  if (ev.choices.some((c) => /回帖改期|改日再說/.test(c.text))) return true;
  return false;
}

export function filterEventsForEditor<T extends Pick<GameEvent, 'id' | 'title' | 'tags' | 'choices'>>(
  events: T[],
): T[] {
  return events.filter((ev) => !isEventEditorExcluded(ev));
}
