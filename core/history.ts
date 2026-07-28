import type { GameState, GameTimestamp, HistoryEntry } from '@interfaces/game';
import { ids } from './ids';

export function formatTimestamp(ts: GameTimestamp): string {
  return `${ts.year}年${ts.month}月${ts.day}日`;
}

export function addHistory(
  state: GameState,
  text: string,
  importance: number,
  relatedCharacterIds: string[] = [],
): HistoryEntry {
  const entry: HistoryEntry = {
    id: ids.history(),
    timestamp: { ...state.timestamp },
    text,
    importance,
    relatedCharacterIds,
  };
  state.history.unshift(entry);
  if (state.history.length > 500) {
    state.history.length = 500;
  }
  return entry;
}

export function findMemoriesOfEvent(history: HistoryEntry[], characterName: string, yearsAgo: number, now: GameTimestamp): HistoryEntry[] {
  return history.filter(
    (h) =>
      h.text.includes(characterName) &&
      now.year - h.timestamp.year <= yearsAgo &&
      h.importance >= 40,
  );
}
