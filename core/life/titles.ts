import type { LifeGameState } from '@interfaces/lifeEngine';

/** 輕量綽號：不做成任務清單，只在狀態夠格時掛名 */
const TITLE_RULES: Array<{ id: string; label: string; test: (s: LifeGameState) => boolean }> = [
  { id: 'title_ink_hand', label: '墨手', test: (s) => (s.character.stats.eventsSeen ?? 0) >= 40 },
  { id: 'title_blade_scar', label: '刀疤客', test: (s) => (s.character.stats.combatsWon ?? 0) >= 8 },
  { id: 'title_soft_hand', label: '手軟', test: (s) => Number(s.character.flags.aftermath_stun_soft ?? 0) >= 3 },
  { id: 'title_sect_disciple', label: '門中人', test: (s) => Boolean(s.character.sectId) },
  { id: 'title_rich', label: '囊豐', test: (s) => (s.character.stats.wealthPeak ?? 0) >= 300 },
  { id: 'title_elder', label: '暮年客', test: (s) => s.character.age >= 60 },
  { id: 'title_lover', label: '有眷', test: (s) => (s.character.stats.lovers ?? 0) >= 1 },
  { id: 'title_huashan', label: '論劍客', test: (s) => Boolean(s.character.flags.huashan_ever) },
];

function readTitleIds(state: LifeGameState): string[] {
  const raw = state.character.flags.titles;
  if (typeof raw !== 'string' || !raw.trim()) return [];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

function writeTitleIds(state: LifeGameState, ids: string[]): void {
  state.character.flags.titles = ids.join(',');
}

export function syncTitles(state: LifeGameState): string[] {
  const have = new Set(readTitleIds(state));
  const gained: string[] = [];
  for (const rule of TITLE_RULES) {
    if (have.has(rule.id)) continue;
    if (!rule.test(state)) continue;
    have.add(rule.id);
    gained.push(rule.label);
  }
  writeTitleIds(state, [...have]);
  return gained.map((label) => `江湖上開始有人稱你「${label}」。`);
}

export function titleLabels(state: LifeGameState): string[] {
  const ids = readTitleIds(state);
  return TITLE_RULES.filter((r) => ids.includes(r.id)).map((r) => r.label);
}
