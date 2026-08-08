import type { GameEvent } from '@interfaces/lifeEngine';

/** 編修器搜尋：含 id／標題／正文／選項文字／結果敘事 */
export function eventMatchesEditorQuery(
  ev: Pick<GameEvent, 'id' | 'title' | 'body' | 'choices'>,
  rawQuery: string,
): boolean {
  const needle = rawQuery.trim().toLowerCase();
  if (!needle) return true;
  if (ev.id.toLowerCase().includes(needle)) return true;
  if (ev.title.toLowerCase().includes(needle)) return true;
  if ((ev.body ?? '').toLowerCase().includes(needle)) return true;
  for (const ch of ev.choices) {
    if (ch.text.toLowerCase().includes(needle)) return true;
    if (ch.id.toLowerCase().includes(needle)) return true;
    for (const o of ch.outcomes) {
      if ((o.label ?? '').toLowerCase().includes(needle)) return true;
      for (const e of o.effects) {
        if (e.type === 'narrate' && e.text.toLowerCase().includes(needle)) return true;
      }
    }
  }
  return false;
}
